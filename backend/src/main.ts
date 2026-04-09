import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
