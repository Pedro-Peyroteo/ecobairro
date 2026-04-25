import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readNumberEnv } from '@ecobairro/config';

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: corsOrigin,
    },
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

