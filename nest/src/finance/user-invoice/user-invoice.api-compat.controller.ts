// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserInvoiceService } from "./user-invoice.service";
import {
  CreateUserInvoiceDto,
  UpdateUserInvoiceDto,
} from "./dto/user-invoice.dto";

@ApiTags("User Invoice API Compat")
@Controller("api/user/invoice")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserInvoiceApiCompatController {
  constructor(private readonly userInvoiceService: UserInvoiceService) {}

  // 对齐 PHP：GET /api/user/invoice/detail（需登录）
  @Get("detail")
  @ApiOperation({ summary: "获取发票详情（兼容）" })
  async detail(@Request() req) {
    const userId = req.user.user_id ?? req.user.userId;
    const invoice = await this.userInvoiceService.getUserInvoice(userId);
    return { code: 200, message: "OK", data: invoice };
  }

  // 对齐 PHP：POST /api/user/invoice/create（需登录）
  @Post("create")
  @ApiOperation({ summary: "创建发票申请（兼容）" })
  async create(@Request() req, @Body() body: CreateUserInvoiceDto) {
    const userId = req.user.user_id ?? req.user.userId;
    const created = await this.userInvoiceService.create({ ...body, userId });
    return { code: 200, message: "OK", data: created };
  }

  // 对齐 PHP：POST /api/user/invoice/update（需登录）
  @Post("update")
  @ApiOperation({ summary: "更新发票申请（兼容）" })
  async update(
    @Request() req,
    @Body() body: UpdateUserInvoiceDto & { id: number },
  ) {
    const updated = await this.userInvoiceService.update(body.id, body);
    return { code: 200, message: "OK", data: updated };
  }

  // 对齐 PHP：GET /api/user/invoice/getStatus（需登录）
  @Get("getStatus")
  @ApiOperation({ summary: "获取发票状态配置（兼容）" })
  async getStatus() {
    const cfg = await this.userInvoiceService.getConfig();
    return {
      code: 200,
      message: "OK",
      data: {
        status: cfg.statusConfig,
        title_type: cfg.titleTypeConfig,
      },
    };
  }
}
