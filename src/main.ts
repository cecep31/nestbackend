import {
  Logger,
  ConsoleLogger,
  INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule, ObserveInstrument } from './app.module';

const DEFAULT_HOST = '0.0.0.0';

/**
 * Configure global application settings
 */
function configureApp(app: INestApplication) {
  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Global standard schema validation pipe (NestJS 12 native Standard Schema support)
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      transform: true,
    }),
  );
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
    const message =
      reason instanceof Error
        ? reason.stack || reason.message
        : JSON.stringify(reason);
    logger.error('Unhandled Rejection', message);
  });
}

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const appLogger = new ConsoleLogger({
    json: isProduction,
    structuredParams: true,
    flattenParams: true,
  });

  const logger = new Logger('Bootstrap');

  try {
    // Create the NestJS application with NestJS 12 features
    const app = await NestFactory.create(AppModule, {
      logger: appLogger,
      abortOnError: false,
      instrument: ObserveInstrument,
      routeConflictPolicy: {
        duplicate: 'warn',
        shadow: 'warn',
      },
      routeResolutionStrategy: 'specificity',
      return503OnClosing: true,
    });

    // Configure application
    configureApp(app);

    // Enable graceful shutdown hooks with request draining
    app.enableShutdownHooks();

    // Get configuration service
    const configService = app.get(ConfigService);
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
    const port = configService.get<number>('port') || 3001;
    const host = configService.get<string>('host') || DEFAULT_HOST;

    // Setup error handlers
    setupErrorHandlers(logger);

    // Start the application
    await app.listen(port, host);

    logger.log('Application is running', {
      url: `http://${host}:${port}`,
      environment: nodeEnv,
      port,
      host,
    });
  } catch (error: any) {
    logger.error('Failed to start application', error?.stack || error);
    process.exit(1);
  }
}

void bootstrap();
