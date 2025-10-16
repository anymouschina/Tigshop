// @ts-nocheck
import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Patch,
  Get,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from "@nestjs/swagger";
import { DineOrderService } from "./dine-order.service";
import { CreateDineOrderDto } from "./dto/create-dine-order.dto";
// 修正导入路径：此前指向 ../common/guards 导致 runtime MODULE_NOT_FOUND
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("DineOrder")
@Controller("api/order/dine")
@UseGuards(JwtAuthGuard)
export class DineOrderController {
  constructor(private readonly service: DineOrderService) {}

  @Post("create")
  @ApiOperation({ summary: "创建堂食 / 外带订单" })
  create(@Req() req: any, @Body() dto: CreateDineOrderDto) {
    const userId = req.user?.userId || req.user?.user_id;
    const shopId = req.headers["x-shop-id"]
      ? Number(req.headers["x-shop-id"])
      : 0; // 临时通过请求头传入
    const idem = req.headers["x-idempotency-key"] as string | undefined;
    return this.service
      .create(Number(userId), shopId, dto, idem)
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Post("append")
  @ApiOperation({ summary: "加单（附属子订单）" })
  append(
    @Req() req: any,
    @Body()
    body: {
      parentOrderId: number;
      items: { productId: number; quantity: number; skuId?: number }[];
    },
  ) {
    const userId = req.user?.userId || req.user?.user_id;
    const idem = req.headers["x-idempotency-key"] as string | undefined;
    return this.service
      .append(
        Number(userId),
        Number(body.parentOrderId),
        body.items || [],
        idem,
      )
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Patch("change-table")
  @ApiOperation({ summary: "堂食换桌" })
  changeTable(@Body() body: { orderId: number; newTableNo: string }) {
    return this.service
      .changeTable(Number(body.orderId), body.newTableNo)
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Patch("state")
  @ApiOperation({ summary: "服务状态流转" })
  state(@Body() body: { orderId: number; to: string }) {
    return this.service
      .updateServiceState(Number(body.orderId), body.to)
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Get("queue")
  @ApiOperation({ summary: "当前叫号队列（活动订单）" })
  queue(@Query("shopId") shopId: number, @Query("day") day?: number) {
    const d =
      day || Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
    return this.service
      .queue(Number(shopId), d)
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Post("pay")
  @ApiOperation({ summary: "模拟支付（测试用）" })
  pay(@Req() req: any, @Body() body: { orderId: number }) {
    const userId = req.user?.userId || req.user?.user_id;
    return this.service
      .pay(Number(body.orderId), Number(userId))
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Post("cancel")
  @ApiOperation({ summary: "取消未支付订单" })
  cancel(@Req() req: any, @Body() body: { orderId: number }) {
    const userId = req.user?.userId || req.user?.user_id;
    return this.service
      .cancel(Number(body.orderId), Number(userId))
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Get("detail")
  @ApiOperation({ summary: "订单详情（主/子单合并商品）" })
  detail(@Req() req: any, @Query("orderId") orderId: number) {
    const userId = req.user?.userId || req.user?.user_id;
    return this.service
      .detail(Number(orderId), Number(userId))
      .then((data) => ({ code: 0, message: "success", data }));
  }

  @Get("root-summary")
  @ApiOperation({ summary: "主单汇总统计（主+子单金额/商品聚合）" })
  rootSummary(@Req() req: any, @Query("orderId") orderId: number) {
    const userId = req.user?.userId || req.user?.user_id;
    return this.service
      .rootSummary(Number(orderId), Number(userId))
      .then((data) => ({ code: 0, message: "success", data }));
  }
}
