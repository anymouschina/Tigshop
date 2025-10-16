// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
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
      this.prisma.area_code.findMany({
        where,
        orderBy: { id: "asc" },
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

  // 兼容 PHP: GET /adminapi/setting/areaCode/detail?id=1
  @Get("detail")
  @Authorities("setting")
  @ApiOperation({ summary: "国际区号详情（兼容）" })
  async detail(@Query("id") idParam?: string) {
    const id = Number(idParam || 0);
    if (!Number.isFinite(id) || id <= 0) {
      return { code: 400, message: "id 非法", data: null };
    }
    const item = await this.prisma.area_code.findUnique({ where: { id } });
    return { code: 0, message: "success", data: item || null };
  }

  // 兼容 PHP: POST /adminapi/setting/areaCode/create
  @Post("create")
  @Authorities("setting")
  @ApiOperation({ summary: "创建国际区号（兼容）" })
  async create(@Body() body: any) {
    const code = String(body.code || "").trim();
    const name = String(body.name || "").trim();
    const is_available =
      body.is_available !== undefined ? Number(body.is_available) : 1;
    const is_default =
      body.is_default !== undefined ? Number(body.is_default) : 0;
    if (!code || !name) {
      return { code: 400, message: "code 与 name 不能为空", data: null };
    }
    const item = await this.prisma.area_code.create({
      data: { code, name, is_available, is_default },
    });
    return { code: 0, message: "success", data: { id: item.id } };
  }

  // 兼容 PHP: POST /adminapi/setting/areaCode/update
  @Post("update")
  @Authorities("setting")
  @ApiOperation({ summary: "更新国际区号（兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id || body.areaCodeId || 0);
    if (!Number.isFinite(id) || id <= 0) {
      return { code: 400, message: "id 非法", data: null };
    }
    const data: any = {};
    if (body.code !== undefined) data.code = String(body.code).trim();
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.is_available !== undefined)
      data.is_available = Number(body.is_available);
    if (body.is_default !== undefined)
      data.is_default = Number(body.is_default);
    await this.prisma.area_code.update({ where: { id }, data });
    return { code: 0, message: "success", data: null };
  }

  // 兼容 PHP: POST /adminapi/setting/areaCode/del
  @Post("del")
  @Authorities("setting")
  @ApiOperation({ summary: "删除国际区号（兼容）" })
  async del(@Body() body: any) {
    const id = Number(body.id || body.areaCodeId || 0);
    if (!Number.isFinite(id) || id <= 0) {
      return { code: 400, message: "id 非法", data: null };
    }
    await this.prisma.area_code.delete({ where: { id } });
    return { code: 0, message: "success", data: null };
  }

  // 兼容 PHP: POST /adminapi/setting/areaCode/updateField
  @Post("updateField")
  @Authorities("setting")
  @ApiOperation({ summary: "更新单个字段（兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id || body.areaCodeId || 0);
    const field = String(body.field || body.key || "").trim();
    const value = body.value ?? body.val ?? body.data;
    if (!Number.isFinite(id) || id <= 0) {
      return { code: 400, message: "id 非法", data: null };
    }
    const allowed: Record<string, "string" | "tinyint"> = {
      code: "string",
      name: "string",
      is_available: "tinyint",
      is_default: "tinyint",
    };
    if (!allowed[field]) {
      return { code: 400, message: "不支持的字段", data: null };
    }
    const data: any = {};
    if (allowed[field] === "string") {
      data[field] = String(value ?? "").trim();
    } else {
      const n = Number(value);
      data[field] = Number.isFinite(n) ? (n > 0 ? 1 : 0) : 0;
    }
    await this.prisma.area_code.update({ where: { id }, data });
    return { code: 0, message: "success", data: null };
  }
}
