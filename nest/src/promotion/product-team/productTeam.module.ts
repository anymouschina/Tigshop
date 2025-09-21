// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductTeamService } from "./productTeam.service";
import { ProductTeamController } from "./productTeam.controller";

@Module({
  imports: [],
  controllers: [ProductTeamController],
  providers: [ProductTeamService],
  exports: [ProductTeamService],
})
export class ProductTeamModule {}
