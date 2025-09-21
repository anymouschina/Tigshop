// @ts-nocheck
import { Module } from "@nestjs/common";
import { ArticleCategoryService } from "./articleCategory.service";
import { ArticleCategoryController } from "./articleCategory.controller";

@Module({
  imports: [],
  controllers: [ArticleCategoryController],
  providers: [ArticleCategoryService],
  exports: [ArticleCategoryService],
})
export class ArticleCategoryModule {}
