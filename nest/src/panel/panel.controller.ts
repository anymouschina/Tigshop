// @ts-nocheck
import { Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { PanelService } from "./panel.service";
import { AuthorityService } from "../authority/authority.service";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("统计面板")
@Controller("admin/panel")
@UseGuards(RolesGuard)
@Roles("admin")
export class PanelController {
  constructor(
    private readonly panelService: PanelService,
    private readonly authorityService: AuthorityService,
  ) {}

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
}
