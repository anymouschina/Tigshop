// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import * as bcrypt from "bcrypt";
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
    const fromTag = query.from_tag !== undefined ? Number(query.from_tag) : (query.fromTag !== undefined ? Number(query.fromTag) : undefined);
    const rankId = query.rank_id !== undefined ? Number(query.rank_id) : (query.rankId !== undefined ? Number(query.rankId) : undefined);
    const balanceRaw = query.balance; // 可为阈值，或 1/true 表示 >0
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
    // PHP 行为：仅当 >0 时才应用来源/等级筛选
    if (fromTag !== undefined && !Number.isNaN(fromTag) && fromTag > 0) where.from_tag = fromTag;
    if (rankId !== undefined && !Number.isNaN(rankId) && rankId > 0) where.rank_id = rankId;

    // 余额筛选：支持传阈值（balance=100 表示 >100），或传 1/true 表示 >0
    if (balanceRaw !== undefined) {
      const balStr = String(balanceRaw).trim().toLowerCase();
      if (balStr === "1" || balStr === "true") {
        where.balance = { gt: 0 };
      } else {
        const balNum = Number(balanceRaw);
        if (!Number.isNaN(balNum)) where.balance = { gt: balNum };
      }
    }
    if (pointsGt !== undefined && !Number.isNaN(pointsGt)) where.points = { ...(where.points || {}), gt: pointsGt };
    if (pointsLt !== undefined && !Number.isNaN(pointsLt)) where.points = { ...(where.points || {}), lt: pointsLt };

    const orderBy: any = sortWhitelist[sortField] ? { [sortWhitelist[sortField]]: sortOrder } : { user_id: "desc" };

    const select = {
      user_id: true,
      username: true,
      nickname: true,
      mobile: true,
      email: true,
      avatar: true,
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
      is_company_auth: true,
    } as const;

    const skip = (page - 1) * size;
    const [records, total] = await Promise.all([
      this.prisma.user.findMany({ where, orderBy, skip: isPage ? skip : 0, take: isPage ? size : undefined, select }),
      this.prisma.user.count({ where }),
    ]);

    // 批量加载等级信息
    const rankIds = Array.from(new Set(records.map((r) => r.rank_id).filter((x) => Number(x) > 0)));
    const rankMap = new Map<number, any>();
    if (rankIds.length) {
      const ranks = await this.prisma.user_rank.findMany({ where: { rank_id: { in: rankIds } } });
      ranks.forEach((rk) => rankMap.set(rk.rank_id, rk));
    }

    const fromTagNameMap: Record<number, string> = { 1: "公众号", 2: "小程序", 3: "H5", 4: "PC", 5: "Android", 6: "IOS" };
    const mapDecimal = (v: any) => (v != null ? Number(v) : 0);
    const dataRecords = records.map((r) => {
      const rk = r.rank_id ? rankMap.get(r.rank_id) : null;
      const fmtDate = (ts: any) => {
        const v = Number(ts || 0);
        if (!v) return "";
        const d = new Date(v * 1000);
        const pad = (x: number) => String(x).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      };
      return {
        userId: r.user_id,
        username: r.username,
        nickname: r.nickname,
        mobile: r.mobile,
        email: r.email,
        avatar: r.avatar,
        isCompanyAuth: r.is_company_auth ?? 0,
        balance: mapDecimal(r.balance),
        frozenBalance: mapDecimal(r.frozen_balance),
        points: r.points,
        growthPoints: r.growth_points,
        status: r.status,
        rankId: r.rank_id,
        // 会员等级展示
        rankName: rk ? rk.rank_name : "",
        rankLogo: rk ? rk.rank_logo : "",
        regTime: fmtDate(r.reg_time),
        lastLogin: fmtDate(r.last_login),
        orderCount: r.order_count,
        orderAmount: mapDecimal(r.order_amount),
        fromTag: r.from_tag,
        fromTagName: fromTagNameMap[r.from_tag] || "",
      };
    });

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

    // rank 详情（等同 PHP 绑定 user_rank 字段）
    const [rank, address] = await Promise.all([
      r.rank_id ? this.prisma.user_rank.findUnique({ where: { rank_id: r.rank_id } }) : null,
      this.prisma.user_address.findFirst({
        where: { user_id: id, is_default: 1 },
        select: {
          address_id: true,
          user_id: true,
          consignee: true,
          mobile: true,
          telephone: true,
          email: true,
          region_ids: true,
          address: true,
          is_default: true,
        },
      }),
    ]);

    const toNum = (v: any) => (v != null ? Number(v) : 0);
    const fromTagNameMap: Record<number, string> = {
      1: "公众号",
      2: "小程序",
      3: "H5",
      4: "PC",
      5: "Android",
      6: "IOS",
    };
    const fromTagName = fromTagNameMap[r.from_tag] || "";

    // 统一输出驼峰 + 对齐 PHP 字段
    const fmtDate = (ts: any) => {
      const v = Number(ts || 0);
      if (!v) return "";
      const d = new Date(v * 1000);
      const pad = (x: number) => String(x).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const data: any = {
      userId: r.user_id,
      username: r.username,
      nickname: r.nickname,
      mobile: r.mobile,
      email: r.email,
      avatar: r.avatar,
      status: r.status,
      rankId: r.rank_id,
      regTime: fmtDate(r.reg_time),
      lastLogin: fmtDate(r.last_login),
      orderCount: r.order_count,
      orderAmount: toNum(r.order_amount),
      balance: toNum(r.balance),
      frozenBalance: toNum(r.frozen_balance),
      points: r.points,
      growthPoints: r.growth_points,
      fromTag: r.from_tag,
      fromTagName,
    };

    if (rank) {
      data.rankName = rank.rank_name;
      data.minGrowthPoints = rank.min_growth_points;
      data.maxGrowthPoints = rank.max_growth_points;
      data.discount = Number(rank.discount || 0);
      data.showPrice = rank.show_price;
      data.rankType = rank.rank_type;
      data.rankLogo = rank.rank_logo;
      data.rankIco = rank.rank_ico;
      data.rankBg = rank.rank_bg;
      data.rankPoint = rank.rank_point;
      data.freeShipping = rank.free_shipping;
      data.rankCardType = rank.rank_card_type;
      data.rights = rank.rights ? rank.rights : null;
      data.rankLevel = rank.rank_level;
    }

    if (address) {
      data.userAddress = {
        addressId: address.address_id,
        userId: address.user_id,
        consignee: address.consignee,
        mobile: address.mobile,
        telephone: address.telephone,
        email: address.email,
        regionIds: address.region_ids,
        address: address.address,
        isDefault: address.is_default,
      };
    }

    return { code: 0, message: "success", data };
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
      reg_time: now,
      rank_id: dto.rankId ? Number(dto.rankId) : 0,
      status: dto.status != null ? Number(dto.status) : 1,
    };
    // 密码加密（参考注册逻辑）
    if (dto.password) {
      const raw = String(dto.password);
      if (dto.pwdConfirm !== undefined && String(dto.pwdConfirm) !== raw) {
        return { code: 400, message: "password confirm mismatch", data: null };
      }
      data.password = await bcrypt.hash(raw, 10);
    }
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
    };
    Object.keys(map).forEach((k) => {
      if (dto[k] !== undefined) data[map[k]] = dto[k];
    });
    // 如传入密码则加密保存
    if (dto.password) {
      const raw = String(dto.password);
      if (dto.pwdConfirm !== undefined && String(dto.pwdConfirm) !== raw) {
        return { code: 400, message: "password confirm mismatch", data: null };
      }
      data.password = await bcrypt.hash(raw, 10);
    }
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
  @ApiOperation({ summary: "资金明细（兼容：from_tag 切换余额/冻结/成长/积分，支持分页）" })
  @Authorities("userManage")
  async userFundDetail(@Query() q: any) {
    const userId = Number(q.user_id ?? q.userId);
    if (!userId) return { code: 400, message: "user_id required", data: null };
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const fromTag = q.from_tag !== undefined ? Number(q.from_tag) : (q.fromTag !== undefined ? Number(q.fromTag) : undefined);

    // 如果提供 from_tag，则返回对应分类的分页列表结构 {records,total}
    if ([1, 2, 3, 4].includes(Number(fromTag))) {
      const skip = (page - 1) * size;
      if (fromTag === 1 || fromTag === 2) {
        const where: any = { user_id: userId };
        if (fromTag === 1) where.balance = { not: 0 };
        if (fromTag === 2) where.frozen_balance = { not: 0 };
        const [records, total] = await Promise.all([
          this.prisma.user_balance_log.findMany({ where, orderBy: { log_id: "desc" }, skip, take: size }),
          this.prisma.user_balance_log.count({ where }),
        ]);
        return { code: 0, message: "success", data: { records, total } };
      } else if (fromTag === 3) {
        const where: any = { user_id: userId };
        const [records, total] = await Promise.all([
          this.prisma.user_growth_points_log.findMany({ where, orderBy: { log_id: "desc" }, skip, take: size }),
          this.prisma.user_growth_points_log.count({ where }),
        ]);
        return { code: 0, message: "success", data: { records, total } };
      } else if (fromTag === 4) {
        const where: any = { user_id: userId };
        const [records, total] = await Promise.all([
          this.prisma.user_points_log.findMany({ where, orderBy: { log_id: "desc" }, skip, take: size }),
          this.prisma.user_points_log.count({ where }),
        ]);
        return { code: 0, message: "success", data: { records, total } };
      }
    }

    // 兼容：未提供 from_tag 时，返回三类明细的最近 50 条合并结构
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
  async fundManagement(@Body() dto: any, @Query() q?: any) {
    // 兼容 PHP 管理端 payload：
    // { id, changeDesc, typeBalance, balance, typeFrozenBalance, frozenBalance, typePoints, points, typeGrowthPoints, growthPoints }
    // 也兼容旧版：{ user_id/userId, change_type, amount, remark }
    const userId = Number(dto.id || dto.user_id || dto.userId || (q ? q.id || q.user_id || q.userId : undefined));
    if (!userId) return { code: 400, message: "userId required", data: null };
    const remark = String(dto.changeDesc || dto.remark || dto.change_desc || "人工调整");
    const now = Math.floor(Date.now() / 1000);

    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) return { code: 404, message: "user not found", data: null };

    // 若传了旧版单字段形式，则走旧逻辑
    if (dto.change_type || dto.type) {
      const changeType = String(dto.change_type || dto.type);
      const amount = Number(dto.amount || 0);
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
        const delta = Math.trunc(amount);
        const newPoints = Number(user.points) + delta;
        await this.prisma.$transaction([
          this.prisma.user.update({ where: { user_id: userId }, data: { points: newPoints } }),
          this.prisma.user_points_log.create({
            data: { user_id: userId, points: delta, change_time: now, change_desc: remark, change_type: 0 },
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

    // 新版批量表单：分别处理余额、冻结余额、积分、成长值
    const ops: any[] = [];
    // 余额 balance
    if (dto.typeBalance != null && dto.balance != null) {
      const type = Number(dto.typeBalance); // 1 加，2 减
      const delta = Number(dto.balance) * (type === 2 ? -1 : 1);
      const newBalance = Number(user.balance) + delta;
      const newFrozen = Number(user.frozen_balance);
      ops.push(
        this.prisma.user.update({ where: { user_id: userId }, data: { balance: newBalance } }),
        this.prisma.user_balance_log.create({
          data: {
            user_id: userId,
            balance: delta,
            frozen_balance: 0,
            new_balance: newBalance,
            new_frozen_balance: newFrozen,
            change_time: now,
            change_desc: remark,
            change_type: 0,
          },
        }),
      );
    }
    // 冻结余额 frozen_balance
    if (dto.typeFrozenBalance != null && dto.frozenBalance != null) {
      const type = Number(dto.typeFrozenBalance); // 1 加，2 减
      const delta = Number(dto.frozenBalance) * (type === 2 ? -1 : 1);
      const newFrozen = Number(user.frozen_balance) + delta;
      const newBalance = Number(user.balance);
      ops.push(
        this.prisma.user.update({ where: { user_id: userId }, data: { frozen_balance: newFrozen } }),
        this.prisma.user_balance_log.create({
          data: {
            user_id: userId,
            balance: 0,
            frozen_balance: delta,
            new_balance: newBalance,
            new_frozen_balance: newFrozen,
            change_time: now,
            change_desc: remark,
            change_type: 0,
          },
        }),
      );
    }
    // 积分 points
    if (dto.typePoints != null && dto.points != null) {
      const type = Number(dto.typePoints); // 1 加，2 减
      const delta = Math.trunc(Number(dto.points)) * (type === 2 ? -1 : 1);
      const newPoints = Number(user.points) + delta;
      ops.push(
        this.prisma.user.update({ where: { user_id: userId }, data: { points: newPoints } }),
        this.prisma.user_points_log.create({
          data: { user_id: userId, points: delta, change_time: now, change_desc: remark, change_type: 0 },
        }),
      );
    }
    // 成长值 growth_points
    if (dto.typeGrowthPoints != null && dto.growthPoints != null) {
      const type = Number(dto.typeGrowthPoints); // 1 加，2 减
      const delta = Math.trunc(Number(dto.growthPoints)) * (type === 2 ? -1 : 1);
      const newGrowth = Number(user.growth_points) + delta;
      ops.push(
        this.prisma.user.update({ where: { user_id: userId }, data: { growth_points: newGrowth } }),
        this.prisma.user_growth_points_log.create({
          data: { user_id: userId, points: delta, change_time: now, change_desc: remark, change_type: 0 },
        }),
      );
    }

    if (ops.length === 0) return { code: 400, message: "no changes", data: null };
    await this.prisma.$transaction(ops);
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
