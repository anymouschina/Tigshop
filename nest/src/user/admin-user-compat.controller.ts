// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 会员管理(兼容)")
@Controller("adminapi/user/user")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminMemberCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "会员列表（兼容）" })
  @Authorities("userManage")
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const isPage = query.is_page == 0 ? 0 : 1;

    const keyword = (query.keyword || "").trim();
    const fromTag = query.from_tag !== undefined ? Number(query.from_tag) : undefined;
    const rankId = query.rank_id !== undefined ? Number(query.rank_id) : (query.rankId !== undefined ? Number(query.rankId) : undefined);
    const balanceFlag = query.balance !== undefined ? Number(query.balance) : undefined; // 1=有余额
    const pointsGt = query.points_gt !== undefined ? Number(query.points_gt) : undefined;
    const pointsLt = query.points_lt !== undefined ? Number(query.points_lt) : undefined;

    // 排序白名单
    const sortField = (query.sort_field || "user_id").toString();
    const sortOrder = (query.sort_order || "desc").toString().toLowerCase() === "asc" ? "asc" : "desc";
    const sortWhitelist: Record<string, string> = {
      user_id: "user_id",
      reg_time: "reg_time",
      last_login: "last_login",
      balance: "balance",
      points: "points",
      order_count: "order_count",
      order_amount: "order_amount",
    };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { mobile: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }
    if (fromTag !== undefined && !Number.isNaN(fromTag)) where.from_tag = fromTag;
    if (rankId !== undefined && !Number.isNaN(rankId)) where.rank_id = rankId;
    if (balanceFlag === 1) where.balance = { gt: 0 };
    if (pointsGt !== undefined && !Number.isNaN(pointsGt)) where.points = { ...(where.points || {}), gt: pointsGt };
    if (pointsLt !== undefined && !Number.isNaN(pointsLt)) where.points = { ...(where.points || {}), lt: pointsLt };

    const orderBy: any = sortWhitelist[sortField] ? { [sortWhitelist[sortField]]: sortOrder } : { user_id: "desc" };

    const select = {
      user_id: true,
      username: true,
      nickname: true,
      mobile: true,
      email: true,
      balance: true,
      frozen_balance: true,
      points: true,
      growth_points: true,
      status: true,
      rank_id: true,
      reg_time: true,
      last_login: true,
      order_count: true,
      order_amount: true,
      from_tag: true,
    } as const;

    const skip = (page - 1) * size;
    const [records, total] = await Promise.all([
      this.prisma.user.findMany({ where, orderBy, skip: isPage ? skip : 0, take: isPage ? size : undefined, select }),
      this.prisma.user.count({ where }),
    ]);

    const mapDecimal = (v: any) => (v != null ? Number(v) : 0);
    const dataRecords = records.map((r) => ({
      userId: r.user_id,
      username: r.username,
      nickname: r.nickname,
      mobile: r.mobile,
      email: r.email,
      balance: mapDecimal(r.balance),
      frozenBalance: mapDecimal(r.frozen_balance),
      points: r.points,
      growthPoints: r.growth_points,
      status: r.status,
      rankId: r.rank_id,
      regTime: r.reg_time,
      lastLogin: r.last_login,
      orderCount: r.order_count,
      orderAmount: mapDecimal(r.order_amount),
      fromTag: r.from_tag,
    }));

    return {
      code: 0,
      message: "success",
      data: isPage
        ? { records: dataRecords, total, size, current: page, pages: Math.ceil(total / size) }
        : { records: dataRecords, total },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "会员详情（兼容）" })
  @Authorities("userManage")
  async detail(@Query("id") idStr?: string) {
    const id = Number(idStr);
    if (!id) return { code: 0, message: "success", data: null };
    const r = await this.prisma.user.findUnique({ where: { user_id: id } });
    if (!r) return { code: 0, message: "success", data: null };
    const toNum = (v: any) => (v != null ? Number(v) : 0);
    return {
      code: 0,
      message: "success",
      data: {
        userId: r.user_id,
        username: r.username,
        nickname: r.nickname,
        mobile: r.mobile,
        email: r.email,
        avatar: r.avatar,
        status: r.status,
        rankId: r.rank_id,
        regTime: r.reg_time,
        lastLogin: r.last_login,
        orderCount: r.order_count,
        orderAmount: toNum(r.order_amount),
        balance: toNum(r.balance),
        frozenBalance: toNum(r.frozen_balance),
        points: r.points,
        growthPoints: r.growth_points,
        fromTag: r.from_tag,
      },
    };
  }

  @Post("create")
  @ApiOperation({ summary: "创建会员（兼容）" })
  @Authorities("userCreateManage")
  async create(@Body() dto: any) {
    // 基础校验：用户名唯一
    if (!dto.username) return { code: 400, message: "username required", data: null };
    const existed = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existed) return { code: 400, message: "username exists", data: null };
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      username: String(dto.username).trim(),
      nickname: dto.nickname ? String(dto.nickname).trim() : "",
      mobile: dto.mobile ? String(dto.mobile).trim() : "",
      email: dto.email ? String(dto.email).trim() : "",
      password: dto.password || "",
      reg_time: now,
      rank_id: dto.rankId ? Number(dto.rankId) : 0,
      status: dto.status != null ? Number(dto.status) : 1,
    };
    const created = await this.prisma.user.create({ data });
    return { code: 0, message: "success", data: { userId: created.user_id } };
  }

  @Post("update")
  @ApiOperation({ summary: "更新会员（兼容）" })
  @Authorities("userModifyManage")
  async update(@Body() dto: any) {
    const id = Number(dto.id || dto.userId);
    if (!id) return { code: 400, message: "id required", data: null };
    const data: any = {};
    const map: Record<string, string> = {
      username: "username",
      nickname: "nickname",
      mobile: "mobile",
      email: "email",
      avatar: "avatar",
      status: "status",
      rankId: "rank_id",
      password: "password",
    };
    Object.keys(map).forEach((k) => {
      if (dto[k] !== undefined) data[map[k]] = dto[k];
    });
    await this.prisma.user.update({ where: { user_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "单字段更新（兼容，仅限 username/nickname/status）" })
  @Authorities("userModifyFieldManage")
  async updateField(@Body() dto: any) {
    const id = Number(dto.id || dto.userId);
    const field = String(dto.field || "");
    const value = dto.value;
    if (!id) return { code: 400, message: "id required", data: null };
    const allowed: Record<string, string> = {
      username: "username",
      nickname: "nickname",
      status: "status",
    };
    const dbField = allowed[field];
    if (!dbField) return { code: 400, message: "unsupported field", data: null };
    await this.prisma.user.update({ where: { user_id: id }, data: { [dbField]: value } });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除会员（兼容）" })
  @Authorities("userDelManage")
  async del(@Body() dto: any) {
    const id = Number(dto.id || dto.userId);
    if (!id) return { code: 400, message: "id required", data: null };
    await this.prisma.user.delete({ where: { user_id: id } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量操作（兼容：del/set_rank）" })
  @Authorities("userBatchManage")
  async batch(@Body() dto: any) {
    const type = dto.type;
    const ids: number[] = (dto.ids || dto.id || [])
      .toString()
      .split(",")
      .filter(Boolean)
      .map((x: string) => Number(x));
    if (!ids.length) return { code: 400, message: "ids required", data: null };
    if (type === "del") {
      await this.prisma.user.deleteMany({ where: { user_id: { in: ids } } });
    } else if (type === "set_rank") {
      const rankId = Number(dto.rank_id || dto.rankId);
      if (!rankId) return { code: 400, message: "rankId required", data: null };
      await this.prisma.user.updateMany({ where: { user_id: { in: ids } }, data: { rank_id: rankId } });
    }
    return { code: 0, message: "success", data: true };
  }

  @Get("search")
  @ApiOperation({ summary: "搜索会员（兼容）" })
  @Authorities("userManage")
  async search(@Query("keyword") keyword?: string) {
    const kw = (keyword || "").trim();
    if (!kw) return { code: 0, message: "success", data: [] };
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { mobile: { contains: kw } },
          { username: { contains: kw } },
          { email: { contains: kw } },
        ],
      },
      take: 20,
      orderBy: { user_id: "desc" },
      select: { user_id: true, username: true, mobile: true, email: true, nickname: true },
    });
    return {
      code: 0,
      message: "success",
      data: users.map((u) => ({ userId: u.user_id, username: u.username, mobile: u.mobile, email: u.email, nickname: u.nickname })),
    };
  }

  @Get("userFundDetail")
  @ApiOperation({ summary: "资金明细（兼容，简化版）" })
  @Authorities("userManage")
  async userFundDetail(@Query("user_id") userIdStr?: string) {
    const userId = Number(userIdStr);
    if (!userId) return { code: 400, message: "user_id required", data: null };
    const [balanceLogs, pointsLogs, growthLogs] = await Promise.all([
      this.prisma.user_balance_log.findMany({ where: { user_id: userId }, orderBy: { log_id: "desc" }, take: 50 }),
      this.prisma.user_points_log.findMany({ where: { user_id: userId }, orderBy: { log_id: "desc" }, take: 50 }),
      this.prisma.user_growth_points_log.findMany({ where: { user_id: userId }, orderBy: { log_id: "desc" }, take: 50 }),
    ]);
    return { code: 0, message: "success", data: { balanceLogs, pointsLogs, growthLogs } };
  }

  @Post("fundManagement")
  @ApiOperation({ summary: "资金管理（兼容，简化版：调整余额/积分/成长值）" })
  @Authorities("fundManagementManage")
  async fundManagement(@Body() dto: any) {
    const userId = Number(dto.user_id || dto.userId);
    if (!userId) return { code: 400, message: "userId required", data: null };
    const changeType = String(dto.change_type || dto.type || ""); // balance/points/growth
    const amount = Number(dto.amount || 0);
    const remark = String(dto.remark || dto.change_desc || "人工调整");
    const now = Math.floor(Date.now() / 1000);
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return { code: 404, message: "user not found", data: null };

    if (changeType === "balance") {
      const newBalance = Number(user.balance) + amount;
      const newFrozen = Number(user.frozen_balance);
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { user_id: userId }, data: { balance: newBalance } }),
        this.prisma.user_balance_log.create({
          data: {
            user_id: userId,
            balance: amount,
            frozen_balance: 0,
            new_balance: newBalance,
            new_frozen_balance: newFrozen,
            change_time: now,
            change_desc: remark,
            change_type: 0,
          },
        }),
      ]);
    } else if (changeType === "points") {
      const newPoints = Number(user.points) + Math.trunc(amount);
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { user_id: userId }, data: { points: newPoints } }),
        this.prisma.user_points_log.create({
          data: {
            user_id: userId,
            points: Math.trunc(amount),
            change_time: now,
            change_desc: remark,
            change_type: 0,
          },
        }),
      ]);
    } else if (changeType === "growth" || changeType === "growthPoints") {
      const delta = Math.trunc(amount);
      const newGrowth = Number(user.growth_points) + delta;
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { user_id: userId }, data: { growth_points: newGrowth } }),
        this.prisma.user_growth_points_log.create({
          data: { user_id: userId, points: delta, change_time: now, change_desc: remark, change_type: 0 },
        }),
      ]);
    } else {
      return { code: 400, message: "unsupported change_type", data: null };
    }

    return { code: 0, message: "success", data: true };
  }

  @Post("logout")
  @ApiOperation({ summary: "退出登陆（兼容占位）" })
  @Authorities("userManage")
  async logout() {
    // 无用户端 token 表，直接返回成功
    return { code: 0, message: "success", data: true };
  }
}
