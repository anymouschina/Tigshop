// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { RefundService } from "./refund.service";
import {
  RefundQueryDto,
  CreateRefundDto,
  UpdateRefundDto,
  ProcessRefundDto,
  BatchProcessRefundDto,
  RefundStatsDto,
} from "./refund.dto";
import { AdminJwtAuthGuard } from "../../auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { Authorities } from "../../auth/decorators/authority.decorator";

@ApiTags("Admin API - 财务管理-退款")
@Controller("adminapi/finance/refund")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get()
  @Authorities("financeRefund")
  @ApiOperation({ summary: "获取退款申请列表" })
  @ApiQuery({ name: "keyword", description: "关键词搜索", required: false })
  @ApiQuery({ name: "user_id", description: "用户ID", required: false })
  @ApiQuery({ name: "order_id", description: "订单ID", required: false })
  @ApiQuery({ name: "status", description: "状态", required: false })
  @ApiQuery({ name: "refund_type", description: "退款类型", required: false })
  @ApiQuery({ name: "start_time", description: "开始时间", required: false })
  @ApiQuery({ name: "end_time", description: "结束时间", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  async findAll(@Query() query: RefundQueryDto) {
    const result = await this.refundService.findAll(query);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(":id")
  @Authorities("financeRefund")
  @ApiOperation({ summary: "获取退款申请详情" })
  @ApiParam({ name: "id", description: "退款申请ID" })
  async findOne(@Param("id") id: number) {
    const result = await this.refundService.findOne(id);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @Authorities("financeRefundCreate")
  @ApiOperation({ summary: "创建退款申请" })
  async create(@Body() createRefundDto: CreateRefundDto, @Request() req) {
    const adminId = req.user?.userId;
    const result = await this.refundService.create(createRefundDto, adminId);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Put(":id")
  @Authorities("financeRefundUpdate")
  @ApiOperation({ summary: "更新退款申请" })
  @ApiParam({ name: "id", description: "退款申请ID" })
  async update(
    @Param("id") id: number,
    @Body() updateRefundDto: UpdateRefundDto,
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    const result = await this.refundService.update(
      id,
      updateRefundDto,
      adminId,
    );
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(":id/approve")
  @Authorities("financeRefundApprove")
  @ApiOperation({ summary: "审核通过退款申请" })
  @ApiParam({ name: "id", description: "退款申请ID" })
  async approve(@Param("id") id: number, @Request() req) {
    const adminId = req.user?.userId;
    const result = await this.refundService.approve(id, adminId);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(":id/reject")
  @Authorities("financeRefundReject")
  @ApiOperation({ summary: "拒绝退款申请" })
  @ApiParam({ name: "id", description: "退款申请ID" })
  async reject(
    @Param("id") id: number,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    const result = await this.refundService.reject(id, body.reason, adminId);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(":id/cancel")
  @Authorities("financeRefundCancel")
  @ApiOperation({ summary: "取消退款申请" })
  @ApiParam({ name: "id", description: "退款申请ID" })
  async cancel(@Param("id") id: number, @Request() req) {
    const adminId = req.user?.userId;
    const result = await this.refundService.cancel(id, adminId);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post("process")
  @Authorities("financeRefundProcess")
  @ApiOperation({ summary: "处理退款" })
  async processRefund(
    @Body() processRefundDto: ProcessRefundDto,
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    const result = await this.refundService.processRefund(
      processRefundDto,
      adminId,
    );
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post("batch-process")
  @Authorities("financeRefundBatch")
  @ApiOperation({ summary: "批量处理退款" })
  async batchProcessRefund(
    @Body() batchProcessRefundDto: BatchProcessRefundDto,
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    const result = await this.refundService.batchProcessRefund(
      batchProcessRefundDto,
      adminId,
    );
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("stats")
  @Authorities("financeRefundStats")
  @ApiOperation({ summary: "获取退款统计" })
  @ApiQuery({ name: "start_time", description: "开始时间", required: false })
  @ApiQuery({ name: "end_time", description: "结束时间", required: false })
  @ApiQuery({ name: "shop_id", description: "店铺ID", required: false })
  async getStats(@Query() query: RefundStatsDto) {
    const result = await this.refundService.getStats(query);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("types")
  @ApiOperation({ summary: "获取退款类型列表" })
  async getRefundTypes() {
    const result = await this.refundService.getRefundTypes();
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("status")
  @ApiOperation({ summary: "获取退款状态列表" })
  async getRefundStatus() {
    const result = await this.refundService.getRefundStatus();
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("logs/:refundId")
  @Authorities("financeRefundLogs")
  @ApiOperation({ summary: "获取退款操作日志" })
  @ApiParam({ name: "refundId", description: "退款申请ID" })
  async getRefundLogs(@Param("refundId") refundId: number) {
    const result = await this.refundService.getRefundLogs(refundId);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(":id")
  @Authorities("financeRefundDelete")
  @ApiOperation({ summary: "删除退款申请" })
  @ApiParam({ name: "id", description: "退款申请ID" })
  async remove(@Param("id") id: number, @Request() req) {
    const adminId = req.user?.userId;
    const result = await this.refundService.remove(id, adminId);
    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
