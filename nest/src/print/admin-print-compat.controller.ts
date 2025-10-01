// @ts-nocheck
import { Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 打印机(兼容路径)")
@Controller("adminapi/print/print")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminPrintCompatController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "打印机列表（admin 兼容）" })
  async list(@Req() req: any, @Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const keyword = (query.keyword || "").toString().trim();

    // 管理员作用域：按 shopId 过滤
    const userId = req?.user?.userId;
    let shopId = 0;
    if (userId) {
      const adminUser = await this.prisma.admin_user.findUnique({
        where: { admin_id: userId },
        select: { shop_id: true },
      });
      shopId = adminUser?.shop_id || 0;
    }

    const where: any = {
      shop_id: shopId,
      OR: [{ delete_time: 0 }, { delete_time: null }],
    };
    if (keyword) {
      where.OR = [
        { print_name: { contains: keyword } },
        { print_sn: { contains: keyword } },
      ];
      // 保留删除条件
      where.AND = [{ OR: [{ delete_time: 0 }, { delete_time: null }] }];
      where.shop_id = shopId;
    }

    const total = await this.prisma.print.count({ where });
    const recordsRaw = await this.prisma.print.findMany({
      where,
      orderBy: { print_id: "desc" },
      skip: (page - 1) * size,
      take: size,
    });

    const records = recordsRaw.map((r) => ({
      printId: r.print_id,
      printName: r.print_name,
      printSn: r.print_sn,
      printKey: r.print_key,
      thirdAccount: r.third_account,
      thirdKey: r.third_key,
      printNumber: r.print_number ?? 0,
      platform: !!r.platform,
      shopId: r.shop_id ?? 0,
      status: r.status ?? 0,
      addTime: r.add_time ?? 0,
      updateTime: r.update_time ?? 0,
      autoPrint: r.auto_print ?? 2,
    }));

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  @Post("hasEnabled")
  @ApiOperation({ summary: "是否存在启用的打印机（admin 兼容）" })
  async hasEnabled(@Req() req: any) {
    // 获取当前管理员的 shopId（与 PanelService.getUserShopId 行为一致）
    const userId = req?.user?.userId;
    let shopId = 0;
    if (userId) {
      const adminUser = await this.prisma.admin_user.findUnique({
        where: { admin_id: userId },
        select: { shop_id: true },
      });
      shopId = adminUser?.shop_id || 0;
    }

    const count = await this.prisma.print.count({
      where: { status: 1, shop_id: shopId },
    });

    if (count > 0) {
      return { code: 0, message: "success" };
    }
    return { code: 1, message: "error" };
  }
}
