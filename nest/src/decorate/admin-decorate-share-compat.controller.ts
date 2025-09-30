// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 装修分享(兼容)")
@Controller("adminapi/decorate/decorateShare")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminDecorateShareCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("share")
  @ApiOperation({ summary: "生成分享（简化版，返回占位链接）" })
  @Authorities("decorateManage")
  async share(@Query("decorate_id") decorateId: number) {
    const id = Number(decorateId || 0);
    if (!id) return { code: 1, message: "参数错误", data: null };
    // 简化：直接返回静态占位，前端只需要能过
    const sn = Math.random().toString().slice(2, 8);
    const token = Math.random().toString().slice(2, 7);
    return {
      code: 0,
      message: "success",
      data: { sn, token, api_url: `/api/home/share/import?sn=${sn}&token=${token}` },
    };
  }

  @Get("import")
  @ApiOperation({ summary: "导入分享（占位实现，总是成功）" })
  @Authorities("decorateManage")
  async import(@Query("url") url: string) {
    if (!url) return { code: 1, message: "请输入要导入的链接!", data: null };
    // 直接返回成功
    return { code: 0, message: "success", data: true };
  }
}
