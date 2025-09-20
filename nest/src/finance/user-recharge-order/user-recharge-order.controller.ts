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
import { UserRechargeOrderService } from "./user-recharge-order.service";
import {
  CreateUserRechargeOrderDto,
  UpdateUserRechargeOrderDto,
  UserRechargeOrderQueryDto,
  RechargeOrderStatisticsDto,
  UserRechargeOrderConfigDto,
} from "./dto/user-recharge-order.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("User Recharge Order Management")
@Controller("adminapi/finance/user_recharge_order")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserRechargeOrderController {
  constructor(
    private readonly userRechargeOrderService: UserRechargeOrderService,
  ) {}

  /**
   * 获取充值订单列表 - 对齐PHP版本 finance/user_recharge_order/list
   */
  @Get("list")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "获取充值订单列表" })
  async list(@Query() queryDto: UserRechargeOrderQueryDto) {
    const result = await this.userRechargeOrderService.findAll(queryDto);
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
   * 获取充值订单详情 - 对齐PHP版本 finance/user_recharge_order/detail
   */
  @Get("detail")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "获取充值订单详情" })
  async detail(@Query("id") id: string) {
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const order = await this.userRechargeOrderService.findById(orderId);
    return {
      code: 200,
      msg: "获取成功",
      data: order,
    };
  }

  /**
   * 创建充值订单 - 对齐PHP版本 finance/user_recharge_order/create
   */
  @Post("create")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "创建充值订单" })
  @ApiBody({ type: CreateUserRechargeOrderDto })
  async create(@Body() createDto: CreateUserRechargeOrderDto) {
    const order = await this.userRechargeOrderService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: order,
    };
  }

  /**
   * 更新充值订单 - 对齐PHP版本 finance/user_recharge_order/update
   */
  @Put("update")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "更新充值订单" })
  @ApiBody({ type: UpdateUserRechargeOrderDto })
  async update(@Body() updateDto: UpdateUserRechargeOrderDto & { id: number }) {
    const { id, ...data } = updateDto;

    const order = await this.userRechargeOrderService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: order,
    };
  }

  /**
   * 删除充值订单 - 对齐PHP版本 finance/user_recharge_order/del
   */
  @Delete("del")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "删除充值订单" })
  async delete(@Query("id") id: string) {
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.userRechargeOrderService.delete(orderId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  /**
   * 批量操作 - 对齐PHP版本 finance/user_recharge_order/batch
   */
  @Post("batch")
  @Roles("userRechargeOrderManage")
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
      await this.userRechargeOrderService.batchDelete(body.ids);
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
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "获取充值统计信息" })
  async statistics(@Query() queryDto: UserRechargeOrderQueryDto) {
    const statistics =
      await this.userRechargeOrderService.getStatistics(queryDto);
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
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.userRechargeOrderService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
        payment_type_config: config.paymentTypeConfig,
        min_amount: config.minAmount,
        max_amount: config.maxAmount,
      },
    };
  }

  // ===== 前台用户接口 =====

  /**
   * 获取当前用户的充值订单历史
   */
  @Get("user/history")
  @ApiOperation({ summary: "获取当前用户的充值订单历史" })
  async getUserHistory(
    @Request() req,
    @Query() queryDto: UserRechargeOrderQueryDto,
  ) {
    const userId = req.user.user_id;
    const result = await this.userRechargeOrderService.getUserRechargeHistory(
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
   * 用户创建充值订单
   */
  @Post("user/create")
  @ApiOperation({ summary: "用户创建充值订单" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        amount: { type: "number", minimum: 0.01 },
        postscript: { type: "string" },
        paymentType: {
          type: "string",
          enum: ["alipay", "wechat", "balance", "bank"],
        },
      },
    },
  })
  async userCreate(
    @Request() req,
    @Body() body: { amount: number; postscript?: string; paymentType?: string },
  ) {
    const userId = req.user.user_id;
    const order = await this.userRechargeOrderService.create({
      userId,
      amount: body.amount,
      postscript: body.postscript,
      paymentType: body.paymentType as any,
    });
    return {
      code: 200,
      msg: "创建成功",
      data: order,
    };
  }

  /**
   * 用户取消订单
   */
  @Post("user/cancel/:id")
  @ApiOperation({ summary: "用户取消订单" })
  async userCancel(@Request() req, @Param("id") id: string) {
    const orderId = parseInt(id, 10);
    const userId = req.user.user_id;
    await this.userRechargeOrderService.cancelOrder(orderId, userId);
    return {
      code: 200,
      msg: "取消成功",
    };
  }

  /**
   * 根据订单号查询订单
   */
  @Get("user/order/:orderSn")
  @ApiOperation({ summary: "根据订单号查询订单" })
  async userFindByOrderSn(@Request() req, @Param("orderSn") orderSn: string) {
    const order = await this.userRechargeOrderService.findByOrderSn(orderSn);

    // 检查是否为当前用户的订单
    if (order.user_id !== req.user.user_id) {
      return {
        code: 403,
        msg: "无权限访问此订单",
      };
    }

    return {
      code: 200,
      msg: "获取成功",
      data: order,
    };
  }

  // ===== 旧接口兼容性支持 =====

  /**
   * 旧接口兼容：获取充值订单列表
   */
  @Get()
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "获取充值订单列表（旧接口）" })
  async legacyList(@Query() queryDto: UserRechargeOrderQueryDto) {
    return this.list(queryDto);
  }

  /**
   * 旧接口兼容：获取订单详情
   */
  @Get(":id")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "获取订单详情（旧接口）" })
  async legacyDetail(@Param("id") id: string) {
    return this.detail({ id });
  }

  /**
   * 旧接口兼容：更新订单
   */
  @Put(":id")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "更新订单（旧接口）" })
  async legacyUpdate(
    @Param("id") id: string,
    @Body() updateDto: UpdateUserRechargeOrderDto,
  ) {
    const orderId = parseInt(id, 10);
    const order = await this.userRechargeOrderService.update(
      orderId,
      updateDto,
    );
    return {
      code: 200,
      msg: "更新成功",
      data: order,
    };
  }

  /**
   * 旧接口兼容：删除订单
   */
  @Delete(":id")
  @Roles("userRechargeOrderManage")
  @ApiOperation({ summary: "删除订单（旧接口）" })
  async legacyDelete(@Param("id") id: string) {
    const orderId = parseInt(id, 10);
    await this.userRechargeOrderService.delete(orderId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }
}
