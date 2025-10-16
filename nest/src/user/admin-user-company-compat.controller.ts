// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 会员企业认证(兼容)")
@Controller("adminapi/user/userCompany")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserCompanyCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "企业认证列表（兼容）" })
  @Authorities("userCertificationManage")
  async list(@Query() q: any) {
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? "id").toString();
    const sortOrder = (
      (q.sort_order ?? "desc").toString().toLowerCase() === "asc"
        ? "asc"
        : "desc"
    ) as any;
    const username = (q.username || "").trim();
    const type = q.type !== undefined ? Number(q.type) : undefined;
    const status = q.status !== undefined ? Number(q.status) : undefined;

    const where: any = {};
    if (!Number.isNaN(type) && type !== undefined && type !== 0)
      where.type = type;
    if (!Number.isNaN(status) && status !== undefined && status !== 0)
      where.status = status;
    // 无联表：用户名通过后续 enrichment，可选

    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_company.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortField]: sortOrder },
      }),
      (this.prisma as any).user_company.count({ where }),
    ]);

    // enrich username if requested
    let records = rows;
    if (username) {
      const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
      const users = userIds.length
        ? await (this.prisma as any).user.findMany({
            where: { user_id: { in: userIds } },
            select: { user_id: true, username: true },
          })
        : [];
      const map = new Map(users.map((u: any) => [u.user_id, u.username]));
      records = rows
        .map((r: any) => ({ ...r, username: map.get(r.user_id) || "" }))
        .filter((r: any) => r.username.includes(username));
    }

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total: username ? records.length : total,
        size,
        current: page,
        pages: Math.ceil((username ? records.length : total) / size),
      },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "企业认证详情（兼容）" })
  @Authorities("userCertificationManage")
  async detail(@Query("id") idStr?: string) {
    const id = Number(idStr);
    if (!id) return { code: 0, message: "success", data: null };
    const item = await (this.prisma as any).user_company.findUnique({
      where: { id },
    });
    return { code: 0, message: "success", data: item };
  }

  @Post("audit")
  @ApiOperation({ summary: "企业认证审核（兼容）" })
  @Authorities("userCertificationManage")
  async audit(@Body() dto: any) {
    const id = Number(dto.id);
    if (!id) return { code: 400, message: "id required", data: null };
    const data: any = {
      status: Number(dto.status ?? 0),
      audit_remark: String(dto.audit_remark ?? ""),
      audit_time: new Date(),
    };
    await (this.prisma as any).user_company.update({ where: { id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除企业认证（兼容）" })
  @Authorities("userCertificationManage")
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 400, message: "id required", data: null };
    await (this.prisma as any).user_company.delete({ where: { id: num } });
    return { code: 0, message: "success", data: true };
  }
}
