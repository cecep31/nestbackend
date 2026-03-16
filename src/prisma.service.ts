import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: 100,
      min: 2,
      idleTimeoutMillis: 30 * 1000,
      connectionTimeoutMillis: 2 * 1000,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
