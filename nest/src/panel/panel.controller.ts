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
      const userShopInfo =
        await this.panelService.validateUserAndGetShopId(req);
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
      const [consoleData, realTimeData, panelStatisticalData] =
        await Promise.all([
          this.panelService.getConsoleData(shopId),
          this.panelService.getRealTimeData(shopId),
          this.panelService.getPanelStatisticalData(shopId),
        ]);

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
  @Authorities("statisticsSalesManage")
  @ApiOperation({ summary: "获取销售统计数据列表" })
  @ApiQuery({ name: "statisticType", description: "统计类型" })
  @ApiQuery({ name: "startEndTime", description: "开始结束时间" })
  @ApiQuery({ name: "dateType", description: "日期类型" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSalesStatisticsList(
    @Query()
    query: {
      statisticType?: number;
      startEndTime?: string | string[];
      dateType?: number;
      isExport?: number;
    },
    @Request() req,
  ) {
    try {
      const userShopInfo =
        await this.panelService.validateUserAndGetShopId(req);
      if (!userShopInfo) {
        return {
          code: 1,
          message: "用户未登录",
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      const { shopId } = userShopInfo;
      const result = await this.salesStatisticsService.getSalesData({
        shop_id: shopId,
        statistic_type: Number(query?.statisticType ?? 1),
        date_type: Number(query?.dateType ?? 1),
        start_end_time: query?.startEndTime,
        is_export: Number(query?.isExport ?? 0),
      });

      return {
        code: 0,
        message: "success",
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 1,
        message: error?.message || "获取销售统计失败",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("salesStatistics/salesIndicators")
  @Authorities("statisticsSalesManage")
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
  @Authorities("statisticsSalesManage")
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

    const result = await this.salesStatisticsService.getSalesDetail({
      shop_id: shopId,
      start_time: startTime,
      end_time: endTime,
    });

    return {
      code: 0,
      message: "success",
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("salesStatistics/salesProductDetail")
  @Authorities("statisticsSalesManage")
  @ApiOperation({ summary: "获取销售商品明细" })
  @ApiQuery({ name: "startTime", required: false, description: "开始时间" })
  @ApiQuery({ name: "endTime", required: false, description: "结束时间" })
  @ApiQuery({ name: "keyword", required: false, description: "搜索关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "sortField", required: false, description: "排序字段" })
  @ApiQuery({ name: "sortOrder", required: false, description: "排序方式" })
  async getSalesProductDetail(
    @Query()
    query: {
      startTime?: string;
      endTime?: string;
      keyword?: string;
      page?: number;
      size?: number;
      sortField?: string;
      sortOrder?: string;
    },
    @Request() req,
  ) {
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
    const result = await this.salesStatisticsService.getSaleProductDetail(
      shopId,
      query,
    );

    return {
      code: 0,
      message: "success",
      data: {
        records: result.list,
        total: result.count,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get("salesStatistics/salesRanking")
  @Authorities("statisticsSalesManage")
  @ApiOperation({ summary: "获取销售排行数据" })
  @ApiQuery({ name: "startTime", required: false, description: "开始时间" })
  @ApiQuery({ name: "endTime", required: false, description: "结束时间" })
  @ApiQuery({ name: "keyword", required: false, description: "搜索关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "sortField", required: false, description: "排序字段" })
  @ApiQuery({ name: "sortOrder", required: false, description: "排序方式" })
  async getSalesRanking(
    @Query()
    query: {
      startTime?: string;
      endTime?: string;
      keyword?: string;
      page?: number;
      size?: number;
      sortField?: string;
      sortOrder?: string;
    },
    @Request() req,
  ) {
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
    const result = await this.salesStatisticsService.getSalesRanking(
      shopId,
      query,
    );

    const total = Number(result.count ?? 0);

    return {
      code: 0,
      message: "success",
      data: {
        records: result.list ?? [],
        total,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
