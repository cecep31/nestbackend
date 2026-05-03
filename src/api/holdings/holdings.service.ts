import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import {
  CreateHoldingSchema,
  type CreateHoldingDto,
} from "./dto/create-holding.dto";
import {
  UpdateHoldingSchema,
  type UpdateHoldingDto,
} from "./dto/update-holding.dto";

@Injectable()
export class HoldingsService {
  constructor(private prisma: PrismaService) {}

  async create(user_id: string, createHoldingDto: CreateHoldingDto) {
    const validatedData = CreateHoldingSchema.parse(createHoldingDto);
    return this.prisma.holdings.create({
      data: {
        ...validatedData,
        user_id,
      },
    });
  }

  async findAll(user_id: string, month?: number, year?: number) {
    const where: any = { user_id };
    if (month !== undefined) {
      where.month = month;
    }
    if (year !== undefined) {
      where.year = year;
    }
    return this.prisma.holdings.findMany({
      where,
      include: { holding_types: true },
    });
  }

  async findOne(user_id: string, id: bigint) {
    return this.prisma.holdings.findUnique({
      where: { id, user_id },
    });
  }

  async update(
    user_id: string,
    id: bigint,
    updateHoldingDto: UpdateHoldingDto
  ) {
    const validatedData = UpdateHoldingSchema.parse(updateHoldingDto);
    return this.prisma.holdings.update({
      where: { id, user_id },
      data: validatedData,
    });
  }

  async remove(user_id: string, id: bigint) {
    return this.prisma.holdings.delete({
      where: { id, user_id },
    });
  }

  async getHoldingTypes() {
    return this.prisma.holding_types.findMany();
  }

  async getHoldingType(id: number) {
    return this.prisma.holding_types.findUnique({
      where: { id },
    });
  }

  async duplicateMonth(
    user_id: string,
    body: {
      fromMonth: number;
      fromYear: number;
      toMonth: number;
      toYear: number;
      overwrite: boolean;
    }
  ) {
    const { fromMonth, fromYear, toMonth, toYear, overwrite } = body;

    const source = await this.prisma.holdings.findMany({
      where: { user_id, month: fromMonth, year: fromYear },
    });

    if (!source.length) {
      return {
        createdCount: 0,
        skipped: true,
        targetMonth: toMonth,
        targetYear: toYear,
      };
    }

    const toNumber = (value: unknown) => {
      if (value === null || value === undefined) return null;
      if (
        typeof value === "object" &&
        value !== null &&
        "toNumber" in value &&
        typeof (value as any).toNumber === "function"
      ) {
        return (value as any).toNumber();
      }
      return value as number;
    };

    const rows = source.map((h) => ({
      user_id,
      name: h.name,
      platform: h.platform,
      holding_type_id: h.holding_type_id,
      currency: h.currency,
      invested_amount: toNumber(h.invested_amount) ?? 0,
      current_value: toNumber(h.current_value) ?? 0,
      units: toNumber(h.units),
      avg_buy_price: toNumber(h.avg_buy_price),
      current_price: toNumber(h.current_price),
      last_updated: h.last_updated,
      notes: h.notes,
      month: toMonth,
      year: toYear,
    }));

    const result = await this.prisma.$transaction(async (tx) => {
      if (overwrite) {
        await tx.holdings.deleteMany({
          where: { user_id, month: toMonth, year: toYear },
        });
      }

      return tx.holdings.createMany({
        data: rows,
        skipDuplicates: !overwrite,
      });
    });

    return {
      createdCount: result.count,
      skipped: false,
      targetMonth: toMonth,
      targetYear: toYear,
    };
  }
}
