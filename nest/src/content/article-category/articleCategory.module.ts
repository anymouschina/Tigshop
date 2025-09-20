// @ts-nocheck
import { Module } from '@nestjs/common';
import { ArticleCategoryService } from './articleCategory.service';
import { ArticleCategoryController } from './articleCategory.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ArticleCategoryController],
  providers: [ArticleCategoryService],
  exports: [ArticleCategoryService],
})
export class ArticleCategoryModule {}
