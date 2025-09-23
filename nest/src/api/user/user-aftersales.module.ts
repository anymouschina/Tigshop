// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserAftersalesController } from "./user-aftersales.controller";
import { UserAftersalesService } from "./user-aftersales.service";

@Module({
  controllers: [UserAftersalesController],
  providers: [UserAftersalesService],
  exports: [UserAftersalesService],
})
export class UserAftersalesModule {}
