// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { TranslationsService } from "./translations.service";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 多语言翻译(兼容路径)")
@Controller("adminapi/lang/translations")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class TranslationsController {
  constructor(
    private readonly translationsService: TranslationsService,
    private readonly prisma: PrismaService,
  ) {}

  // 业务翻译数据：createTranslations（POST）
  @Post("createTranslations")
  @ApiOperation({ summary: "创建/更新业务翻译（兼容）" })
  async createTranslations(@Body() body: any) {
    const ok = await this.translationsService.createOrUpdateBusinessTranslations({
      translationName: body.translationName,
      translationKey: body.translationKey,
      dataType: Number(body.dataType),
      dataId: Number(body.dataId),
      items: (body.items || []).map((it: any) => ({
        localeId: Number(it.localeId),
        translationValue: String(it.translationValue ?? ""),
      })),
    });
    return { code: 0, message: "success", data: ok };
  }

  // 业务翻译查询：getTranslations（GET）
  @Get("getTranslations")
  @ApiOperation({ summary: "获取业务翻译（兼容）" })
  async getTranslations(@Query() query: any) {
    const dataType = Number(query.dataType || 0);
    const dataId = Number(query.dataId || 0);
    const translationName = query.translationName as string | undefined;
    const detail = await this.translationsService.getBusinessTranslations(
      dataType,
      dataId,
      translationName,
    );
    return { code: 0, message: "success", data: detail };
  }

  // 详情：/adminapi/lang/translations/detail?id=xxx（GET）
  @Get("detail")
  @ApiOperation({ summary: "获取翻译详情（兼容）" })
  async detail(@Query("id") id: string) {
    const detail = await this.translationsService.getDetail(Number(id));
    return { code: 0, message: "success", data: detail };
  }

  // 一键翻译占位：translation（POST）。实际翻译外部服务暂未对接，返回原文
  @Post("translation")
  @ApiOperation({ summary: "一键翻译（占位实现，直接回显文本）" })
  async translation(@Body() body: any) {
    const text = String(body.text ?? "");
    return { code: 0, message: "success", data: { translation: text } };
  }

  // 列表：/adminapi/lang/translations/list?page=1&size=15&dataType=0&localeIds=1,2（GET）
  @Get("list")
  @ApiOperation({ summary: "翻译列表（兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const dataType = query.dataType !== undefined && query.dataType !== null && query.dataType !== ""
      ? Number(query.dataType)
      : undefined;
    const localeIds = (query.localeIds ?? "")
      .toString()
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
      .map((s: string) => Number(s))
      .filter((n: number) => !Number.isNaN(n));

    const filter = {
      page,
      size,
      dataType,
      localeIds: localeIds.length ? localeIds : undefined,
    } as const;

    const res = await this.translationsService.getList(filter);
    return { code: 0, message: "success", data: res };
  }

  // 兼容：获取最多 3 个启用的语言
  @Get("getLocalesLimit3")
  @ApiOperation({ summary: "获取最多3个可用语言（兼容）" })
  async getLocalesLimit3() {
    const rows = await this.prisma.locales.findMany({
      where: { is_enabled: 1 },
      orderBy: [
        { sort: "asc" },
        { id: "asc" },
      ],
      take: 3,
    });
    return { code: 0, message: "success", data: rows };
  }
}
