import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty'
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async connectWithRetry(retries = this.MAX_RETRIES) {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to the database');
        return;
      } catch (error) {
        lastError = error;
        const retryIn = this.RETRY_DELAY * (i + 1);
        this.logger.warn(
          `Failed to connect to database (attempt ${i + 1}/${retries}). Retrying in ${retryIn}ms...`,
          error.message
        );
        await new Promise(resolve => setTimeout(resolve, retryIn));
      }
    }

    this.logger.error('Max retries reached. Could not connect to the database', lastError);
    throw lastError;
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Successfully disconnected from the database');
    } catch (error) {
      this.logger.error('Error while disconnecting from database', error);
    }
  }
}
