// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";
import {
  WithdrawQueryDto,
  WithdrawAccountQueryDto,
  CreateWithdrawAccountDto,
  UpdateWithdrawAccountDto,
  CreateWithdrawApplyDto,
  WithdrawAccountDetailDto,
  DeleteWithdrawAccountDto,
} from "./dto/user-withdraw-apply.dto";

@ApiTags("用户提现申请")
@Controller("api/user/withdraw")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserWithdrawApplyController {
  constructor(
    private readonly userWithdrawApplyService: UserWithdrawApplyService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取提现申请列表" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({
    name: "status",
    required: false,
    description: "状态: 0-待审核,1-已通过,2-已拒绝",
  })
  @ApiQuery({ name: "keyword", required: false, description: "关键词搜索" })
  @ApiQuery({ name: "sort_field", required: false, description: "排序字段" })
  @ApiQuery({ name: "sort_order", required: false, description: "排序方向" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getWithdrawList(@Request() req, @Query() query: WithdrawQueryDto) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.getWithdrawList(userId, query);
  }

  @Get("accounts")
  @ApiOperation({ summary: "获取提现账号列表" })
  @ApiQuery({
    name: "account_type",
    required: false,
    description: "账号类型:1-银行卡,2-支付宝,3-微信,4-PayPal",
  })
  @ApiQuery({ name: "account_id", required: false, description: "账号ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getWithdrawAccountList(
    @Request() req,
    @Query() query: WithdrawAccountQueryDto,
  ) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.getWithdrawAccountList(userId, query);
  }

  @Post("accounts")
  @ApiOperation({ summary: "添加提现账号" })
  @ApiResponse({ status: 200, description: "添加成功" })
  async createWithdrawAccount(
    @Request() req,
    @Body() body: CreateWithdrawAccountDto,
  ) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.createWithdrawAccount(userId, body);
  }

  @Post("accounts/:id")
  @ApiOperation({ summary: "更新提现账号" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateWithdrawAccount(
    @Request() req,
    @Param("id") accountId: number,
    @Body() body: UpdateWithdrawAccountDto,
  ) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.updateWithdrawAccount(
      userId,
      accountId,
      body,
    );
  }

  @Get("accounts/:id")
  @ApiOperation({ summary: "获取提现账号详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getWithdrawAccountDetail(
    @Request() req,
    @Param("id") accountId: number,
  ) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.getWithdrawAccountDetail(
      userId,
      accountId,
    );
  }

  @Post("accounts/:id/delete")
  @ApiOperation({ summary: "删除提现账号" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteWithdrawAccount(@Request() req, @Param("id") accountId: number) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.deleteWithdrawAccount(
      userId,
      accountId,
    );
  }

  @Post("apply")
  @ApiOperation({ summary: "创建提现申请" })
  @ApiResponse({ status: 200, description: "申请成功" })
  async createWithdrawApply(
    @Request() req,
    @Body() body: CreateWithdrawApplyDto,
  ) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.createWithdrawApply(userId, body);
  }

  @Get("stats")
  @ApiOperation({ summary: "获取提现统计" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getWithdrawStats(@Request() req) {
    const userId = req.user.userId;
    return this.userWithdrawApplyService.getWithdrawStats(userId);
  }

  @Get("settings")
  @ApiOperation({ summary: "获取提现设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getWithdrawSettings() {
    return this.userWithdrawApplyService.getWithdrawSettings();
  }
}
