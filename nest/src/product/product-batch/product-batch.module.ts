import { Module } from '@nestjs/common';
import { ProductBatchController } from './product-batch.controller';
import { ProductBatchService } from './product-batch.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductBatchController],
  providers: [ProductBatchService],
  exports: [ProductBatchService],
})
export class ProductBatchModule {}