// @ts-nocheck
import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { UserStatisticsService } from "./user-statistics.service";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PanelService } from "../panel/panel.service";

@ApiTags("用户统计")
@Controller("admin/statistics/user")
@UseGuards(RolesGuard)
@Roles("admin")
export class UserStatisticsController {
  constructor(
    private readonly userStatisticsService: UserStatisticsService,
    private readonly panelService: PanelService,
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "获取用户统计概览" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserOverview(@Request() req) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);

    const [totalUsers, newUsersToday, activeUsers, userGrowth] =
      await Promise.all([
        this.userStatisticsService.getTotalUsers(shopId),
        this.userStatisticsService.getNewUsersToday(shopId),
        this.userStatisticsService.getActiveUsers(shopId),
        this.userStatisticsService.getUserGrowth(shopId),
      ]);

    return {
      code: 0,
      message: "success",
      data: {
        total_users: totalUsers,
        new_users_today: newUsersToday,
        active_users: activeUsers,
        user_growth: userGrowth,
      },
    };
  }

  @Get("trend")
  @ApiOperation({ summary: "获取用户趋势" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month, year",
    enum: ["day", "week", "month", "year"],
  })
  @ApiQuery({ name: "start_date", required: false, description: "开始日期" })
  @ApiQuery({ name: "end_date", required: false, description: "结束日期" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserTrend(
    @Query()
    query: {
      period?: "day" | "week" | "month" | "year";
      start_date?: string;
      end_date?: string;
    },
    @Request() req,
  ) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);
    const trend = await this.userStatisticsService.getUserTrend(shopId, query);

    return {
      code: 0,
      message: "success",
      data: trend,
    };
  }

  @Get("distribution")
  @ApiOperation({ summary: "获取用户分布" })
  @ApiQuery({
    name: "type",
    required: false,
    description: "分布类型：region, device, source",
    enum: ["region", "device", "source"],
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserDistribution(
    @Query("type") type: "region" | "device" | "source" = "region",
    @Request() req,
  ) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);
    const distribution = await this.userStatisticsService.getUserDistribution(
      shopId,
      type,
    );

    return {
      code: 0,
      message: "success",
      data: distribution,
    };
  }

  @Get("rank")
  @ApiOperation({ summary: "获取用户等级分布" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserRankDistribution(@Request() req) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);
    const rankDistribution =
      await this.userStatisticsService.getUserRankDistribution(shopId);

    return {
      code: 0,
      message: "success",
      data: rankDistribution,
    };
  }

  @Get("activity")
  @ApiOperation({ summary: "获取用户活跃度统计" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：day, week, month",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserActivity(
    @Query("period") period: "day" | "week" | "month" = "week",
    @Request() req,
  ) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);
    const activity = await this.userStatisticsService.getUserActivity(
      shopId,
      period,
    );

    return {
      code: 0,
      message: "success",
      data: activity,
    };
  }

  @Get("retention")
  @ApiOperation({ summary: "获取用户留存率" })
  @ApiQuery({
    name: "period",
    required: false,
    description: "统计周期：7, 30, 90",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserRetention(@Query("period") period: number = 7, @Request() req) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);
    const retention = await this.userStatisticsService.getUserRetention(
      shopId,
      period,
    );

    return {
      code: 0,
      message: "success",
      data: retention,
    };
  }

  @Get("export")
  @ApiOperation({ summary: "导出用户统计数据" })
  @ApiQuery({
    name: "type",
    required: true,
    description: "导出类型：overview, trend, distribution",
  })
  @ApiQuery({
    name: "format",
    required: false,
    description: "导出格式：excel, csv",
    enum: ["excel", "csv"],
  })
  @ApiResponse({ status: 200, description: "导出成功" })
  async exportUserStatistics(
    @Query()
    query: {
      type: "overview" | "trend" | "distribution";
      format?: "excel" | "csv";
      start_date?: string;
      end_date?: string;
    },
    @Request() req,
  ) {
    const shopId = await this.panelService.getUserShopId(req.user?.userId);
    const result = await this.userStatisticsService.exportUserStatistics(
      shopId,
      query,
    );

    return {
      code: 0,
      message: "success",
      data: result,
    };
  }
}
