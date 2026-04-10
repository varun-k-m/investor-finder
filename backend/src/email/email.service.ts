import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/** [Source: docs/architecture.md#Section 3 — Resend email] */
@Injectable()
export class EmailService {
  private readonly resend: Resend | null = null;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — email sending disabled');
    }
    this.from =
      this.config.get<string>('EMAIL_FROM') ?? 'InvestorMatch <noreply@investormatch.ai>';
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'https://investor-finder-frontend.vercel.app';
  }

  async sendWelcomeEmail(to: string, name: string | null): Promise<void> {
    if (!this.resend) return;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Welcome to InvestorMatch — find your investors',
      html: this.welcomeTemplate(name),
    });
  }

  async sendSearchCompleteEmail(
    to: string,
    name: string | null,
    searchId: string,
    resultCount: number,
    rawInput: string,
  ): Promise<void> {
    if (!this.resend) return;
    const searchUrl = `${this.frontendUrl}/search/${searchId}`;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Your investor search is ready — ${resultCount} investors found`,
      html: this.searchCompleteTemplate(name, searchUrl, resultCount, rawInput),
    });
  }

  private welcomeTemplate(name: string | null): string {
    const greeting = name ? `Welcome, ${name}!` : 'Welcome to InvestorMatch!';
    const dashboardUrl = `${this.frontendUrl}/dashboard`;
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b">${greeting}</h1>
        <p style="color:#475569;line-height:1.6">
          InvestorMatch uses AI to find the perfect investors for your startup in seconds.
          Describe your idea, and we'll search thousands of investors to surface the best matches.
        </p>
        <a href="${dashboardUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px">
          Open Dashboard →
        </a>
      </div>`;
  }

  private searchCompleteTemplate(
    name: string | null,
    searchUrl: string,
    resultCount: number,
    rawInput: string,
  ): string {
    const truncated = rawInput.length > 100 ? rawInput.slice(0, 100) + '…' : rawInput;
    const greeting = name ? `Hi ${name},` : 'Hi there,';
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="font-size:20px;font-weight:700;color:#1e293b">Your investor search is ready!</h2>
        <p style="color:#475569">${greeting}</p>
        <p style="color:#475569;line-height:1.6">
          We found <strong>${resultCount} investors</strong> matching your idea:
        </p>
        <p style="color:#64748b;font-style:italic;padding:12px;background:#f8fafc;border-left:3px solid #e2e8f0;border-radius:4px">
          "${truncated}"
        </p>
        <a href="${searchUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px">
          View Investors →
        </a>
      </div>`;
  }
}
