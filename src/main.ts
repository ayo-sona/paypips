import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
    // bodyParser: true, // Optional
  });

  const configService = app.get(ConfigService);

  // Security: Helmet
  app.use(helmet());

  // Security: Cookie parser (for refresh tokens)
  app.use(cookieParser());

  // Performance: Compression
  app.use(compression());

  // Global prefix
  const apiPrefix = configService.get('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const allowedOrigins = [
    configService.get('frontend.url'),
    'https://paypips.vercel.app',
  ];
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    // origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configure JSON parser with raw body for webhooks
  app.use(
    json({
      verify: (req: any, res, buf) => {
        // Store raw body for webhook signature verification
        if (req.url.includes('/webhooks')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Force HTTPS
  if (configService.get('app.nodeEnv') === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Renova API')
    .setDescription('The Renova API documentation')
    .setVersion('1.0')
    .setContact('Renova', 'https://paypips.vercel.app', 'keneusih@gmail.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in the controller
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('app.port');
  await app.listen(port);

  console.log(`💰️ Renova API running on http://localhost:${port}/${apiPrefix}`);
  console.log(
    `📡 Webhook endpoint: http://localhost:${port}/${apiPrefix}/webhooks/paystack`,
  );
}

bootstrap();
