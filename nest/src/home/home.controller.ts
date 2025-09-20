// @ts-nocheck
import { Controller, Get, Post, Body, Query, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { HomeService } from "./home.service";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Home Page")
@Controller("api")
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * 首页数据 - 对齐PHP版本 home/Home/index
   */
  @Get("home/home/index")
  @Public()
  @ApiOperation({ summary: "获取首页数据" })
  async index(@Query() query: { preview_id?: number; decorate_id?: number }) {
    return this.homeService.getHomeData(query);
  }

  /**
   * PC首页 - 对齐PHP版本 home/Home/pcIndex
   */
  @Get("home/home/pcIndex")
  @Public()
  @ApiOperation({ summary: "获取PC首页数据" })
  async pcIndex(@Query() query: { preview_id?: number; decorate_id?: number }) {
    return this.homeService.getPcHomeData(query);
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
    return this.homeService.getRecommend(query);
  }

  /**
   * 首页秒杀 - 对齐PHP版本 home/Home/getSeckill
   */
  @Get("home/home/getSeckill")
  @Public()
  @ApiOperation({ summary: "获取首页秒杀商品" })
  async getSeckill(@Query() query: { page?: number; un_started?: number }) {
    return this.homeService.getSeckill(query);
  }

  /**
   * 首页优惠券 - 对齐PHP版本 home/Home/getCoupon
   */
  @Get("home/home/getCoupon")
  @Public()
  @ApiOperation({ summary: "获取首页优惠券" })
  async getCoupon(@Query() query: { shop_id?: number }) {
    return this.homeService.getCoupon(query);
  }

  /**
   * 首页分类栏 - 对齐PHP版本 home/Home/mobileCatNav
   */
  @Get("home/home/mobileCatNav")
  @Public()
  @ApiOperation({ summary: "获取移动端分类导航" })
  async mobileCatNav() {
    return this.homeService.getMobileCatNav();
  }

  /**
   * 移动端导航栏 - 对齐PHP版本 home/Home/mobileNav
   */
  @Get("home/home/mobileNav")
  @Public()
  @ApiOperation({ summary: "获取移动端导航栏" })
  async mobileNav(@Query("decorate_sn") decorateSn: string = "mobileNav") {
    return this.homeService.getMobileNav(decorateSn);
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
    return this.homeService.getMemberDecorate(decorateSn);
  }

  /**
   * 客服设置 - 对齐PHP版本 home/Home/customerServiceConfig
   */
  @Get("home/home/customerServiceConfig")
  @Public()
  @ApiOperation({ summary: "获取客服设置" })
  async customerServiceConfig() {
    return this.homeService.getCustomerServiceConfig();
  }

  /**
   * PC端友情链接 - 对齐PHP版本 home/Home/friendLinks
   */
  @Get("home/home/friendLinks")
  @Public()
  @ApiOperation({ summary: "获取友情链接" })
  async friendLinks() {
    return this.homeService.getFriendLinks();
  }
}
