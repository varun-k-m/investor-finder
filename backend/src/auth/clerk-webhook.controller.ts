import {
  Controller,
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

interface ClerkUserPayload {
  id: string;
  primary_email_address_id: string;
  email_addresses: { id: string; email_address: string }[];
  first_name: string | null;
  last_name: string | null;
}

@Controller()
export class ClerkWebhookController {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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
      // req.body is the raw Buffer when rawBody middleware is active
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
      await this.usersService.upsertFromClerk({
        clerkId: data.id,
        email: primaryEmail?.email_address ?? '',
        name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
      });
    }

    return res.json({ received: true });
  }
}
