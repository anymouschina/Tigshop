// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 商户资金日志 兼容")
@Controller("adminapi/merchant/shopAccount")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminShopAccountCompatController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /adminapi/merchant/shopAccount/logList
  @Get("logList")
  @Authorities("shopAccountManage")
  @ApiOperation({ summary: "资金日志列表（admin 兼容）" })
  async logList(@Query() query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const size = Math.max(1, Math.min(200, Number(query.size || 15)));
    const skip = (page - 1) * size;

    // Filters
    const shopId = query.shop_id ?? query.shopId;
    const type = query.type;
    const addTimeStart = query.add_time_start ?? query.addTimeStart;
    const addTimeEnd = query.add_time_end ?? query.addTimeEnd;

    const where: any = {};
    if (shopId) where.shop_id = Number(shopId);
    if (type) where.type = String(type);
    if (addTimeStart || addTimeEnd) {
      where.add_time = {};
      if (addTimeStart) where.add_time.gte = Number(addTimeStart);
      if (addTimeEnd) where.add_time.lte = Number(addTimeEnd);
    }

    // Sorting
    const sortFieldInput = query.sort_field ?? query.sortField ?? "add_time";
    const sortOrder: "asc" | "desc" =
      (query.sort_order ?? query.sortOrder ?? "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";
    const sortFieldMap: Record<string, string> = {
      add_time: "add_time",
      addTime: "add_time",
      shop_money: "shop_money",
      shopMoney: "shop_money",
      frozen_money: "frozen_money",
      frozenMoney: "frozen_money",
      type: "type",
    };
    const orderByField = sortFieldMap[sortFieldInput] || "add_time";

    const [total, records] = await this.prisma.$transaction([
      this.prisma.shop_account_log.count({ where }),
      this.prisma.shop_account_log.findMany({
        where,
        skip,
        take: size,
        orderBy: { [orderByField]: sortOrder },
      }),
    ]);

    return { code: 0, message: "success", data: { records, total } };
  }
}
