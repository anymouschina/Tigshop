// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 供应商提现管理 兼容")
@Controller("adminapi/vendor/vendorWithdraw")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminVendorWithdrawCompatController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /adminapi/vendor/vendorWithdraw/list
  @Get("list")
  @Authorities("vendorWithdrawApplyManage")
  @ApiOperation({ summary: "供应商提现列表（admin 兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const size = Math.max(1, Math.min(200, Number(query.size || 15)));
    const skip = (page - 1) * size;

    const where: any = {};
    const status = query.status;
    const vendorId = query.vendor_id ?? query.vendorId;
    const addTimeStart = query.add_time_start ?? query.addTimeStart;
    const addTimeEnd = query.add_time_end ?? query.addTimeEnd;
    const keyword = query.keyword;

    if (status !== undefined && status !== "") where.status = Number(status);
    if (vendorId) where.vendor_id = Number(vendorId);
    if (addTimeStart || addTimeEnd) {
      where.add_time = {};
      if (addTimeStart) where.add_time.gte = Number(addTimeStart);
      if (addTimeEnd) where.add_time.lte = Number(addTimeEnd);
    }
    if (keyword) {
      where.OR = [
        { withdraw_sn: { contains: String(keyword) } },
        { remark: { contains: String(keyword) } },
      ];
    }

    const sortFieldInput = query.sort_field ?? query.sortField ?? "add_time";
    const sortOrder: "asc" | "desc" =
      (query.sort_order ?? query.sortOrder ?? "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";
    const sortFieldMap: Record<string, string> = {
      add_time: "add_time",
      addTime: "add_time",
      amount: "amount",
      status: "status",
    };
    const orderByField = sortFieldMap[sortFieldInput] || "add_time";

    const [total, list] = await this.prisma.$transaction([
      this.prisma.vendor_withdraw.count({ where }),
      this.prisma.vendor_withdraw.findMany({
        where,
        skip,
        take: size,
        orderBy: { [orderByField]: sortOrder },
      }),
    ]);

    return { code: 0, message: "success", data: { records: list, total } };
  }

  // GET /adminapi/vendor/vendorWithdraw/config
  @Get("config")
  @Authorities("vendorWithdrawApplyManage")
  @ApiOperation({ summary: "供应商提现配置（admin 兼容）" })
  async config() {
    const statusList: Record<number, string> = {
      0: "待审核",
      2: "已拒绝",
      3: "已完成",
      4: "审核通过",
    };
    return { code: 0, message: "success", data: { statusList } };
  }
}
