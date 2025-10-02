// @ts-nocheck
import { Controller, Get, Post, Body, Query, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { HomeService } from "./home.service";
import { Public } from "../auth/decorators/public.decorator";
import { ProductDetailService } from "../product/product-detail.service";

@ApiTags("Home Page")
@Controller("api2")
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly productDetailService: ProductDetailService,
  ) {}

  /**
   * 首页数据 - 对齐PHP版本 home/Home/index
   */
  @Get("home/home/index")
  @Public()
  @ApiOperation({ summary: "获取首页数据" })
  async index(@Query() query: { preview_id?: number; decorate_id?: number }) {
    const data = await this.homeService.getHomeData(query);
    return { code: 0, message: "success", data };
  }

  /**
   * PC首页 - 对齐PHP版本 home/Home/pcIndex
   */
  @Get("home/home/pcIndex")
  @Public()
  @ApiOperation({ summary: "获取PC首页数据" })
  async pcIndex(@Query() query: { preview_id?: number; decorate_id?: number }) {
    const data = await this.homeService.getPcHomeData(query);
    return { code: 0, message: "success", data };
  }

  /**
   * 首页今日推荐 - 对齐PHP版本 home/Home/getRecommend
   */
  @Get("home/home/getRecommend")
  @Public()
  @ApiOperation({ summary: "获取首页推荐商品" })
  async getRecommend(
    @Query()
    query: {
      decorate_id?: number;
      module_index?: string;
      page?: number;
      preview_id?: number;
    },
  ) {
    const data = await this.homeService.getRecommend(query);
    return { code: 0, message: "success", data };
  }

  /**
   * 首页秒杀 - 对齐PHP版本 home/Home/getSeckill
   */
  @Get("home/home/getSeckill")
  @Public()
  @ApiOperation({ summary: "获取首页秒杀商品" })
  async getSeckill(@Query() query: { page?: number; un_started?: number }) {
    const data = await this.homeService.getSeckill(query);
    return { code: 0, message: "success", data };
  }

  /**
   * 首页优惠券 - 对齐PHP版本 home/Home/getCoupon
   */
  @Get("home/home/getCoupon")
  @Public()
  @ApiOperation({ summary: "获取首页优惠券" })
  async getCoupon(@Query() query: { shop_id?: number }) {
    const data = await this.homeService.getCoupon(query);
    return { code: 0, message: "success", data };
  }

  /**
   * 首页分类栏 - 对齐PHP版本 home/Home/mobileCatNav
   */
  @Get("home/home/mobileCatNav")
  @Public()
  @ApiOperation({ summary: "获取移动端分类导航" })
  async mobileCatNav() {
    const data = await this.homeService.getMobileCatNav();
    return { code: 0, message: "success", data };
  }

  /**
   * 移动端导航栏 - 对齐PHP版本 home/Home/mobileNav
   */
  @Get("home/home/mobileNav")
  @Public()
  @ApiOperation({ summary: "获取移动端导航栏" })
  async mobileNav(@Query("decorate_sn") decorateSn: string = "mobileNav") {
    const data = await this.homeService.getMobileNav(decorateSn);
    return { code: 0, message: "success", data };
  }

  /**
   * 个人中心 - 对齐PHP版本 home/Home/memberDecorate
   */
  @Get("home/home/memberDecorate")
  @Public()
  @ApiOperation({ summary: "获取个人中心装修数据" })
  async memberDecorate(
    @Query("decorate_sn") decorateSn: string = "memberDecorate",
  ) {
    const data = await this.homeService.getMemberDecorate(decorateSn);
    return { code: 0, message: "success", data };
  }

  /**
   * 客服设置 - 对齐PHP版本 home/Home/customerServiceConfig
   */
  @Get("home/home/customerServiceConfig")
  @Public()
  @ApiOperation({ summary: "获取客服设置" })
  async customerServiceConfig() {
    const data = await this.homeService.getCustomerServiceConfig();
    return { code: 0, message: "success", data };
  }

  /**
   * 客服设置 - 对齐PHP版本 home/Home/getCustomerServiceConfig
   */
  @Get("home/home/getCustomerServiceConfig")
  @Public()
  @ApiOperation({ summary: "获取客服设置" })
  async getCustomerServiceConfig() {
    const data = await this.homeService.getCustomerServiceConfig();
    return { code: 0, message: "success", data };
  }

  /**
   * PC端友情链接 - 对齐PHP版本 home/Home/friendLinks
   */
  @Get("home/home/friendLinks")
  @Public()
  @ApiOperation({ summary: "获取友情链接" })
  async friendLinks() {
    const data = await this.homeService.getFriendLinks();
    return { code: 0, message: "success", data };
  }
}
