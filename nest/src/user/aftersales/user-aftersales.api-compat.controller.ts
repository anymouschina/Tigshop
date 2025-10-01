// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RefundApplyService } from "../../finance/refund-apply/refund-apply.service";

@ApiTags("User Aftersales API Compat")
@Controller("api/user/aftersales")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAftersalesApiCompatController {
  constructor(private readonly refundApplyService: RefundApplyService) {}

  // 对齐 PHP：GET /api/user/aftersales/list
  @Get("list")
  @ApiOperation({ summary: "售后列表（兼容）" })
  async list(@Request() req, @Query() query: any) {
    const user_id = req.user.user_id ?? req.user.userId;
    const res = await this.refundApplyService.findAll({ ...query, user_id });
    return { code: 200, message: "OK", data: res };
  }

  // 对齐 PHP：GET /api/user/aftersales/config
  @Get("config")
  @ApiOperation({ summary: "售后配置（兼容）" })
  async config() {
    // 复用退款申请状态作为售后状态配置
    const data = await this.refundApplyService.getRefundStats();
    return { code: 200, message: "OK", data };
  }

  // 对齐 PHP：GET /api/user/aftersales/applyData
  @Get("applyData")
  @ApiOperation({ summary: "获取售后申请基础数据（兼容）" })
  async applyData(@Query() query: { order_id?: number }) {
    // 占位：返回前端所需基础枚举，后续可补充订单商品可申请项
    return {
      code: 200,
      message: "OK",
      data: {
        reason_options: [
          { label: "不想要了", value: 1 },
          { label: "商品有问题", value: 2 },
          { label: "少件/漏发", value: 3 },
        ],
      },
    };
  }

  // 对齐 PHP：POST /api/user/aftersales/create
  @Post("create")
  @ApiOperation({ summary: "创建售后（兼容）" })
  async create(@Request() req, @Body() body: any) {
    const user_id = req.user.user_id ?? req.user.userId;
    const created = await this.refundApplyService.create({ ...body, user_id });
    return { code: 200, message: "OK", data: created };
  }

  // 对齐 PHP：POST /api/user/aftersales/update
  @Post("update")
  @ApiOperation({ summary: "更新售后（兼容）" })
  async update(@Body() body: any) {
    const updated = await this.refundApplyService.update(body);
    return { code: 200, message: "OK", data: updated };
  }

  // 对齐 PHP：GET /api/user/aftersales/getRecord
  @Get("getRecord")
  @ApiOperation({ summary: "获取售后记录（兼容）" })
  async getRecord(@Query("id") id: number) {
    const item = await this.refundApplyService.findOne(Number(id));
    return { code: 200, message: "OK", data: item };
  }

  // 对齐 PHP：GET /api/user/aftersales/detail
  @Get("detail")
  @ApiOperation({ summary: "售后详情（兼容）" })
  async detail(@Query("id") id: number) {
    const item = await this.refundApplyService.findOne(Number(id));
    return { code: 200, message: "OK", data: item };
  }

  // 对齐 PHP：GET /api/user/aftersales/detailLog
  @Get("detailLog")
  @ApiOperation({ summary: "售后日志（兼容）" })
  async detailLog(@Query("id") id: number) {
    // 占位：实际应查询 refund_log 表，这里先返回空列表
    return { code: 200, message: "OK", data: [] };
  }

  // 对齐 PHP：POST /api/user/aftersales/feedback
  @Post("feedback")
  @ApiOperation({ summary: "售后留言（兼容）" })
  async feedback(@Request() req, @Body() body: { id: number; content: string }) {
    // 占位：可写入 refund_log，当前返回成功
    return { code: 200, message: "提交成功", data: true };
  }

  // 对齐 PHP：POST /api/user/aftersales/cancel
  @Post("cancel")
  @ApiOperation({ summary: "取消售后（兼容）" })
  async cancel(@Body() body: { id: number }) {
    // 将状态置为已取消(3)
    const updated = await this.refundApplyService.update({ id: body.id, status: 3 });
    return { code: 200, message: "OK", data: updated };
  }
}
