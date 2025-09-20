// @ts-nocheck
import { Module } from "@nestjs/common";
import { ArticleModule } from "./article/article.module";
import { ArticleCategoryModule } from "./article-category/article-category.module";
import { HomeModule } from "./home/home.module";
import { ShareModule } from "./share/share.module";

@Module({
  imports: [ArticleModule, ArticleCategoryModule, HomeModule, ShareModule],
  exports: [ArticleModule, ArticleCategoryModule, HomeModule, ShareModule],
})
export class ContentModule {}
