import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { winstonConfig } from './config/winston';

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';

/**
 * Configure global application settings
 */
function configureApp(app: any) {
  // Enable API versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

/**
 * Setup Swagger documentation for non-production environments
 */
function setupSwagger(app: any, configService: ConfigService, logger: Logger) {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  if (nodeEnv === 'production') {
    logger.log('Swagger documentation disabled in production environment');
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription('API documentation for the NestJS backend application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('port') || DEFAULT_PORT;
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(app: any, logger: Logger) {
  const shutdown = async () => {
    try {
      await app.close();
      logger.log('Application is shutting down...');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

/**
 * Setup global error handlers
 */
function setupErrorHandlers(logger: Logger) {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason);
  });
}

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create the NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger(winstonConfig),
      abortOnError: false,
    });

    // Configure application
    configureApp(app);

    // Get configuration service
    const configService = app.get(ConfigService);
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
    const port = configService.get<number>('port') || DEFAULT_PORT;
    const host = configService.get<string>('host') || DEFAULT_HOST;

    // Setup Swagger documentation
    setupSwagger(app, configService, logger);

    // Setup shutdown and error handlers
    setupShutdownHandlers(app, logger);
    setupErrorHandlers(logger);

    // Start the application
    await app.listen(port, host);

    logger.log(`Application is running on: http://${host}:${port}`);
    logger.log(`Environment: ${nodeEnv}`);
  } catch (error) {
    logger.error('Failed to start application', error.stack);
    process.exit(1);
  }
}

bootstrap();
