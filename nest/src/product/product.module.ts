import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController, FrontProductController } from './product.controller';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [ProductController, FrontProductController],
  providers: [ProductService, DatabaseService],
  exports: [ProductService],
})
export class ProductModule {}
