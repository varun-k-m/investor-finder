import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';

// Sentry must be initialised before the app is created [Source: arch §3]
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  // Dynamic require so the import only fires when Sentry is configured
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Sentry = require('@sentry/nestjs') as typeof import('@sentry/nestjs');
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_package_version,
    beforeSend(event) {
      // Do not capture HTTP 4xx — only report server errors
      const status = event.extra?.['http.response.status_code'] as number | undefined;
      if (status && status < 500) return null;
      return event;
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Wire Sentry express error handler (captures unhandled 5xx) when DSN is set
  if (sentryDsn) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setupExpressErrorHandler } = require('@sentry/nestjs') as typeof import('@sentry/nestjs');
    const httpAdapter = app.getHttpAdapter();
    setupExpressErrorHandler(httpAdapter.getInstance());
  }

  // Raw body for Clerk webhook — svix requires exact bytes for HMAC verification.
  // Must be registered BEFORE the global JSON body parser. [Source: arch §12]
  app.use(
    '/api/v1/auth/webhook',
    express.raw({ type: 'application/json' }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe — enforces all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true, // Auto-transform types (string → number etc.)
    }),
  );

  // Swagger — auto-generated API docs at /api/docs
  const config = new DocumentBuilder()
    .setTitle('InvestorMatch API')
    .setVersion('1.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  // CORS for Next.js frontend
  app.enableCors({ origin: process.env.NEXT_PUBLIC_APP_URL });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
