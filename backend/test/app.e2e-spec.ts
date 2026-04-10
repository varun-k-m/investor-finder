/**
 * Integration test bootstrap.
 *
 * REQUIRES: TEST_DATABASE_URL env var pointing to a real PostgreSQL database.
 * These tests are NOT included in the standard `npm test` run (which only covers src/**\/*.spec.ts).
 * Run with: npm run test:e2e
 *
 * The test module replaces ClerkGuard with TestClerkGuard so routes can be called
 * without a real Clerk JWT — just pass x-test-clerk-id header with a seeded clerk_id.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TestClerkGuard } from './helpers/auth';

// Lazy-import app modules — only resolves when file is actually executed
export async function createTestApp(): Promise<INestApplication> {
  const { AppModule } = await import('../src/app.module');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(APP_GUARD)
    .useClass(TestClerkGuard)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  return app;
}

export { ConfigModule, TypeOrmModule };
