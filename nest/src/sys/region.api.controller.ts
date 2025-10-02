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
  async getRegion(@Query() query: any) {
    const rawCandidates: any[] = [];
    // 支持多种参数名：region_ids、regionIds、ids、id、region_ids[]，表示父级ID集合
    if (query?.region_ids !== undefined) rawCandidates.push(query.region_ids);
    if (query?.regionIds !== undefined) rawCandidates.push(query.regionIds);
    if (query?.ids !== undefined) rawCandidates.push(query.ids);
    if (query?.id !== undefined) rawCandidates.push(query.id);
    if (query?.["region_ids[]"] !== undefined)
      rawCandidates.push(query["region_ids[]"]);

    const toArray = (val: any): any[] => {
      if (val == null) return [];
      if (Array.isArray(val)) return val;
      const s = String(val).trim();
      if (!s) return [];
      // 兼容 JSON 数组或逗号分隔
      if ((s.startsWith("[") && s.endsWith("]")) || s.startsWith("{")) {
        try {
          const parsed = JSON.parse(s);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // fallthrough to comma split
        }
      }
      return s.split(",");
    };

    let parentIds = Array.from(
      new Set(
        rawCandidates
          .flatMap((v) => toArray(v))
          .map((v) => Number(String(v).trim()))
          .filter((n) => Number.isFinite(n) && n >= 0),
      ),
    );

    // 如果未传任何ID，默认查询 parent_id=0 的子地区（顶级）
    if (parentIds.length === 0) parentIds = [0];

    const lists: any[][] = [];

    // 若传入的 parentIds 都不是 0，则先返回顶级（parent_id=0）作为第一个数组
    if (!parentIds.includes(0)) {
      const topRows = await this.regionService["prisma"].region.findMany({
        where: { parent_id: 0 },
        orderBy: { region_id: "asc" },
        select: { region_id: true, region_name: true, level: true },
      });
      const topMapped = topRows.map((r) => ({
        regionId: r.region_id,
        regionName: r.region_name,
        level: Number(r.level ?? 0),
      }));
      lists.push(topMapped);
    }

    for (const pid of parentIds) {
      const rows = await this.regionService["prisma"].region.findMany({
        where: { parent_id: pid },
        orderBy: { region_id: "asc" },
        select: { region_id: true, region_name: true, level: true },
      });
      const mapped = rows.map((r) => ({
        regionId: r.region_id,
        regionName: r.region_name,
        level: Number(r.level ?? 0),
      }));
      lists.push(mapped);
    }

    return { code: 0, message: "success", data: lists };
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
