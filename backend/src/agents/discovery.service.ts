import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea, RankedInvestor, SynthesisedInvestor } from '../common/types';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { Search } from '../searches/entities/search.entity';
import { CrunchbaseService } from './sources/crunchbase.service';
import { WebSearchService } from './sources/web-search.service';
import { NewsSignalService } from './sources/news-signal.service';
import { SynthesisService } from './synthesis.service';
import { RankingService } from './ranking.service';
import { AgentProgressStore } from '../searches/agent-progress.store';
import { EmailService } from '../email/email.service';

// ─── Tool definitions ─────────────────────────────────────────────────────────

/** Claude's built-in web search — API executes it, we can't read encrypted_content but Claude can. */
const CLAUDE_WEB_SEARCH: Anthropic.Messages.WebSearchTool20250305 = {
  type: 'web_search_20250305',
  name: 'web_search',
};

/**
 * Tools available to Claude in the agentic loop.
 * search_crunchbase and search_news are intentionally excluded —
 * they are pre-seeded in parallel before the loop starts.
 */
const INVESTOR_TOOLS: Anthropic.ToolUnion[] = [
  CLAUDE_WEB_SEARCH,
  {
    name: 'search_web',
    description:
      'Structured web search that returns raw page content. ' +
      'Use for targeted queries like "fintech seed investors India 2025" or ' +
      '"top B2B SaaS venture capital firms check size thesis". ' +
      'Set include_raw_content=true when you need detailed thesis or check-size info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        include_raw_content: { type: 'boolean' },
      },
      required: ['query'],
    },
  },
];

// ─── Discovery loop messages ──────────────────────────────────────────────────

const LOOP_MESSAGES = [
  'Scanning investor networks',
  'Exploring VC fund portfolios',
  'Discovering investment activity',
  'Cross-referencing databases',
  'Expanding sector coverage',
  'Finalizing discovery',
];

// ─── Orchestrator prompt ──────────────────────────────────────────────────────

const ORCHESTRATOR_SYSTEM_PROMPT = `You are an expert startup fundraising agent. Your job is to find the most relevant investors for a given startup.

Crunchbase and news searches have already been run and their results are pre-loaded. Your job is web discovery only.

You have two tools:
- web_search: Claude's built-in web search. Use for broad discovery — investor directories, curated lists, fund pages, portfolio pages.
- search_web: Structured search returning raw page content. Use when you need check size or thesis details (set include_raw_content=true).

Strategy:
1. Make 2–3 web_search calls with varied queries (sector + stage, sector + geography, sub-sector specific).
2. Follow up with 1 search_web call using include_raw_content=true to extract check sizes and thesis details.
3. Stop after 4 tool calls or once you have found 10+ additional investors beyond what is pre-loaded.

Do not return any text — only use the tools. When you are done, stop calling tools.`;

