import { Body, Controller, Get, HttpCode, Param, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SearchesService, SseMessageEvent } from './searches.service';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { QuotaGuard } from '../common/guards/quota.guard';
import { CreateSearchDto } from './dto/create-search.dto';
import { InvestorQueryDto } from './dto/investor-query.dto';

/** [Source: docs/architecture.md#Section 7.4] */
@Controller('searches')
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  /** S3-001: AC 1–7 */
  @Post()
  @HttpCode(202)
  @UseGuards(QuotaGuard)
  async create(
    @Body() dto: CreateSearchDto,
    @CurrentUser() user: { sub: string },
  ): Promise<{ id: string; status: string }> {
    return this.searchesService.create(dto, user.sub);
  }

  /** S3-002: AC 1–4 */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.searchesService.findOne(id, user.sub);
  }

  /** S3-003: AC 1–6 */
  @Get(':id/investors')
  async findInvestors(
    @Param('id') id: string,
    @Query() query: InvestorQueryDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.searchesService.findInvestors(id, user.sub, query);
  }

  @Sse(':id/stream')
  @Public()
  stream(@Param('id') id: string): Observable<SseMessageEvent> {
    return this.searchesService.getProgressStream(id);
  }
}
