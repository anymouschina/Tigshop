// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PanelService } from "./panel.service";
import { AuthorityService } from "../authority/authority.service";
import { SalesStatisticsService } from "../statistics/sales-statistics.service";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("Admin API - 面板")
@Controller("adminapi/panel")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class PanelController {
  constructor(
    private readonly panelService: PanelService,
    private readonly authorityService: AuthorityService,
    private readonly salesStatisticsService: SalesStatisticsService,
  ) {}

  @Get("panel/index")
  @Authorities("consoleManage")
  @ApiOperation({ summary: "获取面板首页" })
  async getPanelIndex(@Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      return {
        code: 1,
        message: "用户未登录",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    // 获取管理员信息以确定shopId
    const adminUser = await this.authorityService[
      "prisma"
    ].admin_user.findUnique({
      where: { admin_id: userId },
      select: { shop_id: true },
    });

    const shopId = adminUser?.shop_id || 1;

    // 获取面板数据
    const [consoleData, realTimeData, panelStatisticalData] = await Promise.all(
      [
        this.panelService.getConsoleData(shopId),
        this.panelService.getRealTimeData(shopId),
        this.panelService.getPanelStatisticalData(shopId),
      ],
    );

    return {
      code: 0,
      message: "success",
      data: {
        consoleData,
        realTimeData,
        panelStatisticalData,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: "获取控制台面板数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getDashboard() {
    const shopId = 1; // TODO: 从token中获取

    const [consoleData, realTimeData, panelStatisticalData] = await Promise.all(
      [
        this.panelService.getConsoleData(shopId),
        this.panelService.getRealTimeData(shopId),
        this.panelService.getPanelStatisticalData(shopId),
      ],
    );

    return {
      code: 200,
      message: "获取成功",
      data: {
        console_data: consoleData,
        real_time_data: realTimeData,
        panel_statistical_data: panelStatisticalData,
      },
    };
  }

  @Get("search-menu")
  @ApiOperation({ summary: "搜索菜单" })
  @ApiQuery({ name: "keyword", description: "关键词" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async searchMenu(@Query("keyword") keyword: string) {
    const adminType = 1; // TODO: 从token中获取
    const trimmedKeyword = keyword?.trim() || "";

    const menuList = await this.authorityService.getAuthorityList(
      trimmedKeyword,
      adminType,
    );

    return {
      code: 200,
      message: "获取成功",
      data: menuList,
    };
  }

  @Get("vendor")
  @ApiOperation({ summary: "获取供应商面板数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getVendorPanel() {
    const vendorId = 1; // TODO: 从token中获取

    if (vendorId <= 0) {
      return {
        code: 400,
        message: "无效的供应商ID",
      };
    }

    const data = await this.panelService.getPanelVendorIndex(vendorId);

    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("salesStatistics/list")
  @Authorities("consoleManage")
  @ApiOperation({ summary: "获取销售统计数据列表" })
  @ApiQuery({ name: "statisticType", description: "统计类型" })
  @ApiQuery({ name: "startEndTime", description: "开始结束时间" })
  @ApiQuery({ name: "dateType", description: "日期类型" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesStatisticsList(
    @Query()
    query: {
      statisticType?: number;
      startEndTime?: string;
      dateType?: number;
    },
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      return {
        code: 1,
        message: "用户未登录",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    // 获取管理员信息以确定shopId
    const adminUser = await this.authorityService[
      "prisma"
    ].admin_user.findUnique({
      where: { admin_id: userId },
      select: { shop_id: true },
    });

    const shopId = adminUser?.shop_id || 1;

    // 根据查询参数获取统计数据
    const { statisticType = 1, startEndTime, dateType = 1 } = query;

    try {
      let data;

      if (statisticType === 1) {
        // 获取销售数据和统计数据
        const salesData = await this.salesStatisticsService.getSalesData(
          shopId,
          startEndTime,
        );
        const salesStatisticsData =
          await this.salesStatisticsService.getSalesStatisticsData(
            shopId,
            dateType,
            startEndTime,
          );

        data = {
          salesData,
          salesStatisticsData,
        };
      } else {
        // 其他统计类型
        data = {
          statistic_type: statisticType,
          date_type: dateType,
          time_range: startEndTime,
          message: "其他统计类型待实现",
        };
      }

      return {
        code: 0,
        message: "success",
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 1,
        message: "获取统计数据失败",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
