// @ts-nocheck
import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { OrderLogService } from "./order-log.service";
import { OrderLogQueryDto, OrderLogDetailDto } from "./dto/order-log.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("订单日志")
@Controller("admin/order-log")
@UseGuards(RolesGuard)
@Roles("admin")
export class OrderLogController {
  constructor(private readonly orderLogService: OrderLogService) {}

  @Get()
  @ApiOperation({ summary: "获取订单日志列表" })
  @ApiQuery({ name: "order_id", required: false, description: "订单ID" })
  @ApiQuery({ name: "user_id", required: false, description: "用户ID" })
  @ApiQuery({ name: "action_type", required: false, description: "操作类型" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "start_time", required: false, description: "开始时间" })
  @ApiQuery({ name: "end_time", required: false, description: "结束时间" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getOrderLogList(@Query() query: OrderLogQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.orderLogService.getOrderLogList(filter),
      this.orderLogService.getOrderLogCount(filter),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records,
        total,
      },
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "获取订单日志详情" })
  @ApiParam({ name: "id", description: "日志ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getOrderLogDetail(@Param("id") id: number) {
    const log = await this.orderLogService.getOrderLogDetail(id);
    return {
      code: 200,
      message: "获取成功",
      data: log,
    };
  }

  @Get("order/:orderId")
  @ApiOperation({ summary: "获取指定订单的所有日志" })
  @ApiParam({ name: "orderId", description: "订单ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getOrderByOrderId(@Param("orderId") orderId: number) {
    const logs = await this.orderLogService.getLogsByOrderId(orderId);
    return {
      code: 200,
      message: "获取成功",
      data: logs,
    };
  }

  @Get("action-types")
  @ApiOperation({ summary: "获取操作类型列表" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getActionTypes() {
    const actionTypes = await this.orderLogService.getActionTypes();
    return {
      code: 200,
      message: "获取成功",
      data: actionTypes,
    };
  }

  @Post("add-log")
  @ApiOperation({ summary: "添加订单日志" })
  @ApiResponse({ status: 200, description: "添加成功" })
  async addOrderLog(
    @Body()
    logData: {
      order_id: number;
      user_id: number;
      action_type: string;
      action_desc: string;
      operator_id?: number;
      operator_type?: string;
      extra_data?: any;
    },
  ) {
    const result = await this.orderLogService.addOrderLog(logData);
    return {
      code: 200,
      message: "添加成功",
      data: result,
    };
  }

  @Get("statistics")
  @ApiOperation({ summary: "获取日志统计" })
  @ApiQuery({ name: "start_time", required: false, description: "开始时间" })
  @ApiQuery({ name: "end_time", required: false, description: "结束时间" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getLogStatistics(
    @Query() query: { start_time?: string; end_time?: string },
  ) {
    const statistics = await this.orderLogService.getLogStatistics(query);
    return {
      code: 200,
      message: "获取成功",
      data: statistics,
    };
  }
}
