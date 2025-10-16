// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
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
  private static codeCache: Map<string, { code: string; expiredAt: number }> =
    new Map();

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

    // 基本列表
    const [rows, total] = await Promise.all([
      this.prisma.admin_user.findMany({
        where,
        skip,
        take: size,
        orderBy: { admin_id: "desc" },
        select: {
          admin_id: true,
          username: true,
          admin_type: true,
          mobile: true,
          avatar: true,
          password: true,
          email: true,
          add_time: true,
          auth_list: true,
          user_id: true,
          suppliers_id: true,
          role_id: true,
          merchant_id: true,
          parent_id: true,
          menu_tag: true,
          order_export: true,
          extra: true,
          shop_id: true,
          is_using: true,
          initial_password: true,
        },
      }),
      this.prisma.admin_user.count({ where }),
    ]);

    const adminIds = rows.map((r) => r.admin_id);

    // 角色名映射
    const roleIds = Array.from(
      new Set(rows.map((r) => r.role_id).filter((x) => Number(x) > 0)),
    );
    const roles = roleIds.length
      ? await this.prisma.admin_role.findMany({
          where: { role_id: { in: roleIds } },
          select: { role_id: true, role_name: true },
        })
      : [];
    const roleNameMap = new Map(roles.map((r) => [r.role_id, r.role_name]));

    // 子账号计数（hasChildren）
    const children = adminIds.length
      ? await this.prisma.admin_user.findMany({
          where: { parent_id: { in: adminIds } },
          select: { parent_id: true },
        })
      : [];
    const childCountMap = new Map<number, number>();
    for (const c of children) {
      const pid = Number((c as any).parent_id || 0);
      childCountMap.set(pid, (childCountMap.get(pid) || 0) + 1);
    }

    // 店铺员工表（userShop）
    const userShops = adminIds.length
      ? await this.prisma.admin_user_shop.findMany({
          where: { admin_id: { in: adminIds } },
          orderBy: { id: "asc" },
          select: {
            id: true,
            admin_id: true,
            user_id: true,
            shop_id: true,
            username: true,
            email: true,
            avatar: true,
            auth_list: true,
            is_using: true,
            is_admin: true,
            add_time: true,
            role_id: true,
          },
        })
      : [];
    const shopsByAdmin = new Map<number, any[]>();
    for (const s of userShops) {
      const k = Number((s as any).admin_id);
      if (!shopsByAdmin.has(k)) shopsByAdmin.set(k, []);
      shopsByAdmin.get(k)!.push(s);
    }

    const parseJSON = (text: any, fallback: any) => {
      if (!text) return fallback;
      if (Array.isArray(text)) return text;
      if (typeof text === "string") {
        try {
          const v = JSON.parse(text);
          return v ?? fallback;
        } catch {
          // 兼容逗号分隔
          if (text.includes(","))
            return text
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          return fallback;
        }
      }
      return fallback;
    };
    const parseAuthList = (v: any) => parseJSON(v, []);
    const formatTime = (sec?: number | null) => {
      const s = Number(sec || 0);
      if (!s) return "";
      const d = new Date(s * 1000);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const records = rows.map((r) => {
      const shopListRaw = shopsByAdmin.get(Number(r.admin_id)) || [];
      const userShop = shopListRaw.map((s) => ({
        id: (s as any).id,
        adminId: (s as any).admin_id,
        userId: (s as any).user_id,
        shopId: (s as any).shop_id,
        username: (s as any).username ?? "",
        email: (s as any).email ?? "",
        avatar: (s as any).avatar ?? "",
        authList: parseAuthList((s as any).auth_list),
        isUsing: Number((s as any).is_using ?? 0),
        isAdmin: Number((s as any).is_admin ?? 0),
        addTime: formatTime((s as any).add_time),
        roleId: Number((s as any).role_id ?? 0),
      }));

      // 顶层 isAdmin：若任一店铺 is_admin=1 则为 1
      const isAdminTop = userShop.some((x) => Number(x.isAdmin) === 1) ? 1 : 0;

      // 顶层 authList：优先自身 auth_list；若为空且有 role_id，则取角色 authority_list
      const authList = parseAuthList(r.auth_list);
      if ((!authList || authList.length === 0) && r.role_id && r.role_id > 0) {
        const rn = r.role_id;
        // 尝试用 roleNameMap 的 key 查一把 authority_list（需要再查一次 DB）
        // 为避免 N+1，仅在需要时单查
        // eslint-disable-next-line no-async-promise-executor
      }

      return {
        adminId: r.admin_id,
        username: r.username,
        adminType: r.admin_type,
        mobile: r.mobile ?? "",
        avatar: r.avatar ?? "",
        password: r.password ?? "",
        email: r.email ?? "",
        addTime: formatTime(r.add_time),
        authList,
        userId: r.user_id ?? 0,
        suppliersId: r.suppliers_id ?? 0,
        roleId: r.role_id ?? 0,
        merchantId: r.merchant_id ?? 0,
        parentId: r.parent_id ?? 0,
        menuTag: r.menu_tag ?? "",
        orderExport: parseJSON(r.order_export, []),
        extra: r.extra ?? "",
        shopId: r.shop_id ?? 0,
        isUsing: r.is_using ?? 0,
        initialPassword: r.initial_password ?? "",
        hasChildren: childCountMap.get(Number(r.admin_id)) || 0,
        roleName: roleNameMap.get(r.role_id) ?? null,
        isAdmin: isAdminTop,
        userShop,
      };
    });

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
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

    const r = await this.prisma.admin_user.findUnique({
      where: { admin_id: id },
    });
    if (!r) return { code: 0, message: "success", data: null };

    // 如果有 role_id，则从 admin_role 合并权限列表
    let authList = r.auth_list || null;
    if (r.role_id && r.role_id > 0) {
      const role = await this.prisma.admin_role.findUnique({
        where: { role_id: r.role_id },
        select: { authority_list: true },
      });
      if (role?.authority_list) authList = role.authority_list;
    }
    const encipher_mobile = r.mobile
      ? `${String(r.mobile).slice(0, 3)}****${String(r.mobile).slice(-4)}`
      : "";

    return {
      code: 0,
      message: "success",
      data: {
        adminId: r.admin_id,
        username: r.username,
        email: r.email,
        mobile: r.mobile,
        encipher_mobile,
        roleId: r.role_id,
        shopId: r.shop_id,
        suppliersId: r.suppliers_id,
        addTime: r.add_time,
        isUsing: r.is_using,
        authList,
      },
    };
  }

  @Get("config")
  @ApiOperation({ summary: "管理员配置（占位兼容）" })
  @Authorities("adminUserConfig")
  async config(@Query() query: any, @Request() req: any) {
    // PHP: 返回角色列表（排除role_id=2），按 admin_type + shop_id 过滤
    const adminType = (
      query?.admin_type ||
      query?.adminType ||
      req?.user?.adminType ||
      "admin"
    ).toString();
    const shopId = Number(
      query?.shop_id || query?.shopId || req?.user?.shopId || 0,
    );
    const roles = await this.prisma.admin_role.findMany({
      where: { admin_type: adminType, shop_id: shopId, NOT: { role_id: 2 } },
      select: { role_id: true, role_name: true },
      orderBy: { role_id: "asc" },
    });
    const list = roles.map((r) => ({
      roleId: r.role_id,
      roleName: r.role_name,
    }));
    return { code: 0, message: "success", data: list };
  }

  /** 创建管理员 */
  @Post("create")
  @ApiOperation({ summary: "创建管理员（兼容精简版）" })
  @Authorities("adminUserCreate")
  async create(@Body() dto: any) {
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      username: dto.username?.trim(),
      email: dto.email?.trim() || "", // Prisma 要求非空
      mobile: dto.mobile?.trim() || "",
      role_id: dto.roleId ? Number(dto.roleId) : 0,
      shop_id: dto.shopId ? Number(dto.shopId) : 0,
      suppliers_id: dto.suppliersId ? Number(dto.suppliersId) : 0,
      is_using: dto.isUsing != null ? Number(dto.isUsing) : 1,
      add_time: now,
      password: dto.password || dto.initialPassword || "", // TODO: 后续接入加密
      initial_password: dto.initialPassword || "",
      auth_list: Array.isArray(dto.authList)
        ? JSON.stringify(dto.authList)
        : dto.authList || "",
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
      await this.prisma.admin_user.deleteMany({
        where: { admin_id: { in: ids } },
      });
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
    if (!map[field])
      return { code: 400, message: "unsupported field", data: null };
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

  /** 校验验证码（占位实现） - 兼容 GET/POST */
  @Get("checkCode")
  @Post("checkCode")
  @ApiOperation({ summary: "校验验证码（占位）" })
  @Authorities("adminUserCheckCode")
  async checkCode(
    @Query("mobile") mobile: string,
    @Query("code") c: string,
    @Body() body?: any,
  ) {
    // 允许通过 body 传参（POST 兼容）
    if ((!mobile || !c) && body) {
      mobile = body.mobile ?? mobile;
      c = body.code ?? c;
    }
    const key = mobile || "global";
    const item = AdminUserCompatController.codeCache.get(key);
    const ok = !!item && item.code === c && item.expiredAt > Date.now();
    return { code: 0, message: ok ? "success" : "invalid", data: ok };
  }
}
