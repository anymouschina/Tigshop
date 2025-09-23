// @ts-nocheck
import { Module } from "@nestjs/common";
import { AdminMsgController } from "./admin-msg.controller";
import { AdminMsgService } from "./admin-msg.service";

import { OrderModule } from "../order/order.module";

@Module({
  imports: [OrderModule],
  controllers: [AdminMsgController],
  providers: [AdminMsgService],
  exports: [AdminMsgService],
})
export class MsgModule {}
