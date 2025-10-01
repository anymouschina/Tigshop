// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { RegionService } from "./region.service";

@ApiTags("Admin API - 地区管理(兼容路径)")
@Controller("adminapi/setting/region")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminRegionCompatController {
  constructor(private readonly regionService: RegionService) {}

  // 兼容 PHP: GET /adminapi/setting/region/list
  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "地区列表（兼容）" })
  async list(
    @Query("parentId") parentId?: string,
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("keyword") keyword?: string,
  ) {
    const data = await this.regionService.getRegionListCompat({
      parentId: Number(parentId ?? 0),
      page: Math.max(1, Number(page) || 1),
      size: Math.max(1, Number(size) || 15),
      keyword: (keyword || "").trim(),
    });
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/region/getAllRegionTree
  @Get("getAllRegionTree")
  @Authorities("setting")
  @ApiOperation({ summary: "获取全部地区树（兼容）" })
  async getAllRegionTree() {
    const tree = await this.regionService.getRegionTree();
    return { code: 0, message: "success", data: tree };
  }
}
