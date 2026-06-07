import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { readNumberEnv } from '@ecobairro/config';

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:8080';
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Fix #2: trust proxy correcto (nginx à frente) — req.ip usa X-Forwarded-For do proxy
  app.set('trust proxy', 1);

  // Fix #7: security headers (Clickjacking, MIME sniff, CSP, etc.)
  app.use(helmet());

  // Fix #3: suporte a cookies HttpOnly
  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('v1', {
    exclude: ['health', 'ready'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = readNumberEnv('PORT', 3000);

  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start API service', error);
  process.exit(1);
});

