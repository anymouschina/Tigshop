// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 语言(兼容路径)")
@Controller("adminapi/lang/locales")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminLocalesCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "语言列表（兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const skip = (page - 1) * size;
    const keyword = (query.keyword || "").trim();
    const where: any = {};
    if (keyword) {
      where.OR = [
        { locale_code: { contains: keyword } },
        { language: { contains: keyword } },
      ];
    }
    const [total, records] = await this.prisma.$transaction([
      this.prisma.locales.count({ where }),
      this.prisma.locales.findMany({
        where,
        orderBy: { sort: "asc" },
        skip,
        take: size,
      }),
    ]);
    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size) || 1,
      },
    };
  }
}