/** [Source: docs/architecture.md#Section 6.2] */
@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly crunchbase: CrunchbaseService,
    private readonly webSearch: WebSearchService,
    private readonly newsSignal: NewsSignalService,
    private readonly synthesis: SynthesisService,
    private readonly ranking: RankingService,
    private readonly progressStore: AgentProgressStore,
    private readonly emailService: EmailService,
    @Inject('ANTHROPIC_CLIENT')
    private readonly anthropic: Anthropic,
    @InjectRepository(InvestorProfile)
    private readonly investorRepo: Repository<InvestorProfile>,
    @InjectRepository(Search)
    private readonly searchRepo: Repository<Search>,
  ) {}

  async run(searchId: string, parsedIdea: ParsedIdea): Promise<void> {
    try {
      await this.searchRepo.update({ id: searchId }, { status: 'running' });
      this.progressStore.emit(searchId, 'searching', 10, 'Running initial investor queries…');

      // ── Pre-seed: run Crunchbase + news in parallel before the loop ─────
      const [cbResult, newsResult] = await Promise.allSettled([
        this.crunchbase.search(parsedIdea),
        this.newsSignal.search(parsedIdea),
      ]);

      const rawBuffer: SynthesisedInvestor[] = [
        ...(cbResult.status === 'fulfilled' ? cbResult.value : []),
        ...(newsResult.status === 'fulfilled' ? newsResult.value : []),
      ];
      this.logger.log(
        `Pre-seed: ${rawBuffer.length} records (crunchbase=${cbResult.status === 'fulfilled' ? cbResult.value.length : 'failed'}, news=${newsResult.status === 'fulfilled' ? newsResult.value.length : 'failed'})`,
      );
      this.progressStore.emit(
        searchId,
        'searching',
        25,
        `Found ${rawBuffer.length} signals — launching AI discovery`,
      );

      // ── Agentic loop: Claude handles web discovery only ──────────────────
      let loopIteration = 0;
      const messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content:
            `Find investors for this startup:\n${JSON.stringify(parsedIdea, null, 2)}\n\n` +
            `Crunchbase and news have already been searched (${rawBuffer.length} records pre-loaded). ` +
            `Use web_search and search_web to find additional investors not covered by those sources.`,
        },
      ];

      let response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: ORCHESTRATOR_SYSTEM_PROMPT,
        tools: INVESTOR_TOOLS,
        messages,
      });

      let toolCallCount = 0;
      const MAX_TOOL_CALLS = 4; // Claude targets 3–4 web calls; hard cap prevents runaway

      while (response.stop_reason === 'tool_use' && toolCallCount < MAX_TOOL_CALLS) {
        // Extract any web_search_tool_result blocks Claude produced via its built-in tool
        const webSearchRecords = this.extractClaudeWebSearchResults(response.content);
        if (webSearchRecords.length > 0) {
          rawBuffer.push(...webSearchRecords);
          this.logger.log(
            `Claude web_search: +${webSearchRecords.length} records from built-in search (buffer: ${rawBuffer.length})`,
          );
        }

        // Only our custom tools require client-side execution
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );

        // Execute all tool calls in parallel
        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (block) => {
            const results = await this.executeTool(block, parsedIdea);
            rawBuffer.push(...results);
            this.logger.log(
              `Tool ${block.name}: +${results.length} records (buffer: ${rawBuffer.length})`,
            );
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: `Found ${results.length} investor records. Buffer total: ${rawBuffer.length}.`,
            };
          }),
        );

        toolCallCount += toolUseBlocks.length;
        loopIteration++;

        const loopMsg = LOOP_MESSAGES[Math.min(loopIteration - 1, LOOP_MESSAGES.length - 1)];
        const loopPct = Math.min(30 + loopIteration * 5, 55);
        this.progressStore.emit(
          searchId,
          'searching',
          loopPct,
          `${loopMsg} · ${rawBuffer.length} investors found`,
        );

        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });

        response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: ORCHESTRATOR_SYSTEM_PROMPT,
          tools: INVESTOR_TOOLS,
          messages,
        });
      }

      this.logger.log(
        `Discovery: agentic loop complete — ${toolCallCount} tool calls, ${rawBuffer.length} raw records`,
      );

      // ── Synthesis ────────────────────────────────────────────────────────
      this.progressStore.emit(
        searchId,
        'synthesis',
        60,
        `Merging & deduplicating ${rawBuffer.length} investor records…`,
      );
      const synthesised = await this.synthesis.synthesise(rawBuffer, parsedIdea);
      this.logger.log(`Discovery: synthesised ${synthesised.length} investors`);

      // ── Ranking ──────────────────────────────────────────────────────────
      this.progressStore.emit(
        searchId,
        'ranking',
        80,
        `Scoring fit for ${synthesised.length} investors…`,
      );
      const ranked = await this.ranking.rank(synthesised, parsedIdea);
      this.logger.log(`Discovery: ranked ${ranked.length} investors`);

      await this.persistInvestors(ranked, searchId);

      await this.searchRepo.update(
        { id: searchId },
        { status: 'complete', result_count: ranked.length, completed_at: new Date() },
      );
      this.progressStore.complete(searchId);

      // Fire-and-forget search complete email
      const search = await this.searchRepo.findOne({
        where: { id: searchId },
        relations: ['user'],
      });
      if (search?.user) {
        this.emailService
          .sendSearchCompleteEmail(
            search.user.email,
            search.user.name,
            searchId,
            ranked.length,
            search.raw_input,
          )
          .catch((err) => this.logger.error('Failed to send search complete email', err));
      }
    } catch (err) {
      this.logger.error(`Discovery failed for search ${searchId}`, err);
      this.progressStore.emit(searchId, 'failed', 0);
      this.progressStore.complete(searchId);
      await this.searchRepo.update({ id: searchId }, { status: 'failed' }).catch(() => undefined);
    }
  }

  // ─── Claude web search result extractor ────────────────────────────────────

  /**
   * Pulls title + URL from `web_search_tool_result` blocks produced by Claude's
   * built-in web search. The page content is encrypted (Claude reads it in
   * context; we can't), so we create minimal records that SynthesisService
   * can enrich with whatever Claude already knows from those pages.
   */
  private extractClaudeWebSearchResults(
    content: Anthropic.Messages.ContentBlock[],
  ): SynthesisedInvestor[] {
    const records: SynthesisedInvestor[] = [];
    for (const block of content) {
      if (block.type !== 'web_search_tool_result') continue;
      const results = Array.isArray(block.content) ? block.content : [];
      for (const result of results) {
        if (result.type !== 'web_search_result') continue;
        records.push({
          canonical_name: result.title ?? 'Unknown',
          fund_name: null,
          website: result.url ?? null,
          sectors: [],
          stages: [],
          geo_focus: [],
          check_min: null,
          check_max: null,
          contact_email: null,
          linkedin_url: null,
          sources: ['claude_web_search'],
          source_urls: result.url ? [result.url] : [],
          conflicts: [],
        });
      }
    }
    return records;
  }

  // ─── Tool executor ─────────────────────────────────────────────────────────

  private async executeTool(
    block: Anthropic.ToolUseBlock,
    _parsedIdea: ParsedIdea,
  ): Promise<SynthesisedInvestor[]> {
    switch (block.name) {
      case 'search_web': {
        const input = block.input as { query: string; include_raw_content?: boolean };
        return this.webSearch.searchByQuery(input.query, input.include_raw_content ?? false);
      }
      default:
        this.logger.warn(`Unknown tool requested: ${block.name}`);
        return [];
    }
  }

  // ─── Persistence ───────────────────────────────────────────────────────────

  private async persistInvestors(ranked: RankedInvestor[], searchId: string): Promise<void> {
    if (ranked.length === 0) return;
    const entities = ranked.map((inv) =>
      this.investorRepo.create({
        search_id: searchId,
        canonical_name: inv.canonical_name,
        fund_name: inv.fund_name,
        website: inv.website,
        sectors: inv.sectors,
        stages: inv.stages,
        geo_focus: inv.geo_focus,
        check_min: inv.check_min,
        check_max: inv.check_max,
        contact_email: inv.contact_email,
        linkedin_url: inv.linkedin_url,
        sources: inv.sources,
        source_urls: inv.source_urls,
        fit_score: inv.overall,
        sector_fit: inv.sector_fit,
        stage_fit: inv.stage_fit,
        budget_fit: inv.budget_fit,
        geo_fit: inv.geo_fit,
        fit_reasoning: inv.fit_reasoning,
        rank_position: inv.rank_position,
      }),
    );
    await this.investorRepo.save(entities);
  }
}
