// @ts-nocheck
import { Module } from '@nestjs/common';
import { TimeDiscountService } from './timeDiscount.service';
import { TimeDiscountController } from './timeDiscount.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TimeDiscountController],
  providers: [TimeDiscountService],
  exports: [TimeDiscountService],
})
export class TimeDiscountModule {}
