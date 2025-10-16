// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ProductGiftService } from "./product-gift/product-gift.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-ProductGift")
@Controller("adminapi/promotion/productGift")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminProductGiftCompatController {
  constructor(private readonly svc: ProductGiftService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动赠品列表（兼容 /adminapi）" })
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || "",
      gift_id: query.gift_id || query.giftId || 0,
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sortField || query.sort_field || "gift_id",
      sort_order: query.sortOrder || query.sort_order || "desc",
    } as any;
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    return ResponseUtil.success({ records, total });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动赠品详情（兼容 /adminapi）" })
  async detail(@Query("giftId") giftId: number) {
    const item = await this.svc.getDetail(Number(giftId));
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建活动赠品（兼容 /adminapi）" })
  async create(@Body() body: any) {
    const ok = await this.svc.createProductGift(body);
    return ok ? ResponseUtil.success() : ResponseUtil.error("添加赠品失败");
  }

  @Put("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新活动赠品（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const ok = await this.svc.updateProductGift(body);
    return ok ? ResponseUtil.success() : ResponseUtil.error("更新赠品失败");
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除活动赠品（兼容 /adminapi）" })
  async del(@Body("giftId") giftId: number) {
    await this.svc.deleteProductGift(Number(giftId));
    return ResponseUtil.success();
  }

  @Get("statistics")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "赠品统计（兼容 /adminapi）" })
  async statistics() {
    const stats = await this.svc.getGiftStatistics();
    return ResponseUtil.success(stats);
  }

  @Get("available")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "可用赠品列表（兼容 /adminapi）" })
  async available(@Query("product_id") productId?: number) {
    const list = await this.svc.getAvailableGifts(
      productId ? Number(productId) : undefined,
    );
    return ResponseUtil.success(list);
  }
}
