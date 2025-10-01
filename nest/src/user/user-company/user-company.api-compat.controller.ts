// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserCompanyService } from "./user-company.service";

@ApiTags("User Company API Compat")
@Controller("api/user/company")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserCompanyApiCompatController {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  // 对齐 PHP：POST /api/user/company/apply（需登录）
  @Post("apply")
  @ApiOperation({ summary: "提交企业认证申请（兼容）" })
  async apply(
    @Request() req,
    @Body()
    body: {
      company_name: string;
      company_type?: number;
      business_license?: string;
      legal_person?: string;
      contact_person?: string;
      contact_phone?: string;
      contact_email?: string;
      business_address?: string;
      business_scope?: string;
    },
  ) {
    const user_id = req.user.user_id ?? req.user.userId;
    const created = await this.userCompanyService.create({ ...body, user_id });
    return { code: 200, message: "OK", data: created };
  }

  // 对齐 PHP：GET /api/user/company/detail（需登录）
  @Get("detail")
  @ApiOperation({ summary: "获取企业认证详情（兼容）" })
  async detail(@Query("id") id: number) {
    const item = await this.userCompanyService.getDetail(Number(id));
    return { code: 200, message: "OK", data: item };
  }

  // 对齐 PHP：GET /api/user/company/myApply（需登录）
  @Get("myApply")
  @ApiOperation({ summary: "获取我的最新企业认证申请（兼容）" })
  async myApply(@Request() req) {
    const user_id = req.user.user_id ?? req.user.userId;
    const records = await this.userCompanyService.getFilterList(
      { user_id, page: 1, size: 1, sort_field: "id", sort_order: "desc" },
      ["user"],
      ["status_text", "type_text"],
    );
    const item = Array.isArray(records) && records.length ? records[0] : null;
    return { code: 200, message: "OK", data: item };
  }
}
