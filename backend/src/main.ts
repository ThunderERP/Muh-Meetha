import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ─── Security Headers ──────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));

  // ─── Compression ──────────────────────────────────────────────────────────
  app.use(compression());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Allow the configured production frontend URL, any extra origins listed in
  // ALLOWED_ORIGINS (comma-separated), and — since Vercel preview deployments
  // get a new random subdomain on every push — any *.vercel.app origin too.
  // This avoids having to update FRONTEND_URL on every single deploy.
  const staticAllowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || []),
  ];

  const isVercelPreviewOrigin = (origin: string): boolean => {
    try {
      const { hostname, protocol } = new URL(origin);
      return protocol === 'https:' && hostname.endsWith('.vercel.app');
    } catch {
      return false;
    }
  };

  app.enableCors({
    origin: (origin, callback) => {
      // No origin header (e.g. curl, server-to-server, same-origin) — allow.
      if (!origin) return callback(null, true);

      if (staticAllowedOrigins.includes(origin) || isVercelPreviewOrigin(origin)) {
        return callback(null, true);
      }

      logger.warn(`Blocked CORS request from disallowed origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  });

  // ─── Global Prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,          // auto-transform DTOs
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global Exception Filter ──────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Swagger ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ThunderERP API')
      .setDescription('ThunderERP Backend — v1')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'X-Tenant-ID')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log('Swagger docs: http://localhost:3001/api/docs');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`ThunderERP API running on port ${port}`);
}

bootstrap();
