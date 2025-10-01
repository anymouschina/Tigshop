// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("用户提现（API兼容）")
@Controller("api/user/withdrawApply")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserWithdrawApplyApiCompatController {
  constructor(
    private readonly svc: UserWithdrawApplyService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /api/user/withdrawApply/list  提现账号列表
  @Get("list")
  @ApiOperation({ summary: "提现账号列表（兼容）" })
  async list(@Request() req, @Query() query: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const accountType = Number(query.account_type || 1);
    const rows = await (this.prisma as any).user_withdraw_account.findMany({
      where: { user_id: Number(userId), account_type: accountType },
      orderBy: { account_id: "desc" },
    });
    return { code: 0, message: "success", data: { records: rows, total: rows.length } };
  }

  // POST /api/user/withdrawApply/createAccount
  @Post("createAccount")
  @ApiOperation({ summary: "添加提现账号（兼容）" })
  async createAccount(@Request() req, @Body() body: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const data = await (this.prisma as any).user_withdraw_account.create({
      data: {
        user_id: Number(userId),
        account_type: Number(body.account_type || 1),
        account_name: String(body.account_name || ""),
        account_no: String(body.account_no || ""),
        identity: String(body.identity || ""),
        bank_name: String(body.bank_name || ""),
      },
    });
    return { code: 0, message: "success", data: data };
  }

  // POST /api/user/withdrawApply/updateAccount
  @Post("updateAccount")
  @ApiOperation({ summary: "编辑提现账号（兼容）" })
  async updateAccount(@Request() req, @Body() body: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const accountId = Number(body.account_id || 0);
    const exists = await (this.prisma as any).user_withdraw_account.findFirst({
      where: { account_id: accountId, user_id: Number(userId) },
    });
    if (!exists) return { code: 1, message: "账号不存在", data: null };
    await (this.prisma as any).user_withdraw_account.update({
      where: { account_id: accountId },
      data: {
        account_type: Number(body.account_type ?? exists.account_type),
        account_name: body.account_name ?? exists.account_name,
        account_no: body.account_no ?? exists.account_no,
        identity: body.identity ?? exists.identity,
        bank_name: body.bank_name ?? exists.bank_name,
      },
    });
    return { code: 0, message: "success", data: null };
  }

  // GET /api/user/withdrawApply/accountDetail
  @Get("accountDetail")
  @ApiOperation({ summary: "提现账号详情（兼容）" })
  async accountDetail(@Request() req, @Query("account_id") accountId: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const item = await (this.prisma as any).user_withdraw_account.findFirst({
      where: { account_id: Number(accountId || 0), user_id: Number(userId) },
    });
    return { code: 0, message: "success", data: item };
  }

  // POST /api/user/withdrawApply/delAccount
  @Post("delAccount")
  @ApiOperation({ summary: "删除提现账号（兼容）" })
  async delAccount(@Request() req, @Body("account_id") accountId: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const exists = await (this.prisma as any).user_withdraw_account.findFirst({
      where: { account_id: Number(accountId || 0), user_id: Number(userId) },
    });
    if (!exists) return { code: 1, message: "账号不存在", data: null };
    await (this.prisma as any).user_withdraw_account.delete({
      where: { account_id: Number(accountId || 0) },
    });
    return { code: 0, message: "success", data: null };
  }

  // POST /api/user/withdrawApply/apply  添加提现申请
  @Post("apply")
  @ApiOperation({ summary: "提现申请（兼容）" })
  async apply(@Request() req, @Body() body: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const amount = Number(body.amount || 0);
    const accountData = body.account_data || body.accountData || {};
    const created = await this.svc.create({
      userId: Number(userId),
      amount,
      accountData,
      postscript: "",
      status: 0,
    } as any);
    return { code: 0, message: "success", data: created };
  }
}
