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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { UserBalanceLogService } from "./user-balance-log.service";
import {
  UserBalanceLogQueryDto,
  UserBalanceLogDetailDto,
  CreateUserBalanceLogDto,
  UpdateUserBalanceLogDto,
  DeleteUserBalanceLogDto,
  BatchDeleteUserBalanceLogDto,
  USER_BALANCE_LOG_TYPE,
  BALANCE_CHANGE_TYPE,
} from "./user-balance-log.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("财务管理-用户余额记录")
@Controller("admin/finance/user-balance-log")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class UserBalanceLogController {
  constructor(private readonly userBalanceLogService: UserBalanceLogService) {}

  @Get()
  @ApiOperation({ summary: "获取用户余额记录列表" })
  @ApiQuery({ name: "keyword", description: "关键词搜索", required: false })
  @ApiQuery({ name: "user_id", description: "用户ID", required: false })
  @ApiQuery({ name: "order_id", description: "订单ID", required: false })
  @ApiQuery({ name: "type", description: "类型", required: false })
  @ApiQuery({ name: "change_type", description: "变更类型", required: false })
  @ApiQuery({ name: "start_date", description: "开始日期", required: false })
  @ApiQuery({ name: "end_date", description: "结束日期", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  async findAll(@Query() query: UserBalanceLogQueryDto) {
    return await this.userBalanceLogService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取用户余额记录详情" })
  @ApiParam({ name: "id", description: "余额记录ID" })
  async findOne(@Param("id") id: number) {
    return await this.userBalanceLogService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "创建用户余额记录" })
  async create(@Body() createUserBalanceLogDto: CreateUserBalanceLogDto) {
    return await this.userBalanceLogService.create(createUserBalanceLogDto);
  }

  @Put()
  @ApiOperation({ summary: "更新用户余额记录" })
  async update(@Body() updateUserBalanceLogDto: UpdateUserBalanceLogDto) {
    return await this.userBalanceLogService.update(updateUserBalanceLogDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除用户余额记录" })
  @ApiParam({ name: "id", description: "余额记录ID" })
  async remove(@Param("id") id: number) {
    return await this.userBalanceLogService.remove(id);
  }

  @Post("batch-delete")
  @ApiOperation({ summary: "批量删除用户余额记录" })
  async batchRemove(
    @Body() batchDeleteUserBalanceLogDto: BatchDeleteUserBalanceLogDto,
  ) {
    return await this.userBalanceLogService.batchRemove(
      batchDeleteUserBalanceLogDto.ids,
    );
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "获取用户余额记录" })
  @ApiParam({ name: "userId", description: "用户ID" })
  @ApiQuery({ name: "type", description: "类型", required: false })
  async getUserBalanceLogs(
    @Param("userId") userId: number,
    @Query("type") type?: number,
  ) {
    return await this.userBalanceLogService.getUserBalanceLogs(userId, type);
  }

  @Get("stats/balance")
  @ApiOperation({ summary: "获取余额统计" })
  @ApiQuery({ name: "user_id", description: "用户ID", required: false })
  async getBalanceStats(@Query("user_id") userId?: number) {
    return await this.userBalanceLogService.getBalanceStats(userId);
  }

  @Get("stats/monthly")
  @ApiOperation({ summary: "获取月度余额统计" })
  @ApiQuery({ name: "user_id", description: "用户ID", required: false })
  @ApiQuery({ name: "year", description: "年份", required: false })
  async getMonthlyBalanceStats(
    @Query("user_id") userId?: number,
    @Query("year") year?: number,
  ) {
    return await this.userBalanceLogService.getMonthlyBalanceStats(
      userId,
      year,
    );
  }

  @Get("stats/top-users")
  @ApiOperation({ summary: "获取余额排行榜" })
  @ApiQuery({ name: "limit", description: "数量限制", required: false })
  async getTopBalanceUsers(@Query("limit") limit: number = 10) {
    return await this.userBalanceLogService.getTopBalanceUsers(limit);
  }

  @Get("type/list")
  @ApiOperation({ summary: "获取余额记录类型列表" })
  async getTypeList() {
    return USER_BALANCE_LOG_TYPE;
  }

  @Get("change-type/list")
  @ApiOperation({ summary: "获取余额变更类型列表" })
  async getChangeTypeList() {
    return BALANCE_CHANGE_TYPE;
  }
}
