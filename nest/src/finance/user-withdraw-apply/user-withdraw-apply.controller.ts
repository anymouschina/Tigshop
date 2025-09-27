// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { UserWithdrawApplyService } from "./user-withdraw-apply.service";
import {
  CreateUserWithdrawApplyDto,
  UpdateUserWithdrawApplyDto,
  UserWithdrawApplyQueryDto,
  WithdrawStatisticsDto,
  UserWithdrawApplyConfigDto,
} from "./dto/user-withdraw-apply.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("User Withdraw Apply Management")
@Controller("adminapi/finance/user_withdraw_apply")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserWithdrawApplyController {
  constructor(
    private readonly userWithdrawApplyService: UserWithdrawApplyService,
  ) {}

  /**
   * 获取提现申请列表 - 对齐PHP版本 finance/user_withdraw_apply/list
   */
  @Get("list")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "获取提现申请列表" })
  async list(@Query() queryDto: UserWithdrawApplyQueryDto) {
    const result = await this.userWithdrawApplyService.findAll(queryDto);
    return {
      code: 200,
      msg: "获取成功",
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 获取提现申请详情 - 对齐PHP版本 finance/user_withdraw_apply/detail
   */
  @Get("detail")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "获取提现申请详情" })
  async detail(@Query("id") id: string) {
    const applyId = parseInt(id, 10);
    if (isNaN(applyId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const apply = await this.userWithdrawApplyService.findById(applyId);
    return {
      code: 200,
      msg: "获取成功",
      data: apply,
    };
  }

  /**
   * 创建提现申请 - 对齐PHP版本 finance/user_withdraw_apply/create
   */
  @Post("create")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "创建提现申请" })
  @ApiBody({ type: CreateUserWithdrawApplyDto })
  async create(@Body() createDto: CreateUserWithdrawApplyDto) {
    const apply = await this.userWithdrawApplyService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: apply,
    };
  }

  /**
   * 更新提现申请 - 对齐PHP版本 finance/user_withdraw_apply/update
   */
  @Put("update")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "更新提现申请" })
  @ApiBody({ type: UpdateUserWithdrawApplyDto })
  async update(@Body() updateDto: UpdateUserWithdrawApplyDto & { id: number }) {
    const { id, ...data } = updateDto;

    const apply = await this.userWithdrawApplyService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: apply,
    };
  }

  /**
   * 删除提现申请 - 对齐PHP版本 finance/user_withdraw_apply/del
   */
  @Delete("del")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "删除提现申请" })
  async delete(@Query("id") id: string) {
    const applyId = parseInt(id, 10);
    if (isNaN(applyId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.userWithdrawApplyService.delete(applyId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  /**
   * 批量操作 - 对齐PHP版本 finance/user_withdraw_apply/batch
   */
  @Post("batch")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "批量操作" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["del"] },
        ids: { type: "array", items: { type: "number" } },
      },
    },
  })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.userWithdrawApplyService.batchDelete(body.ids);
      return {
        code: 200,
        msg: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        msg: "操作类型错误",
      };
    }
  }

  /**
   * 获取统计信息
   */
  @Get("statistics")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "获取提现统计信息" })
  async statistics(@Query() queryDto: UserWithdrawApplyQueryDto) {
    const statistics =
      await this.userWithdrawApplyService.getStatistics(queryDto);
    return {
      code: 200,
      msg: "获取成功",
      data: statistics,
    };
  }

  /**
   * 获取配置信息
   */
  @Get("config")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.userWithdrawApplyService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
        withdraw_type_config: config.withdrawTypeConfig,
        min_amount: config.minAmount,
        max_amount: config.maxAmount,
        fee_rate: config.feeRate,
        daily_limit: config.dailyLimit,
      },
    };
  }

  // ===== 前台用户接口 =====

  /**
   * 获取当前用户的提现申请历史
   */
  @Get("user/history")
  @ApiOperation({ summary: "获取当前用户的提现申请历史" })
  async getUserHistory(
    @Request() req,
    @Query() queryDto: UserWithdrawApplyQueryDto,
  ) {
    const userId = req.user.user_id;
    const result = await this.userWithdrawApplyService.getUserWithdrawHistory(
      userId,
      queryDto,
    );
    return {
      code: 200,
      msg: "获取成功",
      data: result,
    };
  }

  /**
   * 用户提交提现申请
   */
  @Post("user/apply")
  @ApiOperation({ summary: "用户提交提现申请" })
  @ApiBody({ type: CreateUserWithdrawApplyDto })
  async userApply(
    @Request() req,
    @Body() createDto: CreateUserWithdrawApplyDto,
  ) {
    const userId = req.user.user_id;
    const apply = await this.userWithdrawApplyService.create({
      ...createDto,
      userId,
    });
    return {
      code: 200,
      msg: "申请提交成功",
      data: apply,
    };
  }

  // ===== 旧接口兼容性支持 =====

  /**
   * 旧接口兼容：获取提现申请列表
   */
  @Get()
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "获取提现申请列表（旧接口）" })
  async legacyList(@Query() queryDto: UserWithdrawApplyQueryDto) {
    return this.list(queryDto);
  }

  /**
   * 旧接口兼容：获取申请详情
   */
  @Get(":id")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "获取申请详情（旧接口）" })
  async legacyDetail(@Param("id") id: string) {
    return this.detail({ id });
  }

  /**
   * 旧接口兼容：更新申请
   */
  @Put(":id")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "更新申请（旧接口）" })
  async legacyUpdate(
    @Param("id") id: string,
    @Body() updateDto: UpdateUserWithdrawApplyDto,
  ) {
    const applyId = parseInt(id, 10);
    const apply = await this.userWithdrawApplyService.update(
      applyId,
      updateDto,
    );
    return {
      code: 200,
      msg: "更新成功",
      data: apply,
    };
  }

  /**
   * 旧接口兼容：删除申请
   */
  @Delete(":id")
  @Roles("userWithdrawApplyManage")
  @ApiOperation({ summary: "删除申请（旧接口）" })
  async legacyDelete(@Param("id") id: string) {
    const applyId = parseInt(id, 10);
    await this.userWithdrawApplyService.delete(applyId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }
}
