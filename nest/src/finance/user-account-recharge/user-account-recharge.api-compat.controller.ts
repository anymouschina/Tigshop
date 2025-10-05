// @ts-nocheck
import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("账户资金/充值记录（API兼容）")
@Controller("api/user")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAccountRechargeApiCompatController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/user/account/list
   * 账户金额变动列表（仅正向变动 balance>0 与 PHP 保持：默认附带 balance=true 过滤）
   */
  @Get("account/list")
  @ApiOperation({ summary: "账户金额变动列表（兼容）" })
  async accountList(@Request() req, @Query() query: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 15));
    const skip = (page - 1) * size;

    // 排序（PHP 默认 log_id DESC）
    const sortField = ["log_id", "change_time"].includes(query.sort_field)
      ? query.sort_field
      : "log_id";
    const sortOrder = String(query.sort_order || query.sortOrder || "DESC").toLowerCase() === "asc" ? "asc" : "desc";
    // 兼容：如果传 balance=1 或 balance=true => 只看增加；否则显示全部（与 PHP service 中 balance=true 的默认行为区分，这里更灵活）
    const onlyIncrease = ["1", "true", true].includes(String(query.balance));
    const balanceFilter = onlyIncrease ? { balance: { gt: 0 } } : {};

    const [rows, total] = await Promise.all([
      (this.prisma as any).user_balance_log.findMany({
        where: { user_id: Number(userId), ...balanceFilter },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: size,
      }),
      (this.prisma as any).user_balance_log.count({ where: { user_id: Number(userId), ...balanceFilter } }),
    ]);

    // 变动类型名称映射（与 PHP UserBalanceLog::CHANGE_TYPE_NAME 对齐）
    const changeTypeNameMap: Record<number, string> = {
      1: "增加",
      2: "减少",
      99: "其他",
    };

    // 金额格式化
    const toMoney = (v: any) => {
      if (v == null) return "0.00";
      if (typeof v === "number") return v.toFixed(2);
      if (typeof v === "string") return (Number(v) || 0).toFixed(2);
      if (typeof v === "object" && Array.isArray(v.d)) {
        try {
          const digits = (v.d as number[]).join("");
          const e = v.e as number;
          const num = Number(digits) * Math.pow(10, e - digits.length + 1);
          return num.toFixed(2);
        } catch {
          return "0.00";
        }
      }
      return "0.00";
    };

    // 计算 before_* （使用 new_* 字段逆推，避免依赖当前用户余额的波动）
    // 预取用户名（一次即可）
    const userRow = await (this.prisma as any).user.findFirst({
      where: { user_id: Number(userId) },
      select: { username: true },
    }).catch(() => null);
    const username = userRow?.username || '';

    const mapped = rows.map((r: any) => {
      const changeType = r.change_type;
      const balanceRaw = Number(r.balance) || 0;
      const frozenRaw = Number(r.frozen_balance) || 0;
      // new_* 可能为 Decimal 对象
      const toNum = (v: any) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return Number(v) || 0;
        if (typeof v === 'object' && Array.isArray(v.d)) {
          try {
            const digits = (v.d as number[]).join('');
            const e = v.e as number;
            return Number(digits) * Math.pow(10, e - digits.length + 1);
          } catch { return 0; }
        }
        return 0;
      };
      const newBalanceNum = toNum(r.new_balance);
      const newFrozenNum = toNum(r.new_frozen_balance);
      const increase = changeType === 1;
      const beforeBalanceNum = increase ? newBalanceNum - balanceRaw : newBalanceNum + balanceRaw;
      const beforeFrozenNum = increase ? newFrozenNum - frozenRaw : newFrozenNum + frozenRaw;
      const changeTimeFormat = r.change_time
        ? new Date(Number(r.change_time) * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : '';
      return {
        // 主键/基础字段（驼峰）
        logId: r.log_id,
        userId: r.user_id,
        changeType,
        changeTypeName: changeTypeNameMap[changeType] || '其他',
        changeDesc: r.change_desc,
        // 本次变动金额（保持正值，无符号）
        balance: toMoney(balanceRaw),
        frozenBalance: toMoney(frozenRaw),
        // 变动前
        beforeBalance: toMoney(beforeBalanceNum),
        beforeFrozenBalance: toMoney(beforeFrozenNum),
        // 日志记录内的新余额（当时的最新）
        newBalance: toMoney(newBalanceNum),
        newFrozenBalance: toMoney(newFrozenNum),
        // 当前用户最新余额（用 newBalance 近似；若以后需要真实实时余额可单独查询 user 表 balance）
        afterBalance: toMoney(newBalanceNum),
        afterFrozenBalance: toMoney(newFrozenNum),
        // 时间
        changeTime: changeTimeFormat,
        // 用户
        username,
      };
    });

    return { code: 0, message: 'success', data: { records: mapped, total } };
  }

  /**
   * GET /api/user/rechargeOrder/list
   * 充值/提现综合记录列表（合并 user_withdraw_apply 与 user_recharge_order）
   */
  @Get("rechargeOrder/list")
  @ApiOperation({ summary: "充值/提现记录列表（兼容）" })
  async rechargeOrderList(@Request() req, @Query() query: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 15));
    const statusRaw = query.status == null ? undefined : Number(query.status);
    // -1 表示不过滤
    const filterStatus = statusRaw === -1 ? undefined : statusRaw;

    // 字段映射 + 状态文案
    const withdrawStatusType: Record<number, string> = {
      0: "待处理",
      1: "已完成",
      2: "拒绝申请",
    };
    const rechargeStatusType: Record<number, string> = {
      0: "待确认",
      1: "已支付",
      2: "无效",
    };

    const whereBase = { user_id: Number(userId) } as any;
    if (filterStatus !== undefined && !Number.isNaN(filterStatus)) {
      whereBase.status = filterStatus;
    }

    const [withdrawRows, rechargeRows] = await Promise.all([
      (this.prisma as any).user_withdraw_apply.findMany({
        where: whereBase,
        select: { amount: true, add_time: true, postscript: true, status: true },
      }),
      (this.prisma as any).user_recharge_order.findMany({
        where: whereBase,
        select: { amount: true, add_time: true, postscript: true, status: true },
      }),
    ]);

    const toMoney = (v: any) => {
      if (v == null) return "0.00";
      if (typeof v === "number") return v.toFixed(2);
      if (typeof v === "string") return (Number(v) || 0).toFixed(2);
      if (typeof v === "object" && Array.isArray(v.d)) {
        try {
          const digits = (v.d as number[]).join("");
          const e = v.e as number;
            const num = Number(digits) * Math.pow(10, e - digits.length + 1);
          return num.toFixed(2);
        } catch { return "0.00"; }
      }
      return "0.00";
    };
    const formatTime = (ts: any) => (ts ? new Date(Number(ts) * 1000).toISOString().slice(0, 19).replace("T", " ") : "");

    const withdrawMapped = withdrawRows.map((r: any) => ({
      // 原始时间戳
      rawAddTime: r.add_time,
      // 统一格式化
      addTime: formatTime(r.add_time),
      addTimeFormat: formatTime(r.add_time),
      amount: toMoney(r.amount),
      type: "提现",
      status: r.status,
      statusType: withdrawStatusType[Number(r.status)] || "",
      postscript: r.postscript,
    }));
    const rechargeMapped = rechargeRows.map((r: any) => ({
      rawAddTime: r.add_time,
      addTime: formatTime(r.add_time),
      addTimeFormat: formatTime(r.add_time),
      amount: toMoney(r.amount),
      type: "充值",
      status: r.status,
      statusType: rechargeStatusType[Number(r.status)] || "",
      postscript: r.postscript,
    }));

  const merged = [...withdrawMapped, ...rechargeMapped];
  // 按原始时间戳 DESC 排序
  merged.sort((a, b) => Number(b.rawAddTime || 0) - Number(a.rawAddTime || 0));
    const total = merged.length;
    const start = (page - 1) * size;
    const paged = merged.slice(start, start + size);

    return {
      code: 0,
      message: "success",
      data: { records: paged, total },
    };
  }
}
