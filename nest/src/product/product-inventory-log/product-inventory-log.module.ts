// @ts-nocheck
import { Module } from '@nestjs/common';
import { ProductInventoryLogController } from './product-inventory-log.controller';
import { ProductInventoryLogService } from './product-inventory-log.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductInventoryLogController],
  providers: [ProductInventoryLogService],
  exports: [ProductInventoryLogService],
})
export class ProductInventoryLogModule {}
