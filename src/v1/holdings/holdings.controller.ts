import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { HoldingsService } from './holdings.service';
import { CreateHoldingSchema, type CreateHoldingDto } from './dto/create-holding.dto';
import { UpdateHoldingSchema, type UpdateHoldingDto } from './dto/update-holding.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({
  version: "1",
  path: "holdings",
})
@UseGuards(JwtAuthGuard)
export class HoldingsController {
  constructor(private readonly holdingsService: HoldingsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateHoldingSchema)) createHoldingDto: CreateHoldingDto, @Request() req) {
    return {
      success: true,
      message: "Successfully created holding",
      data: this.holdingsService.create(req.user.user_id, createHoldingDto),
    };
  }

  @Get()
  async findAll(@Request() req) {
    const holdings = await this.holdingsService.findAll(req.user.user_id);
    return {
      success: true,
      message: "Successfully fetched holdings",
      data: holdings,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const holding = await this.holdingsService.findOne(req.user.user_id, BigInt(id));
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

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateHoldingSchema)) updateHoldingDto: UpdateHoldingDto, @Request() req) {
    return {
      success: true,
      message: "Successfully updated holding",
      data: this.holdingsService.update(req.user.user_id, BigInt(id), updateHoldingDto),
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return {
      success: true,
      message: "Successfully deleted holding",
      data: this.holdingsService.remove(req.user.user_id, BigInt(id)),
    };
  }

  @Get('types')
  async getHoldingTypes() {
    const types = await this.holdingsService.getHoldingTypes();
    return {
      success: true,
      message: "Successfully fetched holding types",
      data: types,
    };
  }

  @Get('types/:id')
  async getHoldingType(@Param('id') id: string) {
    const type = await this.holdingsService.getHoldingType(+id);
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
}