import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ClerkStrategy holds Clerk configuration for use in NestJS DI.
 * Exposes the secretKey for services that need to make Clerk API calls.
 */
@Injectable()
export class ClerkStrategy {
  constructor(private readonly configService: ConfigService) {}

  getSecretKey(): string {
    return this.configService.get<string>('CLERK_SECRET_KEY') ?? '';
  }
}
