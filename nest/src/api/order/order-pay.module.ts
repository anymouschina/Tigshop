// @ts-nocheck
import { Module } from '@nestjs/common';
import { OrderPayController } from './order-pay.controller';
import { OrderPayService } from './order-pay.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [OrderPayController],
  providers: [OrderPayService, PrismaService],
  exports: [OrderPayService],
})
export class OrderPayModule {}
