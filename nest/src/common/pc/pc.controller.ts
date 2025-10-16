// @ts-nocheck
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { CommonConfigService } from "../config/config.service";

@ApiTags("Common - PC 公共接口")
@Controller("api/common/pc")
export class CommonPcController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: CommonConfigService,
  ) {}

  /**
   * 获取PC头部信息 - 对齐 PHP common.pc/getHeader
   * 目前PHP返回为空对象，这里返回站点相关配置，可逐步扩展
   */
  @Get("getHeader")
  @Public()
  @ApiOperation({ summary: "获取PC头部信息" })
  async getHeader() {
    const theme = await this.configService.getThemeSettings();
    return {
      code: 0,
      message: "success",
      data: {
        pcDomain: theme.pcDomain || "",
        shopName: theme.shopName || "",
        ico_defined_css: theme.icoDefinedCss || "",
      },
    };
  }

  /**
   * 获取PC导航栏 - 对齐 PHP common.pc/getNav
   */
  @Get("getNav")
  @Public()
  @ApiOperation({ summary: "获取PC导航栏" })
  async getNav() {
    // 获取所有展示的导航项，并构造四类分组
    const records = await this.prisma.pc_navigation.findMany({
      where: { is_show: true },
      orderBy: [{ parent_id: "asc" }, { id: "asc" }],
    });

    // 根据parent_id构造两层树，然后按type拆分
    const byId: Record<number, any> = {};
    for (const item of records) byId[item.id] = { ...item, children: [] };
    const roots: any[] = [];
    for (const item of records) {
      const node = byId[item.id];
      if (!item.parent_id) roots.push(node);
      else byId[item.parent_id]?.children?.push(node);
    }

    const flattenSecondLevel = (list: any[]) =>
      list.map((n) => ({
        ...n,
        children: (n.children || []).map((c) => ({
          ...c,
          children: undefined,
        })),
      }));

    const main_nav = flattenSecondLevel(roots.filter((n) => n.type === 1));
    const top_bar_nav = flattenSecondLevel(roots.filter((n) => n.type === 2));
    const bottom_nav = flattenSecondLevel(roots.filter((n) => n.type === 3));
    const sidebar_nav = flattenSecondLevel(roots.filter((n) => n.type === 4));

    return {
      code: 0,
      message: "success",
      data: { main_nav, top_bar_nav, bottom_nav, sidebar_nav },
    };
  }

  /**
   * 获取PC分类抽屉 - 对齐 PHP common.pc/getCatFloor
   */
  @Get("getCatFloor")
  @Public()
  @ApiOperation({ summary: "获取PC分类抽屉" })
  async getCatFloor() {
    const floors = await this.prisma.pc_cat_floor.findMany({
      where: { is_show: 1 },
      orderBy: { sort_order: "asc" },
    });
    const cfg = await this.configService.getThemeSettings();
    return {
      code: 0,
      message: "success",
      data: {
        cat_floor: floors,
        ico_defined_css: cfg.icoDefinedCss || "",
      },
    };
  }
}
