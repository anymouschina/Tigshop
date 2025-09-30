// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
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

  // 兼容 PHP: GET /adminapi/setting/region/getAllRegionTree
  @Get("getAllRegionTree")
  @Authorities("setting")
  @ApiOperation({ summary: "获取全部地区树（兼容）" })
  async getAllRegionTree() {
    const tree = await this.regionService.getRegionTree();
    return { code: 0, message: "success", data: tree };
  }
}
