// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AftersalesService } from "./aftersales.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@ApiTags("User Aftersales")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AftersalesController {
  constructor(private readonly aftersalesService: AftersalesService) {}

  /**
   * 可售后订单列表 - 对齐PHP版本 user/Aftersales/list
   */
  @Get("user/aftersales/list")
  @ApiOperation({ summary: "可售后订单列表" })
  async list(@Request() req, @Query() query: { page?: number; size?: number }) {
    const userId = req.user.userId;
    return this.aftersalesService.getAfterSalesOrderList(userId, query);
  }

  /**
   * 售后配置 - 对齐PHP版本 user/Aftersales/config
   */
  @Get("user/aftersales/config")
  @ApiOperation({ summary: "售后配置" })
  async config() {
    return this.aftersalesService.getAftersalesConfig();
  }

  /**
   * 售后申请详情 - 对齐PHP版本 user/Aftersales/applyData
   */
  @Get("user/aftersales/applyData")
  @ApiOperation({ summary: "售后申请详情" })
  async applyData(@Query() query: { item_id?: number; order_id?: number }) {
    return this.aftersalesService.getApplyData(query);
  }

  /**
   * 创建售后申请 - 对齐PHP版本 user/Aftersales/create
   */
  @Post("user/aftersales/create")
  @ApiOperation({ summary: "创建售后申请" })
  async create(
    @Request() req,
    @Body()
    data: {
      order_id: number;
      aftersale_type: number;
      aftersale_reason: string;
      description: string;
      refund_amount: number;
      pics: string[];
      items: Array<{
        order_item_id: number;
        number: number;
      }>;
    },
  ) {
    const userId = req.user.userId;
    return this.aftersalesService.createAfterSales(userId, data);
  }

  /**
   * 更新售后申请 - 对齐PHP版本 user/Aftersales/update
   */
  @Post("user/aftersales/update")
  @ApiOperation({ summary: "更新售后申请" })
  async update(
    @Request() req,
    @Body()
    data: {
      aftersale_id: number;
      order_id: number;
      aftersale_type: number;
      aftersale_reason: string;
      description: string;
      refund_amount: number;
      pics: string[];
      items: Array<{
        order_item_id: number;
        number: number;
      }>;
    },
  ) {
    const userId = req.user.userId;
    return this.aftersalesService.updateAfterSales(userId, data);
  }

  /**
   * 售后申请记录 - 对齐PHP版本 user/Aftersales/getRecord
   */
  @Get("user/aftersales/getRecord")
  @ApiOperation({ summary: "售后申请记录" })
  async getRecord(
    @Request() req,
    @Query() query: { page?: number; size?: number },
  ) {
    const userId = req.user.userId;
    return this.aftersalesService.getAfterSalesRecord(userId, query);
  }

  /**
   * 查看售后记录详情 - 对齐PHP版本 user/Aftersales/detail
   */
  @Get("user/aftersales/detail")
  @ApiOperation({ summary: "查看售后记录详情" })
  async detail(@Query("id") id: number) {
    return this.aftersalesService.getAfterSalesDetail(id);
  }

  /**
   * 查看售后日志记录 - 对齐PHP版本 user/Aftersales/detailLog
   */
  @Get("user/aftersales/detailLog")
  @ApiOperation({ summary: "查看售后日志记录" })
  async detailLog(@Query("id") id: number) {
    return this.aftersalesService.getAfterSalesDetailLog(id);
  }

  /**
   * 提交售后反馈记录 - 对齐PHP版本 user/Aftersales/feedback
   */
  @Post("user/aftersales/feedback")
  @ApiOperation({ summary: "提交售后反馈记录" })
  async feedback(
    @Request() req,
    @Body()
    data: {
      id: number;
      log_info: string;
      return_pic: string[];
      logistics_name: string;
      tracking_no: string;
    },
  ) {
    const userId = req.user.userId;
    return this.aftersalesService.submitFeedback(userId, data);
  }

  /**
   * 撤销售后申请 - 对齐PHP版本 user/Aftersales/cancel
   */
  @Post("user/aftersales/cancel")
  @ApiOperation({ summary: "撤销售后申请" })
  async cancel(@Request() req, @Body() body: { aftersale_id: number }) {
    const userId = req.user.userId;
    return this.aftersalesService.cancelAfterSales(userId, body.aftersale_id);
  }
}
