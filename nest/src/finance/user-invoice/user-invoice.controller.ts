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
import { UserInvoiceService } from "./user-invoice.service";
import {
  CreateUserInvoiceDto,
  UpdateUserInvoiceDto,
  UserInvoiceQueryDto,
  UserInvoiceConfigDto,
} from "./dto/user-invoice.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("User Invoice Management")
@Controller("adminapi/finance/user_invoice")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserInvoiceController {
  constructor(private readonly userInvoiceService: UserInvoiceService) {}

  /**
   * 获取用户发票列表 - 对齐PHP版本 finance/user_invoice/list
   */
  @Get("list")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "获取用户发票列表" })
  async list(@Query() queryDto: UserInvoiceQueryDto) {
    const result = await this.userInvoiceService.findAll(queryDto);
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
   * 获取配置信息 - 对齐PHP版本 finance/user_invoice/config
   */
  @Get("config")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.userInvoiceService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
        title_type_config: config.titleTypeConfig,
      },
    };
  }

  /**
   * 获取发票详情 - 对齐PHP版本 finance/user_invoice/detail
   */
  @Get("detail")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "获取发票详情" })
  async detail(@Query("id") id: string) {
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const invoice = await this.userInvoiceService.findById(invoiceId);
    return {
      code: 200,
      msg: "获取成功",
      data: invoice,
    };
  }

  /**
   * 创建用户发票申请
   */
  @Post("create")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "创建用户发票申请" })
  @ApiBody({ type: CreateUserInvoiceDto })
  async create(@Body() createDto: CreateUserInvoiceDto) {
    const invoice = await this.userInvoiceService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: invoice,
    };
  }

  /**
   * 更新用户发票申请 - 对齐PHP版本 finance/user_invoice/update
   */
  @Put("update")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "更新用户发票申请" })
  @ApiBody({ type: UpdateUserInvoiceDto })
  async update(@Body() updateDto: UpdateUserInvoiceDto & { id: number }) {
    const { id, ...data } = updateDto;

    const invoice = await this.userInvoiceService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: invoice,
    };
  }

  /**
   * 删除用户发票 - 对齐PHP版本 finance/user_invoice/del
   */
  @Delete("del")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "删除用户发票" })
  async delete(@Query("id") id: string) {
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.userInvoiceService.delete(invoiceId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  /**
   * 批量操作 - 对齐PHP版本 finance/user_invoice/batch
   */
  @Post("batch")
  @Roles("userInvoiceManage")
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
      await this.userInvoiceService.batchDelete(body.ids);
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

  // ===== 前台用户接口 =====

  /**
   * 获取当前用户的发票信息
   */
  @Get("user/current")
  @ApiOperation({ summary: "获取当前用户的发票信息" })
  async getCurrentUserInvoice(@Request() req) {
    const userId = req.user.user_id;
    const invoice = await this.userInvoiceService.getUserInvoice(userId);
    return {
      code: 200,
      msg: "获取成功",
      data: invoice,
    };
  }

  /**
   * 获取当前用户的发票申请历史
   */
  @Get("user/history")
  @ApiOperation({ summary: "获取当前用户的发票申请历史" })
  async getUserInvoiceHistory(
    @Request() req,
    @Query() queryDto: UserInvoiceQueryDto,
  ) {
    const userId = req.user.user_id;
    const result = await this.userInvoiceService.getUserInvoiceHistory(
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
   * 用户提交发票申请
   */
  @Post("user/apply")
  @ApiOperation({ summary: "用户提交发票申请" })
  @ApiBody({ type: CreateUserInvoiceDto })
  async userApply(@Request() req, @Body() createDto: CreateUserInvoiceDto) {
    const userId = req.user.user_id;
    const invoice = await this.userInvoiceService.create({
      ...createDto,
      userId,
    });
    return {
      code: 200,
      msg: "申请提交成功",
      data: invoice,
    };
  }

  // ===== 旧接口兼容性支持 =====

  /**
   * 旧接口兼容：获取用户发票列表
   */
  @Get()
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "获取用户发票列表（旧接口）" })
  async legacyList(@Query() queryDto: UserInvoiceQueryDto) {
    return this.list(queryDto);
  }

  /**
   * 旧接口兼容：获取发票详情
   */
  @Get(":id")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "获取发票详情（旧接口）" })
  async legacyDetail(@Param("id") id: string) {
    return this.detail({ id });
  }

  /**
   * 旧接口兼容：更新发票申请
   */
  @Put(":id")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "更新发票申请（旧接口）" })
  async legacyUpdate(
    @Param("id") id: string,
    @Body() updateDto: UpdateUserInvoiceDto,
  ) {
    const invoiceId = parseInt(id, 10);
    const invoice = await this.userInvoiceService.update(invoiceId, updateDto);
    return {
      code: 200,
      msg: "更新成功",
      data: invoice,
    };
  }

  /**
   * 旧接口兼容：删除发票
   */
  @Delete(":id")
  @Roles("userInvoiceManage")
  @ApiOperation({ summary: "删除发票（旧接口）" })
  async legacyDelete(@Param("id") id: string) {
    const invoiceId = parseInt(id, 10);
    await this.userInvoiceService.delete(invoiceId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }
}
