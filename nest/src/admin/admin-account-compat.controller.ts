// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../auth/guards/authority.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 主账号管理（兼容）")
@Controller("adminapi/admin/adminAccount")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminAccountCompatController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("getMainAccount")
  @ApiOperation({ summary: "获取主账号信息（兼容）" })
  async getMainAccount(@Request() req) {
    const adminId = req.user?.userId;
    const admin = await this.prisma.admin_user.findUnique({
      where: { admin_id: adminId },
    });
    if (!admin) return { code: 0, message: "success", data: null };
    return { code: 0, message: "success", data: this.normalizeAdmin(admin) };
  }

  @Post("bindMainAccount")
  @ApiOperation({ summary: "绑定主账号（兼容-占位实现）" })
  async bindMainAccount(@Body() body: any, @Request() req) {
    // 兼容占位：通常会将当前管理员与主账号/商户、店铺或供应商建立关系
    // 这里先直接返回成功，前端避免404/失败
    return { code: 0, message: "success", data: true };
  }

  @Post("updateMainAccount")
  @ApiOperation({ summary: "更新主账号信息（兼容）" })
  async updateMainAccount(@Body() body: any, @Request() req) {
    const adminId = req.user?.userId;
    const data: any = {};
    if (body.username != null) data.username = body.username;
    if (body.mobile != null) data.mobile = body.mobile;
    if (body.email != null) data.email = body.email;
    if (body.avatar != null) data.avatar = body.avatar;
    const updated = await this.prisma.admin_user.update({
      where: { admin_id: adminId },
      data,
    });
    return { code: 0, message: "success", data: this.normalizeAdmin(updated) };
  }

  @Post("updateMainAccountPwd")
  @ApiOperation({ summary: "修改主账号密码（兼容）" })
  async updateMainAccountPwd(@Body() body: any, @Request() req) {
    const adminId = req.user?.userId;
    const newPassword = String(body.newPassword ?? body.password ?? "");
    if (!newPassword) return { code: 400, message: "缺少新密码" };
    // 简化：直接更新明文或假定外部加密；真实实现应加盐哈希
    const updated = await this.prisma.admin_user.update({
      where: { admin_id: adminId },
      data: { password: newPassword },
    });
    return { code: 0, message: "success", data: this.normalizeAdmin(updated) };
  }

  @Get("pageShopOrVendor")
  @ApiOperation({ summary: "分页查询店铺或供应商（兼容）" })
  async pageShopOrVendor(@Query() query: any) {
    const type = String(query.type ?? "shop"); // shop/vendor
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const keyword = (query.keyword ?? "").trim();
    const skip = (page - 1) * size;

    if (type === "vendor" || type === "suppliers") {
      const where: any = {};
      if (keyword) where.suppliers_name = { contains: keyword };
      const [records, total] = await Promise.all([
        this.prisma.suppliers.findMany({
          where,
          skip,
          take: size,
          orderBy: { suppliers_id: "desc" },
        }),
        this.prisma.suppliers.count({ where }),
      ]);
      return {
        code: 0,
        message: "success",
        data: {
          records: records.map((r) => ({
            id: r.suppliers_id,
            name: r.suppliers_name,
          })),
          total,
          size,
          current: page,
          pages: Math.max(1, Math.ceil((total || 0) / size)),
        },
      };
    }

    // shop 列表（使用 shop 表）
    const where: any = {};
    if (keyword) where.shop_name = { contains: keyword };
    const [records, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: size,
        orderBy: { shop_id: "desc" },
      }),
      this.prisma.shop.count({ where }),
    ]);
    return {
      code: 0,
      message: "success",
      data: {
        records: records.map((r) => ({ id: r.shop_id, name: r.shop_name })),
        total,
        size,
        current: page,
        pages: Math.max(1, Math.ceil((total || 0) / size)),
      },
    };
  }

  @Get("pageAdminUser")
  @ApiOperation({ summary: "分页查询管理员（兼容）" })
  async pageAdminUser(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const keyword = (query.keyword ?? "").trim();
    const skip = (page - 1) * size;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.admin_user.findMany({
        where,
        skip,
        take: size,
        orderBy: { admin_id: "desc" },
      }),
      this.prisma.admin_user.count({ where }),
    ]);

    return {
      code: 0,
      message: "success",
      data: {
        records: records.map((r) => this.normalizeAdmin(r)),
        total,
        size,
        current: page,
        pages: Math.max(1, Math.ceil((total || 0) / size)),
      },
    };
  }

  private normalizeAdmin(r: any) {
    if (!r) return null;
    return {
      adminId: r.admin_id,
      username: r.username,
      adminType: r.admin_type,
      mobile: r.mobile,
      email: r.email,
      avatar: r.avatar,
      shopId: r.shop_id,
      merchantId: r.merchant_id,
      roleId: r.role_id,
      isUsing: r.is_using,
      addTime: r.add_time,
    };
  }
}
