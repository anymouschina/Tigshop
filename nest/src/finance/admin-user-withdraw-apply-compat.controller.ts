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
    return { code: 0, message: "success", data: item };
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
    const updated = await this.userWithdrawApplyService.update(id, {
      status: body.status,
      postscript: body.postscript,
      applyReply: body.apply_reply ?? body.applyReply,
      adminRemark: body.admin_remark ?? body.adminRemark,
      processTime: body.process_time ?? body.processTime,
      completeTime: body.complete_time ?? body.completeTime,
      tradeNo: body.trade_no ?? body.tradeNo,
    });
    return { code: 0, message: "success", data: updated };
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
