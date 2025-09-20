// @ts-nocheck
import { Module } from '@nestjs/common';
import { OrderCheckController } from './order-check.controller';
import { OrderCheckService } from './order-check.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [OrderCheckController],
  providers: [OrderCheckService, PrismaService],
  exports: [OrderCheckService],
})
export class OrderCheckModule {}
