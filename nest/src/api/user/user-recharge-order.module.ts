// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserRechargeOrderController } from './user-recharge-order.controller';
import { UserRechargeOrderService } from './user-recharge-order.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [UserRechargeOrderController],
  providers: [UserRechargeOrderService, PrismaService],
  exports: [UserRechargeOrderService],
})
export class UserRechargeOrderModule {}
