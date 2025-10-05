// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserAftersalesApiCompatController } from "./user-aftersales.api-compat.controller";
import { RefundApplyModule } from "../../finance/refund-apply/refund-apply.module";
import { OrderModule } from "../../order/order.module";

@Module({
  // 需要 OrderService 以构建 applyData 返回订单详情结构
  imports: [RefundApplyModule, OrderModule],
  controllers: [UserAftersalesApiCompatController],
  providers: [],
})
export class UserAftersalesModule {}
