import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundApplyController } from './refund-apply.controller';
import { RefundApplyService } from './refund-apply.service';
import { RefundApply } from '../entities/refund-apply.entity';
import { RefundLog } from '../entities/refund-log.entity';
import { Aftersales } from '../../order/entities/aftersales.entity';
import { Order } from '../../order/entities/order.entity';
import { AftersalesItem } from '../../order/entities/aftersales-item.entity';
import { User } from '../../user/entities/user.entity';
import { ProductSku } from '../../product/sku/entities/sku.entity';
import { Product } from '../../product/entities/product.entity';
import { Seckill } from '../../promotion/entities/seckill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefundApply,
      Aftersales,
      Order,
      AftersalesItem,
      RefundLog,
      User,
      ProductSku,
      Product,
      Seckill,
    ]),
  ],
  controllers: [RefundApplyController],
  providers: [RefundApplyService],
  exports: [RefundApplyService],
})
export class RefundApplyModule {}