import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SearchesModule } from './searches/searches.module';
import { InvestorsModule } from './investors/investors.module';
import { AgentsModule } from './agents/agents.module';
import { DatabaseModule } from './database/database.module';
import { UserThrottlerGuard } from './common/guards/throttler.guard';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // [Source: docs/architecture.md#Section 7.3] — ThrottlerModule config: 30 req / 60s
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    // [Source: docs/architecture.md#Section 3] — BullMQ + Redis (Upstash)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),
    AuthModule,
    UsersModule,
    SearchesModule,
    InvestorsModule,
    AgentsModule,
    DatabaseModule,
    EmailModule,
  ],
  providers: [
    // ClerkGuard registered first (in AuthModule) — ThrottlerGuard runs after auth
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}
