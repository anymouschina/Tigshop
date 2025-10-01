// @ts-nocheck
import { Module } from "@nestjs/common";
import { ArticleCategoryService } from "./articleCategory.service";
import { ArticleCategoryController } from "./articleCategory.controller";
import { UserArticleCategoryPublicController } from "./articleCategory-public.controller";

@Module({
  imports: [],
  controllers: [ArticleCategoryController, UserArticleCategoryPublicController],
  providers: [ArticleCategoryService],
  exports: [ArticleCategoryService],
})
export class ArticleCategoryModule {}
