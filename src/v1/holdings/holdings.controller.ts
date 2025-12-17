import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { HoldingsService } from "./holdings.service";
import {
  CreateHoldingSchema,
  type CreateHoldingDto,
} from "./dto/create-holding.dto";
import {
  UpdateHoldingSchema,
  type UpdateHoldingDto,
} from "./dto/update-holding.dto";
import {
  DuplicateHoldingSchema,
  type DuplicateHoldingDto,
} from "./dto/duplicate-holding.dto";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller({
  version: "1",
  path: "holdings",
})
@UseGuards(JwtAuthGuard)
export class HoldingsController {
  constructor(private readonly holdingsService: HoldingsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateHoldingSchema))
    createHoldingDto: CreateHoldingDto,
    @Request() req
  ) {
    return {
      success: true,
      message: "Successfully created holding",
      data: this.holdingsService.create(req.user.user_id, createHoldingDto),
    };
  }

  @Post("duplicate")
  async duplicateMonth(
    @Request() req,
    @Body(new ZodValidationPipe(DuplicateHoldingSchema))
    body: DuplicateHoldingDto
  ) {
    const result = await this.holdingsService.duplicateMonth(
      req.user.user_id,
      body
    );
    return {
      success: true,
      message: "Successfully duplicated holdings",
      data: result,
    };
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("month") month?: string,
    @Query("year") year?: string
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    const holdings = await this.holdingsService.findAll(
      req.user.user_id,
      monthNum,
      yearNum
    );
    return {
      success: true,
      message: "Successfully fetched holdings",
      data: holdings,
    };
  }

  @Get("types")
  async getHoldingTypes() {
    const types = await this.holdingsService.getHoldingTypes();
    return {
      success: true,
      message: "Successfully fetched holding types",
      data: types,
    };
  }

  @Get("types/:id")
  async getHoldingType(@Param("id") id: string) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return {
        success: false,
        message: "Invalid holding type ID",
        data: [],
      };
    }
    const type = await this.holdingsService.getHoldingType(idNum);
    if (!type) {
      return {
        success: false,
        message: "Holding type not found",
        data: [],
      };
    }
    return {
      success: true,
      message: "Successfully fetched holding type",
      data: type,
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return {
        success: false,
        message: "Invalid holding ID",
        data: [],
      };
    }
    const holding = await this.holdingsService.findOne(
      req.user.user_id,
      BigInt(idNum)
    );
    if (!holding) {
      return {
        success: false,
        message: "Holding not found",
        data: [],
      };
    }
    return {
      success: true,
      message: "Successfully fetched holding",
      data: holding,
    };
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateHoldingSchema))
    updateHoldingDto: UpdateHoldingDto,
    @Request() req
  ) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return {
        success: false,
        message: "Invalid holding ID",
        data: [],
      };
    }
    try {
      const result = await this.holdingsService.update(
        req.user.user_id,
        BigInt(idNum),
        updateHoldingDto
      );
      return {
        success: true,
        message: "Successfully updated holding",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update holding",
        data: [],
      };
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return {
        success: false,
        message: "Invalid holding ID",
        data: [],
      };
    }
    try {
      const result = await this.holdingsService.remove(
        req.user.user_id,
        BigInt(idNum)
      );
      return {
        success: true,
        message: "Successfully deleted holding",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete holding",
        data: [],
      };
    }
  }
}
