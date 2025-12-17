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
    return this.holdingsService.create(req.user.user_id, createHoldingDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.holdingsService.findAll(req.user.user_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.holdingsService.findOne(req.user.user_id, BigInt(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateHoldingSchema)) updateHoldingDto: UpdateHoldingDto, @Request() req) {
    return this.holdingsService.update(req.user.user_id, BigInt(id), updateHoldingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.holdingsService.remove(req.user.user_id, BigInt(id));
  }
}