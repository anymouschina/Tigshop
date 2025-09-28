// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { TipsManageService } from "./tips-manage.service";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";

@ApiTags("Common API - 系统状态")
@Controller("adminapi/common/tipsManage")
@UseGuards(AdminJwtAuthGuard)
export class TipsManageController {
  constructor(private readonly tipsmanageService: TipsManageService) {}

  @ApiOperation({ summary: "获取系统状态提示" })
  @Get("list")
  async list() {
    const tips = await this.tipsmanageService.getSystemStatusTips();

    return {
      code: 0,
      message: "success",
      data: tips,
    };
  }
}
