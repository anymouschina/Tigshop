// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { Response } from "express";
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
  async getDashboard(@Request() req) {
    const info = await this.panelService.validateUserAndGetShopId(req);
    if (!info) {
      return { code: 1, message: "用户未登录", data: null };
    }
    const { shopId } = info;
    const [consoleData, realTimeData, panelStatisticalData] = await Promise.all([
      this.panelService.getConsoleData(shopId),
      this.panelService.getRealTimeData(shopId),
      this.panelService.getPanelStatisticalData(shopId),
    ]);

    return {
      code: 0,
      message: "success",
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
  async searchMenu(@Query("keyword") keyword: string, @Request() req) {
    const adminType = await this.panelService.getUserAdminType(req.user?.userId);
    const trimmedKeyword = keyword?.trim() || "";

    const menuList = await this.authorityService.getAuthorityList(
      trimmedKeyword,
      adminType,
    );

    return { code: 0, message: "success", data: menuList };
  }

  @Get("vendor")
  @ApiOperation({ summary: "获取供应商面板数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getVendorPanel(@Request() req) {
    const vendorId = await this.panelService.getUserVendorId(req.user?.userId);

    if (vendorId <= 0) {
      return { code: 400, message: "无效的供应商ID" };
    }

    const data = await this.panelService.getPanelVendorIndex(vendorId);

    return { code: 0, message: "success", data };
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

  @Get("statisticsUser/userStatisticsPanel")
  @Authorities("statisticsUserManage")
  @ApiOperation({ summary: "用户统计面板" })
  @ApiQuery({ name: "startTime", required: false, description: "开始日期 YYYY-MM-DD" })
  @ApiQuery({ name: "endTime", required: false, description: "结束日期 YYYY-MM-DD" })
  @ApiQuery({ name: "isExport", required: false, description: "是否导出，1为导出" })
  async getUserStatisticsPanel(
    @Query()
    query: {
      startTime?: string;
      endTime?: string;
      isExport?: string | number;
    },
    @Request() req,
  ) {
    try {
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
      const result = await this.panelService.getUserStatisticsPanel(shopId, query?.startTime, query?.endTime);

      // 预留：如需导出，这里根据 isExport 返回文件流
      // 目前前端仅需要JSON数据以渲染『用户概览』，导出后续补充

      return {
        code: 0,
        message: "success",
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 1,
        message: error?.message || "获取用户统计失败",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("statisticsUser/userConsumptionRanking")
  @Authorities("statisticsUserManage")
  @ApiOperation({ summary: "会员消费排行" })
  @ApiQuery({ name: "startTime", required: true, description: "开始日期 YYYY-MM-DD" })
  @ApiQuery({ name: "endTime", required: true, description: "结束日期 YYYY-MM-DD" })
  @ApiQuery({ name: "keyword", required: false, description: "会员名称或手机号" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "sortField", required: false, description: "排序字段：orderAmount|orderNum" })
  @ApiQuery({ name: "sortOrder", required: false, description: "排序规则：asc|desc" })
  async getUserConsumptionRanking(
    @Query()
    query: {
      startTime?: string;
      endTime?: string;
      keyword?: string;
      page?: number | string;
      size?: number | string;
      sortField?: string;
      sortOrder?: string;
      isExport?: string;
    },
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const userShopInfo = await this.panelService.validateUserAndGetShopId(req);
      if (!userShopInfo) {
        return res.json({
          code: 1,
          message: "用户未登录",
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      const { shopId } = userShopInfo;
      const page = Number(query.page || 1);
      const size = Number(query.size || 15);
      const result = await this.panelService.getUserConsumptionRanking(shopId, {
        startTime: query.startTime,
        endTime: query.endTime,
        keyword: query.keyword || "",
        page,
        size,
        sortField: query.sortField,
        sortOrder: query.sortOrder,
        isExport: query.isExport,
      });

      if (query.isExport === "1") {
        // 导出 CSV
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="user-consumption-ranking-${new Date().toISOString().slice(0,10)}.csv"`,
        );
        return res.send(result);
      }

      return res.json({
        code: 0,
        message: "success",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.json({
        code: 1,
        message: error?.message || "获取消费排行失败",
        data: null,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get("statisticsUser/addUserTrends")
  @Authorities("statisticsUserManage")
  @ApiOperation({ summary: "新增会员趋势" })
  @ApiQuery({ name: "dateType", required: true, description: "统计维度：1=年(按月)、2=月(按日)、3=日(按时)" })
  @ApiQuery({ name: "startEndTime", required: true, description: "维度起点：年(YYYY)/月(YYYY-MM)/日(YYYY-MM-DD)" })
  @ApiQuery({ name: "isExport", required: false, description: "是否导出，1=导出CSV" })
  async getAddUserTrends(
    @Query()
    query: {
      dateType?: string;
      startEndTime?: string;
      isExport?: string;
    },
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const userShopInfo = await this.panelService.validateUserAndGetShopId(req);
      if (!userShopInfo) {
        return res.json({
          code: 1,
          message: "用户未登录",
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      const dateType = String(query?.dateType ?? "1");
      const startEndTime = String(query?.startEndTime ?? "");
      if (!startEndTime) {
        return res.json({
          code: 1,
          message: "请选择日期",
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      const result = await this.panelService.getAddUserTrends(dateType, startEndTime);

      if (query.isExport === "1") {
        // 导出CSV：时间,新增人数
        const header = "时间,新增人数\n";
        const csvBody = result.horizontalAxis
          .map((label: string | number, idx: number) => `${label},${result.longitudinalAxis[idx] ?? 0}`)
          .join("\n");
        const csv = header + csvBody;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="add-user-trends-${new Date().toISOString().slice(0,10)}.csv"`,
        );
        return res.send(Buffer.from(csv, "utf8"));
      }

      return res.json({
        code: 0,
        message: "success",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.json({
        code: 1,
        message: error?.message || "获取新增会员趋势失败",
        data: null,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get("statisticsAccess/accessStatistics")
  @Authorities("statisticsAccessManage")
  @ApiOperation({ summary: "访问统计（点击量/访客数）" })
  @ApiQuery({ name: "startTime", required: true, description: "开始日期 YYYY-MM-DD" })
  @ApiQuery({ name: "endTime", required: true, description: "结束日期 YYYY-MM-DD" })
  @ApiQuery({ name: "isHits", required: true, description: "是否点击量：1=点击量，0=访客数" })
  async getAccessStatistics(
    @Query()
    query: {
      startTime: string;
      endTime: string;
      isHits: string | number;
    },
    @Request() req,
  ) {
    try {
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
      const result = await this.panelService.getAccessStatistics(
        shopId,
        query.startTime,
        query.endTime,
        Number(query.isHits || 0),
      );

      return {
        code: 0,
        message: "success",
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 1,
        message: error?.message || "获取访问统计失败",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
