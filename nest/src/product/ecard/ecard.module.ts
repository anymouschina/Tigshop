// @ts-nocheck
import { Module } from "@nestjs/common";
import { ECardController } from "./ecard.controller";
import { ECardService } from "./ecard.service";

@Module({
  imports: [],
  controllers: [ECardController],
  providers: [ECardService],
  exports: [ECardService],
})
export class ECardModule {}
