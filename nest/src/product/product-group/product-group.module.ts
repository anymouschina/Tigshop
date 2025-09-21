// @ts-nocheck
import { Module } from "@nestjs/common";
import { ProductGroupController } from "./product-group.controller";
import { ProductGroupService } from "./product-group.service";


@Module({
  imports: [],
  controllers: [ProductGroupController],
  providers: [ProductGroupService],
  exports: [ProductGroupService],
})
export class ProductGroupModule {}
