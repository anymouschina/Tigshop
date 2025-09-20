// @ts-nocheck
import { Module } from '@nestjs/common';
import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';
import { DatabaseService } from '../../database/database.service';

@Module({
  controllers: [SkuController],
  providers: [SkuService, DatabaseService],
  exports: [SkuService],
})
export class SkuModule {}
