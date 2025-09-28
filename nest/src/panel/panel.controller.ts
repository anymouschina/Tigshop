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
    try {
      // 验证用户并获取shopId
      const userShopInfo = await this.panelService.validateUserAndGetShopId(req);
      if (!userShopInfo) {
        return {
          code: 1,
          message: "用户未登录",
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      const { shopId } = userShopInfo;

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
    } catch (error) {
      return {
        code: 1,
        message: error.message || "获取面板数据失败",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
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
    try {
      // 验证用户并获取shopId
      const userShopInfo = await this.panelService.validateUserAndGetShopId(req);
      if (!userShopInfo) {
        return {
          code: 1,
          message: "用户未登录",
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      const { shopId } = userShopInfo;
      const { statisticType = 1, startEndTime, dateType = 1 } = query;

      // 确保总是返回相同的数据结构，包含 salesData 和 salesStatisticsData
      let salesData;
      let salesStatisticsData;

      if (statisticType === 1) {
        // 获取销售数据和统计数据
        salesData = await this.salesStatisticsService.getSalesData(
          shopId,
          startEndTime,
        );
        salesStatisticsData =
          await this.salesStatisticsService.getSalesStatisticsData(
            shopId,
            dateType,
            startEndTime,
          );
      } else {
        // 其他统计类型 - 返回默认数据结构
        salesData = {
          productPayment: 0,
          productPaymentGrowthRate: 0,
          productRefund: 0,
          prevProductRefund: 0,
          productRefundGrowthRate: 0,
          rechargeAmount: 0,
          rechargeAmountGrowthRate: 0,
          turnover: 0,
          turnoverGrowthRate: 0,
          balancePayment: 0,
          balancePaymentGrowthRate: 0,
        };

        salesStatisticsData = {
          horizontalAxis: [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
          ],
          longitudinalAxis: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        };
      }

      const data = {
        salesData,
        salesStatisticsData,
        statistic_type: statisticType,
        date_type: dateType,
        time_range: startEndTime,
      };

      return {
        code: 0,
        message: "success",
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // 即使出错也返回默认的数据结构
      const data = {
        salesData: {
          productPayment: 0,
          productPaymentGrowthRate: 0,
          productRefund: 0,
          prevProductRefund: 0,
          productRefundGrowthRate: 0,
          rechargeAmount: 0,
          rechargeAmountGrowthRate: 0,
          turnover: 0,
          turnoverGrowthRate: 0,
          balancePayment: 0,
          balancePaymentGrowthRate: 0,
        },
        salesStatisticsData: {
          horizontalAxis: [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
          ],
          longitudinalAxis: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        statistic_type: query.statisticType,
        date_type: query.dateType,
        time_range: query.startEndTime,
        error: error.message,
      };

      return {
        code: 0,
        message: "获取统计数据成功（部分数据可能为默认值）",
        data,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("salesStatistics/salesIndicators")
  @Authorities("consoleManage")
  @ApiOperation({ summary: "获取销售指标数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesIndicators(@Request() req) {
      // 获取销售指标数据 - 逻辑在Service层
      const salesIndicators = await this.panelService.getSalesIndicatorsData(req);

      return {
        code: 0,
        message: "success",
        data: salesIndicators,
        timestamp: new Date().toISOString(),
      };
  }

  @Get("salesStatistics/salesDetail")
  @Authorities("consoleManage")
  @ApiOperation({ summary: "获取销售详情数据" })
  @ApiQuery({ name: "startTime", description: "开始时间" })
  @ApiQuery({ name: "endTime", description: "结束时间" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesDetail(
    @Query()
    query: {
      startTime?: string;
      endTime?: string;
    },
    @Request() req,
  ) {
      // 直接获取shopId，因为有全局鉴权保证用户已登录
      const shopId = await this.panelService.getUserShopId(req.user.userId);
      const { startTime, endTime } = query;

      // 获取销售详情数据 - 按照PHP实现的结构
      const salesData = await this.salesStatisticsService.getSalesDetail(
        shopId,
        startTime,
        endTime,
      );

      // 获取图表统计数据
      const salesStatisticsData =
        await this.salesStatisticsService.getSalesStatisticsData(
          shopId,
          1, // dateType = 1 (按月统计)
          startTime?.substring(0, 4) || new Date().getFullYear().toString(),
        );

      // 按照PHP实现返回结构
      const data = {
        salesData: {
          productView: salesData.totalOrders || 0, // 暂时用订单数代替浏览量
          productViewGrowthRate: 0,
          productVisitor: salesData.completedOrders || 0, // 暂时用完成订单数代替访客数
          productVisitorGrowthRate: 0,
          orderNum: salesData.totalOrders || 0,
          orderNumGrowthRate: 0,
          paymentAmount: salesData.totalSales || 0,
          paymentAmountGrowthRate: 0,
          refundAmount: 0, // 暂时设为0
          refundAmountGrowthRate: 0,
          refundQuantity: 0, // 暂时设为0
          refundQuantityGrowthRate: 0,
        },
        salesStatisticsData: {
          horizontalAxis: salesStatisticsData.horizontalAxis || [],
          longitudinalAxisPaymentAmount: salesStatisticsData.longitudinalAxis || [],
          longitudinalAxisRefundAmount: [],
          longitudinalAxisProductView: [],
          longitudinalAxisProductVisitor: [],
        },
      };

      return {
        code: 0,
        message: "success",
        data,
        timestamp: new Date().toISOString(),
      };
  }
}
