// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { InvoiceService } from "./invoice.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("User Invoice")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * 获取用户发票列表 - 对齐PHP版本 user/Invoice/index
   */
  @Get("user/invoice/index")
  @ApiOperation({ summary: "获取用户发票列表" })
  async index(
    @Request() req,
    @Query() query: { page?: number; size?: number },
  ) {
    const userId = req.user.userId;
    const page = query.page || 1;
    const size = query.size || 10;

    return this.invoiceService.getUserInvoiceList(userId, page, size);
  }

  /**
   * 获取发票详情 - 对齐PHP版本 user/Invoice/detail
   */
  @Get("user/invoice/detail")
  @ApiOperation({ summary: "获取发票详情" })
  async detail(@Request() req, @Query() query: { id: number }) {
    const userId = req.user.userId;
    const invoiceId = query.id;

    if (!invoiceId) {
      throw new HttpException("发票ID不能为空", HttpStatus.BAD_REQUEST);
    }

    return this.invoiceService.getInvoiceDetail(userId, invoiceId);
  }

  /**
   * 申请发票 - 对齐PHP版本 user/Invoice/add
   */
  @Post("user/invoice/add")
  @ApiOperation({ summary: "申请发票" })
  async add(
    @Request() req,
    @Body()
    body: {
      invoice_type: number;
      title_type: number;
      invoice_title?: string;
      tax_number?: string;
      invoice_content: string;
      order_ids: number[];
      email?: string;
      mobile?: string;
      address?: string;
      bank_name?: string;
      bank_account?: string;
    },
  ) {
    const userId = req.user.userId;

    return this.invoiceService.createInvoice(userId, body);
  }

  /**
   * 更新发票信息 - 对齐PHP版本 user/Invoice/edit
   */
  @Put("user/invoice/edit")
  @ApiOperation({ summary: "更新发票信息" })
  async edit(
    @Request() req,
    @Body()
    body: {
      id: number;
      invoice_type?: number;
      title_type?: number;
      invoice_title?: string;
      tax_number?: string;
      invoice_content?: string;
      email?: string;
      mobile?: string;
      address?: string;
      bank_name?: string;
      bank_account?: string;
    },
  ) {
    const userId = req.user.userId;

    return this.invoiceService.updateInvoice(userId, body);
  }

  /**
   * 删除发票 - 对齐PHP版本 user/Invoice/del
   */
  @Delete("user/invoice/del")
  @ApiOperation({ summary: "删除发票" })
  async del(@Request() req, @Query() query: { id: number }) {
    const userId = req.user.userId;
    const invoiceId = query.id;

    if (!invoiceId) {
      throw new HttpException("发票ID不能为空", HttpStatus.BAD_REQUEST);
    }

    return this.invoiceService.deleteInvoice(userId, invoiceId);
  }

  /**
   * 获取可开票订单 - 对齐PHP版本 user/Invoice/getOrderList
   */
  @Get("user/invoice/getOrderList")
  @ApiOperation({ summary: "获取可开票订单" })
  async getOrderList(
    @Request() req,
    @Query() query: { page?: number; size?: number },
  ) {
    const userId = req.user.userId;
    const page = query.page || 1;
    const size = query.size || 10;

    return this.invoiceService.getAvailableOrderList(userId, page, size);
  }

  /**
   * 获取发票内容选项 - 对齐PHP版本 user/Invoice/getInvoiceContent
   */
  @Get("user/invoice/getInvoiceContent")
  @ApiOperation({ summary: "获取发票内容选项" })
  async getInvoiceContent() {
    return this.invoiceService.getInvoiceContentOptions();
  }

  /**
   * 获取发票类型配置 - 对齐PHP版本 user/Invoice/getInvoiceType
   */
  @Get("user/invoice/getInvoiceType")
  @ApiOperation({ summary: "获取发票类型配置" })
  async getInvoiceType() {
    return this.invoiceService.getInvoiceTypeConfig();
  }

  /**
   * 重新开具发票 - 对齐PHP版本 user/Invoice/reissue
   */
  @Post("user/invoice/reissue")
  @ApiOperation({ summary: "重新开具发票" })
  async reissue(@Request() req, @Body() body: { id: number; reason?: string }) {
    const userId = req.user.userId;

    return this.invoiceService.reissueInvoice(userId, body.id, body.reason);
  }

  /**
   * 邮寄发票 - 对齐PHP版本 user/Invoice/mailInvoice
   */
  @Post("user/invoice/mailInvoice")
  @ApiOperation({ summary: "邮寄发票" })
  async mailInvoice(
    @Request() req,
    @Body() body: { id: number; address: string },
  ) {
    const userId = req.user.userId;

    return this.invoiceService.mailInvoice(userId, body.id, body.address);
  }
}
