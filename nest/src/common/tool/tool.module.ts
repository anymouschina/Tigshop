// @ts-nocheck
import { Module } from "@nestjs/common";
import { ToolController } from "./tool.controller";
import { ToolService } from "./tool.service";

@Module({
  imports: [],
  controllers: [ToolController],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
