// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销员(兼容)")
@Controller("adminapi/salesman/salesman")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanCompatController {
  constructor(
    private prisma: PrismaService,
    private panel: PanelService,
  ) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "分销员列表（兼容）" })
  @Authorities("salesmanManage")
  async list(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const groupId = this.coerceNumber(query.groupId, 0);
    const level = this.coerceNumber(query.level, 0);
    const keyword = String(query.keyword || "").trim();
    const where: any = { shop_id: shopId };
    if (groupId) where.group_id = groupId;
    if (level) where.level = level;

    // 关键词搜索：匹配用户名/昵称/手机号
    if (keyword) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword } },
            { nickname: { contains: keyword } },
            { mobile: { contains: keyword } },
          ],
        },
        select: { user_id: true },
      });
      const uids = users.map((u) => u.user_id);
      if (!uids.length) {
        return { code: 0, message: "success", data: { records: [], total: 0 } };
      }
      where.user_id = { in: uids };
    }

    // 基本分页查询
    const [rows, total] = await Promise.all([
      this.prisma.salesman.findMany({
        where,
        orderBy: { salesman_id: "desc" },
        skip,
        take: size,
      }),
      this.prisma.salesman.count({ where }),
    ]);

    // 批量加载关联与聚合数据，避免 N+1
    const salesmanIds = rows.map((r) => r.salesman_id).filter(Boolean);
    const userIds = rows.map((r) => r.user_id).filter(Boolean);
    const pids = Array.from(
      new Set(
        rows.map((r) => r.pid).filter((x) => this.coerceNumber(x, 0) > 0),
      ),
    );
    const groupIds = Array.from(
      new Set(
        rows.map((r) => r.group_id).filter((x) => this.coerceNumber(x, 0) > 0),
      ),
    );

    const [
      users,
      pidUsers,
      groups,
      customerCounts,
      inviteCounts,
      commissionAgg,
    ] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { user_id: { in: userIds } },
            select: {
              user_id: true,
              mobile: true,
              username: true,
              nickname: true,
              avatar: true,
              distribution_register_time: true,
            },
          })
        : Promise.resolve([]),
      pids.length
        ? this.prisma.user.findMany({
            where: { user_id: { in: pids } },
            select: {
              user_id: true,
              mobile: true,
              username: true,
              nickname: true,
              avatar: true,
              distribution_register_time: true,
            },
          })
        : Promise.resolve([]),
      groupIds.length
        ? this.prisma.salesman_group.findMany({
            where: { group_id: { in: groupIds } },
            select: { group_id: true, group_name: true },
          })
        : Promise.resolve([]),
      salesmanIds.length
        ? this.prisma.salesman_customer.groupBy({
            by: ["salesman_id"],
            _count: { salesman_customer_id: true },
            where: { salesman_id: { in: salesmanIds } },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.salesman.groupBy({
            by: ["pid"],
            _count: { salesman_id: true },
            where: { pid: { in: userIds }, shop_id: shopId },
          })
        : Promise.resolve([]),
      salesmanIds.length
        ? this.prisma.salesman_order.groupBy({
            by: ["salesman_id"],
            _sum: { amount: true },
            where: { salesman_id: { in: salesmanIds } },
          })
        : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map((u) => [u.user_id, u]));
    const pidUserMap = new Map(pidUsers.map((u) => [u.user_id, u]));
    const groupMap = new Map(groups.map((g) => [g.group_id, g]));
    const customerCountMap = new Map(
      customerCounts.map((c: any) => [
        c.salesman_id,
        c._count?.salesman_customer_id || 0,
      ]),
    );
    const inviteCountMap = new Map(
      inviteCounts.map((c: any) => [c.pid, c._count?.salesman_id || 0]),
    );

    const levelText = (lv: number) => {
      const n = this.coerceNumber(lv, 1);
      switch (n) {
        case 4:
          return "钻石分销员";
        case 3:
          return "黄金分销员";
        case 2:
          return "白银分销员";
        default:
          return "普通分销员";
      }
    };

    const toAmountStr = (v: any) => {
      if (v == null) return "0.00";
      try {
        const s = typeof v === "string" ? v : v.toString();
        const n = Number(s);
        return Number.isFinite(n) ? n.toFixed(2) : s;
      } catch {
        return "0.00";
      }
    };

    const commissionMap = new Map(
      commissionAgg.map((c: any) => [c.salesman_id, c._sum?.amount || 0]),
    );

    const records = rows.map((r) => {
      const base = userMap.get(r.user_id!);
      const grp = r.group_id ? groupMap.get(r.group_id) : null;
      const totalCustomer = customerCountMap.get(r.salesman_id) || 0;
      const totalInvite = inviteCountMap.get(r.user_id!) || 0;
      const pidUser = r.pid ? pidUserMap.get(r.pid) : null;
      const totalCommission = commissionMap.get(r.salesman_id) || 0;
      return {
        totalCommission,
        totalCustomer,
        totalInvite,
        salesmanId: r.salesman_id,
        userId: r.user_id,
        level: r.level ?? 1,
        groupId: r.group_id ?? 0,
        pid: r.pid ?? 0,
        add_time: r.add_time, // 让全局拦截器先处理 *_time，再由 camelCase 转为 addTime
        shopId: r.shop_id ?? 0,
        saleAmount: toAmountStr(r.sale_amount),
        levelText: levelText(r.level ?? 1),
        baseUserInfo: base
          ? {
              mobile: base.mobile || "",
              username: base.username || "",
              nickname: base.nickname || "",
              avatar: base.avatar || "",
              user_id: base.user_id,
              distribution_register_time: base.distribution_register_time ?? 0,
            }
          : null,
        groupInfo: grp
          ? { groupId: grp.group_id, groupName: grp.group_name || "" }
          : null,
        pidUserInfo: pidUser
          ? {
              mobile: pidUser.mobile || "",
              username: pidUser.username || "",
              nickname: pidUser.nickname || "",
              avatar: pidUser.avatar || "",
              user_id: pidUser.user_id,
              distribution_register_time:
                pidUser.distribution_register_time ?? 0,
            }
          : null,
        customer: [],
      };
    });

    // 按 PHP 预期结构：只返回 { records, total }
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "分销员详情（兼容）" })
  @Authorities("salesmanManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman.findUnique({
      where: { salesman_id: this.coerceNumber(id, 0) },
    });
    return { code: 0, message: "success", data: record };
  }

  @Post("create")
  @ApiOperation({ summary: "分销员创建（兼容）" })
  @Authorities("salesmanManage")
  async create(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const userId = this.coerceNumber(body.userId || body.user_id, 0);
    if (!userId) return { code: 400, message: "userId required", data: null };

    // 可选：校验用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true },
    });
    if (!user) return { code: 404, message: "user not found", data: null };

    // 幂等：同店铺下同用户若已是分销员，则直接返回成功
    const existed = await this.prisma.salesman.findFirst({
      where: { shop_id: shopId, user_id: userId },
    });
    if (existed) return { code: 0, message: "success", data: true };

    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      shop_id: shopId,
      user_id: userId,
      level: body.level !== undefined ? this.coerceNumber(body.level, 1) : 1,
      group_id:
        body.groupId !== undefined ? this.coerceNumber(body.groupId, 0) : 0,
      pid: body.pid !== undefined ? this.coerceNumber(body.pid, 0) : 0,
      add_time: now,
      sale_amount: 0,
    };
    await this.prisma.salesman.create({ data });
    return { code: 0, message: "success", data: true };
  }

  @Post("update")
  @ApiOperation({ summary: "分销员更新（兼容）" })
  @Authorities("salesmanManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.salesmanId || body.id, 0);
    const data: any = {
      level:
        body.level !== undefined ? this.coerceNumber(body.level, 1) : undefined,
      group_id:
        body.groupId !== undefined
          ? this.coerceNumber(body.groupId, 0)
          : undefined,
      pid: body.pid !== undefined ? this.coerceNumber(body.pid, 0) : undefined,
    };
    await this.prisma.salesman.update({ where: { salesman_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "分销员单字段更新（兼容）" })
  @Authorities("salesmanManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = String(body.field || "");
    const val = body.value ?? body.val;
    const map: Record<string, string> = {
      level: "level",
      groupId: "group_id",
      pid: "pid",
    };
    const dbField = map[field] || field;
    await this.prisma.salesman.update({
      where: { salesman_id: id },
      data: { [dbField]: this.coerceNumber(val, 0) },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "分销员删除（兼容）" })
  @Authorities("salesmanManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman.delete({
      where: { salesman_id: this.coerceNumber(id, 0) },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "分销员批量（兼容）" })
  @Authorities("salesmanManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || [])
      .map((x) => this.coerceNumber(x, 0))
      .filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (["del", "delete"].includes(type)) {
      await this.prisma.salesman.deleteMany({
        where: { salesman_id: { in: ids } },
      });
      return { code: 0, message: "批量删除成功", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("ranking")
  @ApiOperation({ summary: "分销员排行榜（兼容）" })
  @Authorities("salesmanManage")
  async ranking(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    // 排名结果期望：username/nickname/totalSaleAmount/totalCustomers/totalPayCustomers/orderNum
    // 规则（参考 PHP 语义近似实现）：
    // - totalSaleAmount: salesman_order.order_amount 之和
    // - orderNum: salesman_order 条数
    // - totalCustomers: salesman_customer 条数
    // - totalPayCustomers: 近似使用 orderNum（如需严格“付款客户数”，需关联订单表统计去重客户数）
    const [rows, total] = await Promise.all([
      this.prisma.salesman.findMany({
        where: { shop_id: shopId },
        orderBy: { salesman_id: "desc" },
      }),
      this.prisma.salesman.count({ where: { shop_id: shopId } }),
    ]);
    const salesmanIds = rows.map((r) => r.salesman_id).filter(Boolean);
    const userIds = rows.map((r) => r.user_id).filter(Boolean);

    const [users, customerAgg, orderAgg] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { user_id: { in: userIds } },
            select: { user_id: true, username: true, nickname: true },
          })
        : Promise.resolve([]),
      salesmanIds.length
        ? this.prisma.salesman_customer.groupBy({
            by: ["salesman_id"],
            _count: { salesman_customer_id: true },
            where: { salesman_id: { in: salesmanIds } },
          })
        : Promise.resolve([]),
      salesmanIds.length
        ? this.prisma.salesman_order.groupBy({
            by: ["salesman_id"],
            _count: { salesman_order_id: true },
            _sum: { order_amount: true },
            where: { salesman_id: { in: salesmanIds } },
          })
        : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map((u) => [u.user_id, u]));
    const customerMap = new Map(
      customerAgg.map((c: any) => [
        c.salesman_id,
        c._count?.salesman_customer_id || 0,
      ]),
    );
    const orderCountMap = new Map(
      orderAgg.map((o: any) => [
        o.salesman_id,
        o._count?.salesman_order_id || 0,
      ]),
    );
    const orderAmountMap = new Map(
      orderAgg.map((o: any) => [o.salesman_id, o._sum?.order_amount || 0]),
    );

    const toAmountStr = (v: any) => {
      if (v == null) return "0.00";
      try {
        const n = typeof v === "number" ? v : Number(v as any);
        return Number.isFinite(n) ? n.toFixed(2) : String(v);
      } catch {
        return "0.00";
      }
    };

    const records = rows.map((r) => {
      const u = userMap.get(r.user_id!);
      const orderNum = orderCountMap.get(r.salesman_id) || 0;
      const totalSaleAmount = orderAmountMap.get(r.salesman_id) || 0;
      const totalCustomers = customerMap.get(r.salesman_id) || 0;
      return {
        username: u?.username || "",
        nickname: u?.nickname || "",
        totalSaleAmount: Number.isFinite(Number(totalSaleAmount))
          ? Number(totalSaleAmount)
          : 0,
        totalCustomers,
        totalPayCustomers: orderNum,
        orderNum,
      };
    });
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("statisticalDetails")
  @ApiOperation({ summary: "分销员统计明细（兼容）" })
  @Authorities("salesmanManage")
  async statisticalDetails(@Query() query: any) {
    // 占位返回空数据结构
    return { code: 0, message: "success", data: { records: [], total: 0 } };
  }

  @Get("commissionDetails")
  @ApiOperation({ summary: "分销员佣金明细（兼容）" })
  @Authorities("salesmanManage")
  async commissionDetails(@Query() query: any) {
    // 占位返回空数据结构
    return { code: 0, message: "success", data: { records: [], total: 0 } };
  }

  @Get("salesmanList")
  @ApiOperation({ summary: "全部分销员下拉（兼容）" })
  @Authorities("salesmanManage")
  async salesmanList(@Req() req: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const rows = await this.prisma.salesman.findMany({
      where: { shop_id: shopId },
      select: { salesman_id: true, user_id: true },
    });
    return { code: 0, message: "success", data: rows };
  }

  @Get("customerList")
  @ApiOperation({ summary: "全部客户下拉（兼容）" })
  @Authorities("salesmanManage")
  async customerList() {
    const rows = await this.prisma.salesman_customer.findMany({
      select: { salesman_customer_id: true, user_id: true },
    });
    return { code: 0, message: "success", data: rows };
  }
}
