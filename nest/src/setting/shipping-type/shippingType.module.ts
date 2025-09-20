// @ts-nocheck
import { Module } from '@nestjs/common';
import { ShippingTypeService } from './shippingType.service';
import { ShippingTypeController } from './shippingType.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShippingTypeController],
  providers: [ShippingTypeService],
  exports: [ShippingTypeService],
})
export class ShippingTypeModule {}
