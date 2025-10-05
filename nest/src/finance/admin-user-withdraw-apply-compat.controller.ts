// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { UserWithdrawApplyService } from "./user-withdraw-apply/user-withdraw-apply.service";

@ApiTags("Admin API - 财务/提现申请 兼容")
@Controller("adminapi/finance/userWithdrawApply")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminUserWithdrawApplyCompatController {
  constructor(
    private readonly userWithdrawApplyService: UserWithdrawApplyService,
  ) {}

  // GET /adminapi/finance/userWithdrawApply/list
  @Get("list")
  @Authorities("userWithdrawApplyManage")
  @ApiOperation({ summary: "提现申请列表（admin 兼容）" })
  async list(@Query() query: any) {
    const result = await this.userWithdrawApplyService.findAll({
      keyword: query.keyword ?? "",
      status: query.status !== undefined ? Number(query.status) : undefined,
      userId: Number(query.user_id ?? query.userId ?? 0) || undefined,
      withdrawType: query.withdraw_type ?? query.withdrawType ?? undefined,
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sortField: query.sort_field ?? query.sortField ?? "id",
      sortOrder: query.sort_order ?? query.sortOrder ?? "desc",
      startTime: query.start_time ?? query.startTime,
      endTime: query.end_time ?? query.endTime,
    });
    // 兼容 PHP 管理端所需字段与格式
    const mapTime = (sec?: number) => {
      const s = Number(sec || 0);
      if (!s) return "";
      const d = new Date(s * 1000);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const yyyy = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
    };

    const mapped = (result.records || []).map((r: any) => {
      let accountData: any = {};
      try {
        if (r.account_data) accountData = JSON.parse(r.account_data);
      } catch (e) {
        accountData = {};
      }
      // 兼容下划线键名，统一转为驼峰
      if (accountData && typeof accountData === "object") {
        accountData = {
          accountType:
            accountData.accountType ?? accountData.account_type ?? accountData.type,
          accountName:
            accountData.accountName ?? accountData.account_name ?? accountData.name,
          accountNo:
            accountData.accountNo ?? accountData.account_no ?? accountData.no,
          bankName: accountData.bankName ?? accountData.bank_name ?? accountData.bank,
        };
      }
      const statusNum = Number(r.status ? 1 : 0);
      const statusType = statusNum === 0 ? "待处理" : "已完成";
      return {
        statusType,
        id: r.id,
        userId: r.user_id,
        amount: (typeof r.amount === "string"
          ? Number(r.amount)
          : Number(r.amount || 0)
        ).toFixed(2),
        addTime: mapTime(r.add_time),
        finishedTime: mapTime(r.finished_time),
        postscript: r.postscript || "",
        status: statusNum,
        accountData,
        username: r.user?.username || "",
      };
    });

    return {
      code: 0,
      message: "success",
      data: {
        records: mapped,
        total: result.total,
      },
    };
  }

  // GET /adminapi/finance/userWithdrawApply/detail?id=
  @Get("detail")
  @Authorities("userWithdrawApplyManage")
  @ApiOperation({ summary: "提现申请详情（admin 兼容）" })
  async detail(@Query("id") id: any) {
    const applyId = Number(id);
    if (!applyId) return { code: 1, message: "缺少 id", data: null };
    const item = await this.userWithdrawApplyService.findById(applyId);

    const mapTime = (sec?: number) => {
      const s = Number(sec || 0);
      if (!s) return null; // 详情期望未完成为 null
      const d = new Date(s * 1000);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // 解析账户信息
    let accountData: any = {};
    try {
      if (item.account_data) accountData = JSON.parse(item.account_data);
    } catch (e) {
      accountData = {};
    }
    if (accountData && typeof accountData === "object") {
      accountData = {
        accountName: accountData.accountName ?? accountData.account_name ?? accountData.name ?? null,
        accountNo: accountData.accountNo ?? accountData.account_no ?? accountData.account ?? null,
        accountType: Number(accountData.accountType ?? accountData.account_type ?? accountData.type ?? 0) || 0,
        bankName: accountData.bankName ?? accountData.bank_name ?? accountData.bank ?? null,
        identity: accountData.identity ?? null,
      };
    }

    const statusNum = item.status ? 1 : 0; // Boolean -> 0/1
    const statusType = statusNum === 0 ? "待处理" : "已完成";
    const amountNumDetail = Number(
      typeof item.amount === "string" ? Number(item.amount) : (item.amount?.toNumber ? item.amount.toNumber() : item.amount || 0)
    );

    const data = {
      id: item.id,
      userId: item.user_id,
      username: item.user?.username || "",
  amount: Number(amountNumDetail.toFixed(2)),
      addTime: mapTime(item.add_time),
      finishedTime: mapTime(item.finished_time),
      postscript: item.postscript || "",
      status: statusNum,
      statusType,
      accountData,
    };

    return { code: 0, message: "success", data };
  }

  // POST /adminapi/finance/userWithdrawApply/create
  @Post("create")
  @Authorities("userWithdrawApplyUpdateManage")
  @ApiOperation({ summary: "创建提现申请（admin 兼容）" })
  async create(@Body() body: any) {
    // 兼容入参：{ userId, amount, postscript, accountData:{ type,name,... }, status }
    const created = await this.userWithdrawApplyService.create({
      userId: Number(body.user_id ?? body.userId),
      amount: Number(body.amount),
      postscript: body.postscript ?? "",
      accountData: body.accountData ?? body.account_data ?? {},
      status: body.status,
    });
    return { code: 0, message: "success", data: created };
  }

  // POST /adminapi/finance/userWithdrawApply/update
  @Post("update")
  @Authorities("userWithdrawApplyUpdateManage")
  @ApiOperation({ summary: "更新提现申请（admin 兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    if (!id) return { code: 1, message: "缺少 id", data: null };
    // status 语义：0待处理 1已通过(审核通过/冻结) 2已拒绝 3处理中 4已完成(打款成功扣余额) 5已失败
    const targetStatus = body.status !== undefined ? Number(body.status) : undefined;
    const prisma: any = (this as any).userWithdrawApplyService.prisma;
    const apply = await prisma.user_withdraw_apply.findUnique({ where: { id } });
    if (!apply) return { code: 1, message: "记录不存在", data: null };
    const user = apply.user_id ? await prisma.user.findUnique({ where: { user_id: apply.user_id } }) : null;
    if (!user) return { code: 1, message: "用户不存在", data: null };

    // 解析原始 account_data 及 rawStatus
    let accountDataRaw: any = {};
    try { accountDataRaw = apply.account_data ? JSON.parse(apply.account_data) : {}; } catch {}
    const prevRawStatus: number = Number(accountDataRaw.rawStatus ?? (apply.status ? 4 : 0));

    // 不允许重复完成或回退到已完成前状态（简单保护）
    if (prevRawStatus === 4 && targetStatus && targetStatus !== 4) {
      return { code: 1, message: "已完成记录禁止回退", data: null };
    }
    if (targetStatus === undefined) {
      return { code: 1, message: "缺少 status", data: null };
    }

    const now = Math.floor(Date.now() / 1000);
    const amountNum = Number(apply.amount);

    // 基础更新数据
    const updateData: any = {};
    let needBalanceChange = false;
    let newBalance = Number(user.balance);
    let newFrozen = Number(user.frozen_balance || 0);

    // 规则：
    //  - 申请创建后（0）审核通过到1：冻结余额 (扣减可用 -> 增加冻结) 若尚未冻结
    //  - 拒绝(2)：若之前冻结过则解冻
    //  - 处理中(3)：保持冻结状态不变
    //  - 完成(4)：从冻结扣除并减少冻结余额
    //  - 失败(5)：解冻冻结余额
    // 因为 schema 无单独字段区分是否已冻结，这里用 account_data.freezeApplied 标记
    const freezeApplied = !!accountDataRaw.freezeApplied;
    if (targetStatus === 1 && !freezeApplied) {
      if (amountNum > Number(user.balance)) {
        return { code: 1, message: "余额不足，无法审核通过", data: null };
      }
      // 扣可用，增冻结
      newBalance = Number(user.balance) - amountNum;
      newFrozen = Number(user.frozen_balance || 0) + amountNum;
      accountDataRaw.freezeApplied = true;
      needBalanceChange = true;
    } else if (targetStatus === 2) { // 拒绝
      if (freezeApplied) {
        newBalance = Number(user.balance) + amountNum; // 退回可用
        newFrozen = Number(user.frozen_balance || 0) - amountNum;
        accountDataRaw.freezeApplied = false;
        needBalanceChange = true;
      }
    } else if (targetStatus === 4) { // 完成
      if (!freezeApplied) {
        // 若未冻结直接完成，需先检查可用余额
        if (amountNum > Number(user.balance)) {
          return { code: 1, message: "余额不足，无法完成提现", data: null };
        }
        newBalance = Number(user.balance) - amountNum;
        // 冻结不动（未冻结流程）
        needBalanceChange = true;
      } else {
        // 已冻结 -> 扣冻结
        newFrozen = Number(user.frozen_balance || 0) - amountNum;
        // 可用不变
        needBalanceChange = true;
        accountDataRaw.freezeApplied = false; // 冻结结束
      }
      updateData.finished_time = now;
    } else if (targetStatus === 5) { // 失败 -> 解冻回可用
      if (freezeApplied) {
        newBalance = Number(user.balance) + amountNum;
        newFrozen = Number(user.frozen_balance || 0) - amountNum;
        accountDataRaw.freezeApplied = false;
        needBalanceChange = true;
      }
    }

    // 写入原始状态码
    accountDataRaw.rawStatus = targetStatus;
    updateData.account_data = JSON.stringify(accountDataRaw);
    updateData.postscript = body.postscript ?? apply.postscript;
    updateData.status = targetStatus === 4 ? true : false; // 仅完成为 true

    const updated = await prisma.$transaction(async (tx: any) => {
      // 更新提现申请
      const upd = await tx.user_withdraw_apply.update({ where: { id }, data: updateData });
      // 余额处理
      if (needBalanceChange) {
        await tx.user.update({
          where: { user_id: user.user_id },
          data: { balance: newBalance, frozen_balance: newFrozen },
        });
        // 写入 user_balance_log
        await tx.user_balance_log.create({
          data: {
            user_id: user.user_id,
            balance: user.balance, // 旧可用
            frozen_balance: user.frozen_balance || 0,
            new_balance: newBalance,
            new_frozen_balance: newFrozen,
            change_time: now,
            change_desc: `提现状态变更:${prevRawStatus}->${targetStatus} 金额:${amountNum.toFixed(2)}`,
            change_type: 0, // 0: 系统
          },
        });
      }
      return upd;
    });

    // 解析 account_data 获取 rawStatus
    let rawStatus: number | undefined = undefined;
    try {
      const parsed = updated.account_data ? JSON.parse(updated.account_data) : {};
      rawStatus = Number(parsed.rawStatus);
    } catch {}
    const actualStatusCode = rawStatus !== undefined && !isNaN(rawStatus) ? rawStatus : (updated.status ? 4 : 0);
    const statusTypeMap: Record<number, string> = {
      0: "待处理",
      1: "已通过",
      2: "已拒绝",
      3: "处理中",
      4: "已完成",
      5: "已失败",
    };
    const mapTime = (sec?: number) => {
      const s = Number(sec || 0);
      if (!s) return null;
      const d = new Date(s * 1000);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const amountNumOut = Number(
      typeof updated.amount === "string" ? Number(updated.amount) : (updated.amount?.toNumber ? updated.amount.toNumber() : updated.amount || 0)
    );
    let accountData: any = {};
    try { if (updated.account_data) accountData = JSON.parse(updated.account_data); } catch {}
    accountData = {
      accountName: accountData.accountName ?? accountData.account_name ?? accountData.name ?? null,
      accountNo: accountData.accountNo ?? accountData.account_no ?? accountData.account ?? null,
      accountType: Number(accountData.accountType ?? accountData.account_type ?? accountData.type ?? 0) || 0,
      bankName: accountData.bankName ?? accountData.bank_name ?? accountData.bank ?? null,
      identity: accountData.identity ?? null,
    };
    const formatted = {
      id: updated.id,
      userId: updated.user_id,
      username: updated.user?.username || "",
  amount: Number(amountNumOut.toFixed(2)),
      addTime: mapTime(updated.add_time),
      finishedTime: mapTime(updated.finished_time),
      postscript: updated.postscript || "",
      status: updated.status ? 1 : 0,
      statusType: statusTypeMap[actualStatusCode] || statusTypeMap[updated.status ? 4 : 0],
      accountData,
    };
    return { code: 0, message: "success", data: formatted };
  }

  // POST /adminapi/finance/userWithdrawApply/del
  @Post("del")
  @Authorities("userWithdrawApplyDelManage")
  @ApiOperation({ summary: "删除提现申请（admin 兼容）" })
  async del(@Body("id") id: any) {
    const applyId = Number(id);
    if (!applyId) return { code: 1, message: "缺少 id", data: null };
    await this.userWithdrawApplyService.delete(applyId);
    return { code: 0, message: "success", data: true };
  }

  // POST /adminapi/finance/userWithdrawApply/batch  { type: 'del', ids: number[] }
  @Post("batch")
  @Authorities("userWithdrawApplyBatchManage")
  @ApiOperation({ summary: "提现申请批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const type = body.type;
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map(Number) : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del") {
      await this.userWithdrawApplyService.batchDelete(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
