import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      pool: new Pool({
        max: 100, // Maximum number of connections in the pool
        min: 2,  // Minimum number of connections in the pool
        idleTimeoutMillis: 30 * 1000, // 30 seconds - How long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 2 * 1000, // 2 seconds - How long to try connecting before timing out
      })
    });
    super({ adapter: pool });
  }
  async onModuleInit() {
    // Note: this is optional
    await this.$connect();
  }
}