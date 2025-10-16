// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { MailTemplateService } from "../mail-template.service";
import { MailTemplateType } from "../dto/mail-template.dto";

@ApiTags("Admin API - 邮件模板(兼容路径)")
@Controller("adminapi/setting/mailTemplates")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminMailTemplatesCompatController {
  constructor(private readonly mailTemplateService: MailTemplateService) {}

  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "邮件模板列表（兼容）" })
  async list(@Query() query: any) {
    // 按旧版行为，默认返回全部，不分页；支持关键字筛选
    const filter: any = {
      keyword: (query.keyword || "").trim() || undefined,
      template_code: query.templateCode || query.template_code || undefined,
      type: query.type || undefined,
      paging: false,
      sort_field: query.sortField || query.sort_field,
      sort_order: query.sortOrder || query.sort_order,
    };

    const records = await this.mailTemplateService.getFilterResult(filter);
    return { code: 0, message: "success", data: records };
  }

  @Get("detail")
  @Authorities("setting")
  @ApiOperation({ summary: "邮件模板详情（兼容）" })
  async detail(
    @Query("id") id?: string,
    @Query("template_id") template_id?: string,
  ) {
    const templateId = Number(id || template_id);
    const item = await this.mailTemplateService.getDetail(templateId);
    return { code: 0, message: "success", data: item };
  }

  @Post("update")
  @Authorities("setting")
  @ApiOperation({ summary: "更新邮件模板（兼容）" })
  async update(@Body() body: any) {
    const templateId = Number(body.templateId || body.id || body.template_id);
    const updateDto: any = {
      // 兼容大小写及下划线字段
      template_subject: body.templateSubject ?? body.template_subject,
      is_html: body.isHtml ?? body.is_html,
      template_content: body.templateContent ?? body.template_content,
      type: body.type ?? MailTemplateType.TEMPLATE,
    };
    await this.mailTemplateService.update(templateId, updateDto);
    return { code: 0, message: "success", data: true };
  }
}
