// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 管理员用户(兼容)")
@Controller("adminapi/authority/adminUser")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserCompatController {
  // 简单内存验证码缓存（进程级）
  private static codeCache: Map<string, { code: string; expiredAt: number }> = new Map();

  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "管理员列表（兼容精简版）" })
  @Authorities("adminUserList")
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const skip = (page - 1) * size;
    const keyword = (query.keyword || "").trim();
    const where: any = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { mobile: { contains: keyword } },
      ];
    }
    const [records, total] = await Promise.all([
      this.prisma.admin_user.findMany({
        where,
        skip,
        take: size,
        orderBy: { admin_id: "desc" },
        select: {
          admin_id: true,
          username: true,
          email: true,
          mobile: true,
          role_id: true,
          shop_id: true,
          suppliers_id: true,
          add_time: true,
          is_using: true,
        },
      }),
      this.prisma.admin_user.count({ where }),
    ]);
    return {
      code: 0,
      message: "success",
      data: {
        records: records.map((r) => ({
          adminId: r.admin_id,
          username: r.username,
          email: r.email,
          mobile: r.mobile,
          roleId: r.role_id,
          shopId: r.shop_id,
          suppliersId: r.suppliers_id,
          addTime: r.add_time,
          isUsing: r.is_using,
        })),
        total,
        size,
        current: page,
        pages: Math.ceil(total / size),
      },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "管理员详情（兼容精简版）" })
  @Authorities("adminUserDetail")
  async detail(@Query() query: any, @Request() req: any) {
    // 支持三种方式：?adminId=、?id=、缺省则返回当前登录管理员
    const idFromQuery = Number(query.adminId || query.id);
    const currentUserId = Number(req?.user?.userId || 0);
    const id = idFromQuery || currentUserId;

    if (!id) return { code: 0, message: "success", data: null };

    const r = await this.prisma.admin_user.findUnique({ where: { admin_id: id } });
    if (!r) return { code: 0, message: "success", data: null };

    return {
      code: 0,
      message: "success",
      data: {
        adminId: r.admin_id,
        username: r.username,
        email: r.email,
        mobile: r.mobile,
        roleId: r.role_id,
        shopId: r.shop_id,
        suppliersId: r.suppliers_id,
        addTime: r.add_time,
        isUsing: r.is_using,
      },
    };
  }

  @Get("config")
  @ApiOperation({ summary: "管理员配置（占位兼容）" })
  @Authorities("adminUserConfig")
  async config() {
    return { code: 0, message: "success", data: {} };
  }

  /** 创建管理员 */
  @Post("create")
  @ApiOperation({ summary: "创建管理员（兼容精简版）" })
  @Authorities("adminUserCreate")
  async create(@Body() dto: any) {
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      username: dto.username?.trim(),
      email: dto.email?.trim() || null,
      mobile: dto.mobile?.trim() || null,
      role_id: dto.roleId ? Number(dto.roleId) : 0,
      shop_id: dto.shopId ? Number(dto.shopId) : 0,
      suppliers_id: dto.suppliersId ? Number(dto.suppliersId) : 0,
      is_using: dto.isUsing != null ? Number(dto.isUsing) : 1,
      add_time: now,
      password: dto.password || dto.initialPassword || "", // TODO: 后续接入加密
      initial_password: dto.initialPassword || null,
      auth_list: Array.isArray(dto.authList) ? JSON.stringify(dto.authList) : dto.authList || null,
    };
    const created = await this.prisma.admin_user.create({ data });
    return { code: 0, message: "success", data: { adminId: created.admin_id } };
  }

  /** 更新管理员 */
  @Post("update")
  @ApiOperation({ summary: "更新管理员（兼容精简版）" })
  @Authorities("adminUserUpdate")
  async update(@Body() dto: any) {
    const id = Number(dto.adminId || dto.id);
    if (!id) return { code: 400, message: "adminId required", data: null };
    const data: any = {};
    [
      ["username", "username"],
      ["email", "email"],
      ["mobile", "mobile"],
      ["roleId", "role_id"],
      ["shopId", "shop_id"],
      ["suppliersId", "suppliers_id"],
      ["isUsing", "is_using"],
    ].forEach(([src, dest]) => {
      if (dto[src] !== undefined) data[dest] = dto[src];
    });
    if (dto.authList) {
      data.auth_list = Array.isArray(dto.authList)
        ? JSON.stringify(dto.authList)
        : dto.authList;
    }
    if (dto.password) data.password = dto.password; // TODO hash
    await this.prisma.admin_user.update({ where: { admin_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  /** 删除管理员 */
  @Post("del")
  @ApiOperation({ summary: "删除管理员（兼容精简版）" })
  @Authorities("adminUserDel")
  async del(@Body() dto: any) {
    const id = Number(dto.id || dto.adminId);
    if (!id) return { code: 400, message: "id required", data: null };
    await this.prisma.admin_user.delete({ where: { admin_id: id } });
    return { code: 0, message: "success", data: true };
  }

  /** 批量操作 */
  @Post("batch")
  @ApiOperation({ summary: "批量操作管理员（兼容简化，仅支持删除/启禁用）" })
  @Authorities("adminUserBatch")
  async batch(@Body() dto: any) {
    const type = dto.type;
    const ids: number[] = (dto.ids || dto.id || [])
      .toString()
      .split(",")
      .filter(Boolean)
      .map((x: string) => Number(x));
    if (!ids.length) return { code: 400, message: "ids required", data: null };
    if (type === "del") {
      await this.prisma.admin_user.deleteMany({ where: { admin_id: { in: ids } } });
    } else if (type === "enable" || type === "disable") {
      await this.prisma.admin_user.updateMany({
        where: { admin_id: { in: ids } },
        data: { is_using: type === "enable" ? 1 : 0 },
      });
    }
    return { code: 0, message: "success", data: true };
  }

  /** 单字段更新 */
  @Post("updateField")
  @ApiOperation({ summary: "更新单字段（兼容）" })
  @Authorities("adminUserUpdateField")
  async updateField(@Body() dto: any) {
    const id = Number(dto.id || dto.adminId);
    if (!id) return { code: 400, message: "id required", data: null };
    const field = dto.field;
    const value = dto.value;
    const map: Record<string, string> = {
      username: "username",
      email: "email",
      mobile: "mobile",
      roleId: "role_id",
      isUsing: "is_using",
    };
    if (!map[field]) return { code: 400, message: "unsupported field", data: null };
    await this.prisma.admin_user.update({
      where: { admin_id: id },
      data: { [map[field]]: value },
    });
    return { code: 0, message: "success", data: true };
  }

  /** 修改主账号/管理账号信息 */
  @Post("modifyManageAccounts")
  @ApiOperation({ summary: "修改管理账号（兼容精简版）" })
  @Authorities("modifyManageAccounts")
  async modifyManageAccounts(@Body() dto: any) {
    const id = Number(dto.adminId || dto.id);
    if (!id) return { code: 400, message: "adminId required", data: null };
    const data: any = {};
    [
      ["username", "username"],
      ["mobile", "mobile"],
      ["email", "email"],
    ].forEach(([src, dest]) => {
      if (dto[src] !== undefined) data[dest] = dto[src];
    });
    if (dto.password) data.password = dto.password; // TODO hash
    await this.prisma.admin_user.update({ where: { admin_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  /** 发送验证码（占位实现） */
  @Get("getCode")
  @ApiOperation({ summary: "获取验证码（占位，固定返回）" })
  @Authorities("adminUserGetCode")
  async getCode(@Query("mobile") mobile?: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = mobile || "global";
    AdminUserCompatController.codeCache.set(key, {
      code,
      expiredAt: Date.now() + 5 * 60 * 1000,
    });
    return { code: 0, message: "success", data: { code } };
  }

  /** 校验验证码（占位实现） */
  @Get("checkCode")
  @ApiOperation({ summary: "校验验证码（占位）" })
  @Authorities("adminUserCheckCode")
  async checkCode(@Query("mobile") mobile: string, @Query("code") c: string) {
    const key = mobile || "global";
    const item = AdminUserCompatController.codeCache.get(key);
    const ok = !!item && item.code === c && item.expiredAt > Date.now();
    return { code: 0, message: ok ? "success" : "invalid", data: ok };
  }
}
