import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import {
  BalanceService,
  BalanceQueryDto,
  BalanceAdjustmentDto,
  BalanceStatsDto,
} from "./balance.service";
import { AdminJwtAuthGuard } from "../../auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { Authorities } from "../../auth/decorators/authority.decorator";

@ApiTags("Admin API - 财务管理 - 余额管理")
@Controller("adminapi/finance/balance")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @Authorities("financeManage")
  @ApiOperation({ summary: "获取用户余额列表" })
  @ApiQuery({ name: "user_id", description: "用户ID", required: false })
  @ApiQuery({ name: "min_balance", description: "最小余额", required: false })
  @ApiQuery({ name: "max_balance", description: "最大余额", required: false })
  @ApiQuery({ name: "start_time", description: "开始时间", required: false })
  @ApiQuery({ name: "end_time", description: "结束时间", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  async findAll(@Query() query: BalanceQueryDto) {
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.findAll(query),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(":userId")
  @Authorities("financeManage")
  @ApiOperation({ summary: "获取用户余额详情" })
  @ApiParam({ name: "userId", description: "用户ID" })
  async findOne(@Param("userId") userId: number) {
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.findOne(userId),
      timestamp: new Date().toISOString(),
    };
  }

  @Post("adjust")
  @Authorities("financeManage")
  @ApiOperation({ summary: "调整用户余额" })
  async adjustBalance(
    @Body() adjustmentDto: BalanceAdjustmentDto,
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.adjustBalance(adjustmentDto, adminId),
      timestamp: new Date().toISOString(),
    };
  }

  @Post("freeze")
  @Authorities("financeManage")
  @ApiOperation({ summary: "冻结用户余额" })
  async freezeBalance(
    @Body() body: { user_id: number; amount: number; description: string },
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.freezeBalance(
        body.user_id,
        body.amount,
        body.description,
        adminId,
      ),
      timestamp: new Date().toISOString(),
    };
  }

  @Post("unfreeze")
  @Authorities("financeManage")
  @ApiOperation({ summary: "解冻用户余额" })
  async unfreezeBalance(
    @Body() body: { user_id: number; amount: number; description: string },
    @Request() req,
  ) {
    const adminId = req.user?.userId;
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.unfreezeBalance(
        body.user_id,
        body.amount,
        body.description,
        adminId,
      ),
      timestamp: new Date().toISOString(),
    };
  }

  @Get(":userId/logs")
  @Authorities("financeManage")
  @ApiOperation({ summary: "获取用户余额变动记录" })
  @ApiParam({ name: "userId", description: "用户ID" })
  @ApiQuery({ name: "change_type", description: "变更类型", required: false })
  @ApiQuery({ name: "start_time", description: "开始时间", required: false })
  @ApiQuery({ name: "end_time", description: "结束时间", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  async getBalanceLogs(@Param("userId") userId: number, @Query() query: any) {
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.getBalanceLogs(userId, query),
      timestamp: new Date().toISOString(),
    };
  }

  @Get("stats/overview")
  @Authorities("financeManage")
  @ApiOperation({ summary: "获取余额统计概览" })
  @ApiQuery({ name: "start_time", description: "开始时间", required: false })
  @ApiQuery({ name: "end_time", description: "结束时间", required: false })
  async getBalanceStats(@Query() query: BalanceStatsDto) {
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.getBalanceStats(query),
      timestamp: new Date().toISOString(),
    };
  }

  @Get("top/users")
  @Authorities("financeManage")
  @ApiOperation({ summary: "获取余额排行榜" })
  @ApiQuery({ name: "limit", description: "数量限制", required: false })
  async getTopUsers(@Query("limit") limit: number = 10) {
    return {
      code: 0,
      message: "success",
      data: await this.balanceService.getTopUsers(limit),
      timestamp: new Date().toISOString(),
    };
  }

  @Get("change-types")
  @ApiOperation({ summary: "获取余额变更类型列表" })
  async getChangeTypes() {
    const changeTypes = {
      0: "未知",
      1: "余额增加",
      2: "余额冻结",
      3: "余额解冻",
      4: "余额扣减",
      5: "退款增加",
      6: "订单支付",
      7: "提现扣减",
      8: "充值增加",
      9: "系统调整",
    };
    return {
      code: 0,
      message: "success",
      data: changeTypes,
      timestamp: new Date().toISOString(),
    };
  }
}
