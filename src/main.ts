import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { winstonConfig } from './config/winston';
import { WinstonModule } from 'nest-winston';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger(winstonConfig),
      abortOnError: false, // Don't crash on unhandled promise rejections
    });

    // Enable API versioning
    app.enableVersioning({
      type: VersioningType.URI,
    });


    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Handle application shutdown
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

    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Get config service
    const configService = app.get(ConfigService);
    const port = configService.get<number>('port') || 3001;
    const host = configService.get<string>('host') || '0.0.0.0';
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    // Start the application
    await app.listen(port, host);
    
    logger.log(`Application is running on: http://${host}:${port}`);
    logger.log(`Environment: ${nodeEnv}`);
    
    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', reason);
    });
    
  } catch (error) {
    logger.error('Failed to start application', error.stack);
    process.exit(1);
  }
}

bootstrap();
