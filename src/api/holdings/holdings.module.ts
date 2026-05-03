import { Module } from "@nestjs/common";
import { HoldingsService } from "./holdings.service";
import { HoldingsController } from "./holdings.controller";

@Module({
  imports: [],
  controllers: [HoldingsController],
  providers: [HoldingsService],
  exports: [HoldingsService],
})
export class HoldingsModule {}
