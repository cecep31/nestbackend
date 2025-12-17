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

  async findAll(user_id: string) {
    return this.prisma.holdings.findMany({
      where: { user_id },
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
}
