// @ts-nocheck
import { Module } from "@nestjs/common";
import { ArticleController } from "./article.controller";
import { ArticleService } from "./article.service";
import { UserArticlePublicController } from "./article-public.controller";

@Module({
  controllers: [ArticleController, UserArticlePublicController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
