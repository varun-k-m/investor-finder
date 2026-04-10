import {
  Controller,
  Logger,
  Post,
  Req,
  Res,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { Request, Response } from 'express';
import { Public } from './public.decorator';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

interface ClerkUserPayload {
  id: string;
  primary_email_address_id: string;
  email_addresses: { id: string; email_address: string }[];
  first_name: string | null;
  last_name: string | null;
}

@Controller()
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  @Post('auth/webhook')
  @Public()
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    const wh = new Webhook(secret);

    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing svix headers');
    }

    let event: { type: string; data: ClerkUserPayload };
    try {
      const payload =
        req.body instanceof Buffer
          ? req.body.toString('utf8')
          : JSON.stringify(req.body);

      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: ClerkUserPayload };
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { type, data } = event;

    if (type === 'user.created' || type === 'user.updated') {
      const primaryEmail = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
      await this.usersService.upsertFromClerk({
        clerkId: data.id,
        email: primaryEmail?.email_address ?? '',
        name,
      });

      // Fire-and-forget welcome email on new user creation
      if (type === 'user.created') {
        this.emailService
          .sendWelcomeEmail(primaryEmail?.email_address ?? '', name)
          .catch((err) => this.logger.error('Failed to send welcome email', err));
      }
    }

    return res.json({ received: true });
  }
}
