// @ts-nocheck
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OrderInvoiceService } from "./order-invoice.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@ApiTags("User Order Invoice")
@Controller("order-invoice")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderInvoiceController {
  constructor(private readonly orderInvoiceService: OrderInvoiceService) {}

  /**
   * 添加更新订单发票 - 对齐PHP版本 user/OrderInvoice/update
   */
  @Post("user/orderInvoice/update")
  @ApiOperation({ summary: "添加更新订单发票" })
  async update(
    @Request() req,
    @Body()
    body: {
      id?: number;
      order_id: number;
      invoice_type: number;
      status?: number;
      title_type: number;
      company_code?: string;
      invoice_title?: string;
      tax_number?: string;
      invoice_content?: string;
      email?: string;
      mobile?: string;
      address?: string;
      bank_name?: string;
      bank_account?: string;
      receiver_name?: string;
      receiver_phone?: string;
      receiver_address?: string;
    },
  ) {
    const userId = req.user.userId;
    return this.orderInvoiceService.updateOrderInvoice(userId, body);
  }

  /**
   * 获取订单发票列表 - 对齐PHP版本 user/OrderInvoice/index
   */
  @Get("user/orderInvoice/index")
  @ApiOperation({ summary: "获取订单发票列表" })
  async index(
    @Request() req,
    @Query()
    query: { page?: number; size?: number; order_id?: number; status?: number },
  ) {
    const userId = req.user.userId;
    return this.orderInvoiceService.getOrderInvoiceList(userId, query);
  }

  /**
   * 获取订单发票详情 - 对齐PHP版本 user/OrderInvoice/detail
   */
  @Get("user/orderInvoice/detail")
  @ApiOperation({ summary: "获取订单发票详情" })
  async detail(@Request() req, @Query() query: { id: number }) {
    const userId = req.user.userId;
    return this.orderInvoiceService.getOrderInvoiceDetail(userId, query.id);
  }

  /**
   * 删除订单发票 - 对齐PHP版本 user/OrderInvoice/delete
   */
  @Post("user/orderInvoice/delete")
  @ApiOperation({ summary: "删除订单发票" })
  async delete(@Request() req, @Body() body: { id: number }) {
    const userId = req.user.userId;
    return this.orderInvoiceService.deleteOrderInvoice(userId, body.id);
  }

  /**
   * 申请开具发票 - 对齐PHP版本 user/OrderInvoice/applyInvoice
   */
  @Post("user/orderInvoice/applyInvoice")
  @ApiOperation({ summary: "申请开具发票" })
  async applyInvoice(@Request() req, @Body() body: { id: number }) {
    const userId = req.user.userId;
    return this.orderInvoiceService.applyInvoice(userId, body.id);
  }

  /**
   * 获取订单发票信息 - 对齐PHP版本 user/OrderInvoice/getOrderInvoice
   */
  @Get("user/orderInvoice/getOrderInvoice")
  @ApiOperation({ summary: "获取订单发票信息" })
  async getOrderInvoice(@Request() req, @Query() query: { order_id: number }) {
    const userId = req.user.userId;
    return this.orderInvoiceService.getOrderInvoiceInfo(userId, query.order_id);
  }
}
