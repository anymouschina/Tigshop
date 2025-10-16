// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { OrderInvoiceService } from "./order-invoice.service";

@ApiTags("User OrderInvoice API Compat")
@Controller("api/user/orderInvoice")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserOrderInvoiceApiCompatController {
  constructor(private readonly service: OrderInvoiceService) {}

  // 对齐 PHP：GET /api/user/orderInvoice/detail?id=
  @Get("detail")
  @ApiOperation({ summary: "订单发票详情（兼容）" })
  async detail(@Query("id") id: number) {
    const item = await this.service.getDetail(Number(id));
    return { code: 200, message: "OK", data: item };
  }

  // 对齐 PHP：POST /api/user/orderInvoice/create
  @Post("create")
  @ApiOperation({ summary: "创建订单发票（兼容）" })
  async create(@Request() req, @Body() body: any) {
    const user_id = req.user.user_id ?? req.user.userId;
    const created = await this.service.createOrderInvoice({ ...body, user_id });
    return { code: 200, message: "OK", data: created };
  }

  // 对齐 PHP：POST /api/user/orderInvoice/update
  @Post("update")
  @ApiOperation({ summary: "更新订单发票（兼容）" })
  async update(
    @Body()
    body: {
      id: number;
      status?: number;
      amount?: number;
      apply_reply?: string;
      invoice_attachment?: string;
    },
  ) {
    const updated = await this.service.updateOrderInvoice(body.id, body as any);
    return { code: 200, message: "OK", data: updated };
  }
}
