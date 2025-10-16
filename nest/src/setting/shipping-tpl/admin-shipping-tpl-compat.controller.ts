// @ts-nocheck
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Body,
  Put,
  Delete,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ShippingTplService } from "./shippingTpl.service";

@ApiTags("Admin API - 运费模板(兼容路径)")
@Controller("adminapi/setting/shippingTpl")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminShippingTplCompatController {
  constructor(private readonly shippingTplService: ShippingTplService) {}

  // 兼容：GET /adminapi/setting/shippingTpl/list
  @Get("list")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "获取运费模板列表（admin 兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const keyword = (query.keyword || "").toString().trim();

    const { records, total } = await this.shippingTplService.findAll({
      page,
      size,
      keyword,
    } as any);

    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  // 兼容：GET /adminapi/setting/shippingTpl/detail?id=xx
  @Get("detail")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "获取运费模板详情（admin 兼容）" })
  async detail(@Query("id") id: string) {
    const tplId = Number(id) || 0;
    const item = await this.shippingTplService.findOneCompat(tplId);
    return {
      code: 0,
      message: "success",
      data: item,
    };
  }

  // 兼容：POST /adminapi/setting/shippingTpl/create
  @Post("create")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "创建运费模板（admin 兼容）" })
  async create(@Body() body: any, @Req() req: any) {
    const shopId =
      Number(req?.headers?.["x-shop-id"]) || Number(body.shopId) || 0;
    const created = await this.shippingTplService.createCompat({
      ...body,
      shopId,
    });
    return {
      code: 0,
      message: "success",
      data: created,
    };
  }

  // 兼容：POST /adminapi/setting/shippingTpl/update  或 PUT
  @Post("update")
  @Put("update")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "更新运费模板（admin 兼容）" })
  async update(@Body() body: any, @Req() req: any) {
    const tplId =
      Number(body?.id ?? body?.shippingTplId ?? body?.shipping_tpl_id) || 0;
    const shopId =
      Number(req?.headers?.["x-shop-id"]) || Number(body.shopId) || 0;
    const updated = await this.shippingTplService.updateCompat(tplId, {
      ...body,
      shopId,
    });
    return {
      code: 0,
      message: "success",
      data: updated,
    };
  }

  // 兼容：DELETE /adminapi/setting/shippingTpl/del?id= / 也允许 POST del
  @Delete("del")
  @Post("del")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "删除运费模板（admin 兼容）" })
  async del(@Query("id") id: string, @Body() body: any) {
    const tplId = Number(id) || Number(body?.id) || 0;
    await this.shippingTplService.deleteCompat(tplId);
    return {
      code: 0,
      message: "success",
      data: true,
    };
  }

  // 兼容：POST /adminapi/setting/shippingTpl/batch  { type: 'del', ids: [] }
  @Post("batch")
  @Authorities("shippingTplManage")
  @ApiOperation({ summary: "批量操作（admin 兼容）" })
  async batch(@Body() body: any) {
    const type = String(body?.type || body?.action || "").toLowerCase();
    const ids: number[] = Array.isArray(body?.ids)
      ? body.ids.map((v: any) => Number(v)).filter((n: number) => n > 0)
      : [];
    if (!ids.length) {
      return { code: 400, message: "未选择项目", data: null };
    }
    if (type === "del") {
      await this.shippingTplService.batchDeleteCompat(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 400, message: "不支持的操作", data: null };
  }
}
