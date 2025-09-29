// @ts-nocheck
import { Controller, Post, Req, UseGuards } from "@nestjs/common";
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
