// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 区号(兼容路径)")
@Controller("adminapi/setting/areaCode")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminAreaCodeCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "国际区号列表（兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const skip = (page - 1) * size;
    const keyword = (query.keyword || "").trim();
    const where: any = {};
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } },
      ];
    }
    const [total, records] = await this.prisma.$transaction([
      this.prisma.area_code.count({ where }),
      this.prisma.area_code.findMany({ where, orderBy: { id: "asc" }, skip, take: size }),
    ]);
    return { code: 0, message: "success", data: { records, total, page, size, totalPages: Math.ceil(total / size) || 1 } };
  }
}
