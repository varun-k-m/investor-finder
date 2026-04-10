import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClerkGuard } from './clerk.guard';
import { ClerkStrategy } from './clerk.strategy';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UsersModule, EmailModule],
  controllers: [ClerkWebhookController],
  providers: [
    ClerkStrategy,
    {
      provide: APP_GUARD,
      useClass: ClerkGuard,
    },
  ],
  exports: [ClerkStrategy],
})
export class AuthModule {}
