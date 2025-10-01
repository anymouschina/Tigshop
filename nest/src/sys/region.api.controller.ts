// @ts-nocheck
import { Controller, Get, Query, Request } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { RegionService } from "../setting/region/region.service";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("System Region (Public)")
@Controller("api/sys/region")
export class RegionApiController {
  constructor(private readonly regionService: RegionService) {}

  /**
   * 获取地区 - 对齐PHP版本 sys/region/getRegion
   * 入参：region_ids=1,2,3
   */
  @Get("getRegion")
  @Public()
  @ApiOperation({ summary: "获取地区（按ID列表）" })
  async getRegion(@Query("region_ids") regionIds: string = "") {
    const ids = (regionIds || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    if (ids.length === 0) return [];

    const rows = await this.regionService.getChildren(0); // 预加载可选
    // 简化：直接批量取 ids 对应记录
    const all = await this.regionService["prisma"].region.findMany({
      where: { region_id: { in: ids } },
      orderBy: { region_id: "asc" },
    });
    return all;
  }

  /**
   * 获得所有省份接口 - 对齐PHP版本 sys/region/getProvinceList
   */
  @Get("getProvinceList")
  @Public()
  @ApiOperation({ summary: "获取所有省份列表" })
  async getProvinceList() {
    // 省份通常 level=1 或 parent_id=0，根据现有表结构选择其一
    const provinces = await this.regionService["prisma"].region.findMany({
      where: { parent_id: 0 },
      orderBy: { region_id: "asc" },
    });
    // PHP端会去掉名称中的“省/市/自治区”
    return provinces.map((p) => ({
      ...p,
      region_name: String(p.region_name || p.name || "")
        .replace("省", "")
        .replace("市", "")
        .replace("自治区", ""),
    }));
  }

  /**
   * 获得用户所在省份 - 对齐PHP版本 sys/region/getUserRegion
   * 简化实现：通过请求IP无法在本地解析，返回省份列表的第一个作为兜底。
   */
  @Get("getUserRegion")
  @Public()
  @ApiOperation({ summary: "获取用户所在省份（简化兜底）" })
  async getUserRegion(@Request() req) {
    const provinces = await this.regionService["prisma"].region.findMany({
      where: { parent_id: 0 },
      orderBy: { region_id: "asc" },
    });
    // 兜底：返回第一项
    return provinces[0] || null;
  }
}
