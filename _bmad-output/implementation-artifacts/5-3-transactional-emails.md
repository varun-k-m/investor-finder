# Story S5-003: Transactional Email Service Stub (Resend key deferred)

## User Story
As a developer, I want an EmailService wired into the application so that transactional emails can be activated simply by adding the RESEND_API_KEY environment variable.

## Acceptance Criteria

1. `EmailService` is created in a new `EmailModule` with two methods: `sendWelcomeEmail` and `sendSearchCompleteEmail`
2. Both methods check for `RESEND_API_KEY` — if missing, log a warning and return immediately (no error thrown)
3. The Resend SDK IS installed (`npm install resend`) but `new Resend(apiKey)` is only instantiated when the key is present
4. `sendWelcomeEmail(to, name)` — sends welcome email with subject "Welcome to InvestorMatch — find your investors"
5. `sendSearchCompleteEmail(to, name, searchId, resultCount, rawInput)` — sends "Your investor search is ready — X investors found" email
6. Both methods are called fire-and-forget (`.catch(logger.error)`) — never block the request/job path
7. `sendWelcomeEmail` is called in the Clerk `user.created` webhook handler (after user saved to DB)
8. `sendSearchCompleteEmail` is called in the BullMQ job processor after search status is set to `complete` (locate where `status: 'complete'` is set in `DiscoveryService` or the job processor)
9. HTML email templates are simple inline-styled HTML (no external template engine needed)
10. Unit tests mock the Resend client and verify: (a) methods no-op when key is missing, (b) `resend.emails.send` called with correct args when key is present
11. Full backend test suite passes with 0 failures

## Technical Context

**Architecture refs:** §3 (Resend), §6.2 (BullMQ job)

**Env vars (deferred — not needed now):**
- `RESEND_API_KEY` — Railway env var (add later)
- `EMAIL_FROM` — Railway env var (default: `"InvestorMatch <noreply@investormatch.ai>"`)
- `FRONTEND_URL` — Railway env var (used in email links; default: `"https://investor-finder-frontend.vercel.app"`)

**Install Resend SDK:**
```bash
cd backend && npm install resend
```

**`backend/src/email/email.service.ts`:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

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
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'InvestorMatch <noreply@investormatch.ai>';
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://investor-finder-frontend.vercel.app';
  }

  async sendWelcomeEmail(to: string, name: string | null): Promise<void> {
    if (!this.resend) return;
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Welcome to InvestorMatch — find your investors',
      html: this.welcomeTemplate(name, this.frontendUrl),
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

  private welcomeTemplate(name: string | null, dashboardUrl: string): string {
    const greeting = name ? `Welcome, ${name}!` : 'Welcome to InvestorMatch!';
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b">${greeting}</h1>
        <p style="color:#475569;line-height:1.6">
          InvestorMatch uses AI to find the perfect investors for your startup in seconds.
          Describe your idea, and we'll search thousands of investors to surface the best matches.
        </p>
        <a href="${dashboardUrl}/dashboard"
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
```

**`backend/src/email/email.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

**Wire welcome email — locate `user.created` Clerk webhook handler:**
Check `backend/src/auth/auth.service.ts` or `auth.controller.ts` for where the user is created from the Clerk webhook. After `usersService.create(...)` succeeds:
```typescript
// fire-and-forget
this.emailService.sendWelcomeEmail(user.email, user.name)
  .catch((err) => this.logger.error('Welcome email failed', err));
```
Import `EmailModule` into `AuthModule`.

**Wire search complete email — locate where search status → 'complete':**
Search for `status: 'complete'` in the backend codebase — likely in `backend/src/agents/discovery.service.ts` or the BullMQ processor. After the status update and before the job resolves:
```typescript
// fire-and-forget
this.emailService.sendSearchCompleteEmail(user.email, user.name, searchId, resultCount, rawInput)
  .catch((err) => this.logger.error('Search complete email failed', err));
```
Import `EmailModule` into `AgentModule` (or whichever module contains the job processor).

**Unit tests (`email.service.spec.ts`):**
```typescript
describe('EmailService', () => {
  describe('when RESEND_API_KEY is not set', () => {
    it('sendWelcomeEmail should return without calling resend', async () => { ... });
    it('sendSearchCompleteEmail should return without calling resend', async () => { ... });
  });
  describe('when RESEND_API_KEY is set', () => {
    it('sendWelcomeEmail should call resend.emails.send with correct args', async () => { ... });
    it('sendSearchCompleteEmail should call resend.emails.send with correct args', async () => { ... });
  });
});
```
Mock `resend` module: `jest.mock('resend')` — mock `Resend` class and its `emails.send` method.

## Tasks

- [x] Install `resend` in backend: `cd backend && npm install resend`
- [x] Create `backend/src/email/email.module.ts`
- [x] Create `backend/src/email/email.service.ts` with `sendWelcomeEmail` and `sendSearchCompleteEmail`; gated on `RESEND_API_KEY`
- [x] Write `backend/src/email/email.service.spec.ts` — test no-op and send paths
- [x] Import `EmailModule` into `AppModule`
- [x] Locate `user.created` Clerk webhook handler; inject `EmailService`; add fire-and-forget welcome email call
- [x] Locate where search status is set to `complete`; inject `EmailService`; add fire-and-forget search complete email call
- [x] Run full backend test suite — 0 failures

## File List
- `backend/src/email/email.module.ts` (new)
- `backend/src/email/email.service.ts` (new)
- `backend/src/email/email.service.spec.ts` (new)
- `backend/src/app.module.ts` (modified — import EmailModule)
- `backend/src/auth/auth.service.ts` or `auth.controller.ts` (modified — welcome email)
- `backend/src/agents/discovery.service.ts` or BullMQ processor (modified — search complete email)

## Dev Agent Record

### Completion Notes
- `resend` installed in backend
- `EmailModule` + `EmailService` created; `Resend` only instantiated when `RESEND_API_KEY` present — no-op otherwise
- HTML templates: welcome (dashboard link) + search-complete (truncated input + search link)
- `ClerkWebhookController`: injects `EmailService`, fires welcome email on `user.created` only (not updates)
- `DiscoveryService`: injects `EmailService`, fires search-complete email after `status: complete` update; looks up user via `findOne` with `relations: ['user']`
- `EmailModule` imported into `AppModule`, `AuthModule`, and `AgentsModule`
- `discovery.service.spec.ts` updated: added `EmailService` mock + `findOne` to all `searchRepo` mocks
- 8 new email tests + 105/105 total ✅

### Change Log
- S5-003 (2026-04-10): Email service stub — Resend SDK wired, gated on RESEND_API_KEY, welcome + search-complete emails fire-and-forget
