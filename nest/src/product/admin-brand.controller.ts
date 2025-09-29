// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { BrandService } from "./brand.service";

@ApiTags("Admin API - 品牌管理(兼容路径)")
@Controller("adminapi/product/brand")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiBrandController {
  constructor(private readonly brandService: BrandService) {}

  /**
   * 兼容前端 product/brand/search
   */
  @Get("search")
  @ApiOperation({ summary: "搜索品牌（admin）" })
  async search(@Query("word") word?: string) {
    const result = await this.brandService.searchBrands(word || "");
    const brandList = (result.brand_list || []).map((b: any) => ({
      brandId: b.brand_id,
      brandName: b.brand_name,
      brandLogo: b.brand_logo,
      firstWord: b.first_word,
    }));
    // 前端定义 BrandSearchFilterResult:
    // { brandList: BrandFilterState[]; firstWordList: string[]; message: string; errcode: number; }
    return {
      code: 0,
      message: "success",
      data: {
        brandList,
        firstWordList: result.firstWord_list || [],
        message: "success",
        errcode: 0,
      },
    };
  }

  /**
   * 兼容前端 product/brand/auditWaitNum
   */
  @Get("auditWaitNum")
  @ApiOperation({ summary: "获取待审核品牌数量（admin）" })
  async auditWaitNum() {
    const count = await this.brandService.getAuditWaitCount();
    return { code: 0, message: "success", data: count };
  }

  /**
   * 兼容前端 product/brand/list
   */
  @Get("list")
  @ApiOperation({ summary: "品牌列表（admin）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const mappedFilter = {
      keyword: query.keyword ?? "",
      is_show: query.isShow !== undefined && query.isShow !== "" ? Number(query.isShow) : undefined,
      status: query.status !== undefined && query.status !== "" ? Number(query.status) : undefined,
      brand_is_hot: query.brandIsHot !== undefined && query.brandIsHot !== "" ? Number(query.brandIsHot) : undefined,
      first_word: query.firstWord || undefined,
      shop_id: query.shopId ? Number(query.shopId) : undefined,
      sort_field: query.sortField || undefined,
      sort_order: query.sortOrder || undefined,
      page,
      size,
      paging: true,
    };

    const [records, total] = await Promise.all([
      this.brandService.getFilterResult(mappedFilter),
      this.brandService.getFilterCount(mappedFilter),
    ]);

    return {
      code: 0,
      message: "success",
      data: {
        records: records.map((r: any) => ({
          brandId: r.brand_id,
          brandName: r.brand_name,
          brandLogo: r.brand_logo,
          firstWord: r.first_word,
          brandIsHot: r.brand_is_hot,
          isShow: r.is_show,
          sortOrder: r.sort_order,
          status: r.check_status,
          statusText: r.status_text,
          rejectRemark: r.reject_remark,
          shop: r.shop ? { shopId: r.shop.shop_id, shopTitle: r.shop.shop_title } : undefined,
        })),
        filter: { page },
        total,
      },
    };
  }

  /**
   * 兼容前端 product/brand/create
   */
  @Post("create")
  @ApiOperation({ summary: "创建品牌（admin）" })
  async create(@Body() body: any) {
    // 前端传驼峰 -> 下划线
    const data: any = {
      brand_name: body.brandName,
      brand_logo: body.brandLogo,
      brand_desc: body.brandDesc,
      sort_order: body.sortOrder,
      first_word: body.firstWord,
      is_show: body.isShow,
      brand_is_hot: body.brandIsHot,
      brand_type: body.brandType,
      brand_en_name: body.brandEnName,
      site_url: body.siteUrl,
      shop_id: body.shopId ? Number(body.shopId) : 0,
    };
    const created = await this.brandService.create(data);
    return { code: 0, message: "success", data: { brandId: created.brand_id } };
  }

  /**
   * 兼容前端 product/brand/auditList
   */
  @Get("auditList")
  @ApiOperation({ summary: "待审核品牌列表（admin）" })
  async auditList(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const filter = {
      keyword: query.keyword ?? "",
      shop_id: query.shopId ? Number(query.shopId) : undefined,
      sort_field: query.sortField || undefined,
      sort_order: query.sortOrder || undefined,
      page,
      size,
    };
    const result = await this.brandService.getAuditList(filter);
    return {
      code: 0,
      message: "success",
      data: {
        records: result.records.map((r: any) => ({
          brandId: r.brand_id,
          brandName: r.brand_name,
          brandLogo: r.brand_logo,
          firstWord: r.first_word,
          brandIsHot: r.brand_is_hot,
          isShow: r.is_show,
          sortOrder: r.sort_order,
          // 审核相关字段
          status: r.check_status,
          statusText: r.status_text,
          rejectRemark: r.reject_remark,
          // 店铺信息（用于展示“店铺：xxx”）
          shop: r.shop
            ? { shopId: r.shop.shop_id, shopTitle: r.shop.shop_title }
            : undefined,
        })),
        filter: { page },
        total: result.total,
      },
    };
  }

  /**
   * 兼容前端 product/brand/detail
   */
  @Get("detail")
  @ApiOperation({ summary: "获取品牌详情（admin）" })
  async detail(@Query("id") id: string) {
    const brand = await this.brandService.getDetail(Number(id));
    return {
      code: 0,
      message: "success",
      data: {
        brandId: brand.brand_id,
        brandName: brand.brand_name,
        brandLogo: brand.brand_logo,
        brandDesc: brand.brand_desc,
        sortOrder: brand.sort_order,
        firstWord: brand.first_word,
        isShow: brand.is_show,
        brandIsHot: brand.brand_is_hot,
        brandType: brand.brand_type,
        brandEnName: brand.brand_en_name,
        siteUrl: brand.site_url,
        shopId: brand.shop_id,
        checkStatus: brand.check_status,
        rejectRemark: brand.reject_remark,
        showName: brand.show_name,
        hotName: brand.hot_name,
        statusName: brand.status_name,
      },
    };
  }

  /**
   * 兼容前端 product/brand/del
   */
  @Post("del")
  @ApiOperation({ summary: "删除品牌（admin）" })
  async del(@Body() body: any) {
    const id = Number(body.id);
    await this.brandService.delete(id);
    return { code: 0, message: "success" };
  }
}
