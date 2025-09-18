import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CommentModule } from './comment/comment.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, CommentModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}