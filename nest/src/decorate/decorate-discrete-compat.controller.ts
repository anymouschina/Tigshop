// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 装修离散块(兼容)")
@Controller("adminapi/decorate/decorateDiscrete")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class DecorateDiscreteCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("detail")
  @ApiOperation({ summary: "获取离散装修片段详情（兼容）" })
  @Authorities("decorateDiscreteDetail")
  async detail(
    @Query("decorateSn") decorateSn: string,
    @Query("shopId") shopId?: number,
  ) {
    if (!decorateSn) {
      return { code: 0, message: "success", data: null };
    }
    const record = await this.prisma.decorate_discrete.findFirst({
      where: { decorate_sn: decorateSn, shop_id: Number(shopId) || 0 },
    });
    if (!record) return { code: 0, message: "success", data: null };
    let parsed: any = null;
    try {
      parsed = record.data ? JSON.parse(record.data) : null;
    } catch {
      parsed = record.data;
    }
    return {
      code: 0,
      message: "success",
      data: {
        id: record.id,
        decorateSn: record.decorate_sn,
        decorateName: record.decorate_name,
        data: parsed,
        shopId: record.shop_id,
      },
    };
  }

  @Get("memberDecorateData")
  @ApiOperation({ summary: "个人中心基础数据（兼容）" })
  @Authorities("decorateDiscreteManage")
  async memberDecorateData() {
    // 直接复用 PHP 的静态菜单结构（精简版），用于前端初始渲染
    const menus = [
      {
        type: "default",
        pic_title: "账号管理",
        pic_thumb: "https://oss.tigshop.com/static/user/zhanghaoguanli.png",
        pic_url: "https://oss.tigshop.com/static/user/zhanghaoguanli.png",
        pic_link: {
          path: "default",
          label: "账号管理",
          name: "账号管理",
          link: "/pages/user/profile/index",
        },
      },
      {
        type: "default",
        pic_title: "收货地址",
        pic_thumb: "https://oss.tigshop.com/static/user/shouhuodizhi.png",
        pic_url: "https://oss.tigshop.com/static/user/shouhuodizhi.png",
        pic_link: {
          path: "default",
          label: "收货地址",
          name: "收货地址",
          link: "/pages/address/list",
        },
      },
      {
        type: "default",
        pic_title: "商家入驻",
        pic_thumb: "https://oss.tigshop.com/static/user/shangjiaruzhu.png",
        pic_url: "https://oss.tigshop.com/static/user/shangjiaruzhu.png",
        pic_link: {
          path: "default",
          label: "商家入驻",
          name: "商家入驻",
          link: "/pages/user/merchantEnter/principalType",
        },
      },
      {
        type: "default",
        pic_title: "发票管理",
        pic_thumb: "https://oss.tigshop.com/static/user/fapiao.png",
        pic_url: "https://oss.tigshop.com/static/user/fapiao.png",
        pic_link: {
          path: "default",
          label: "发票管理",
          name: "发票管理",
          link: "/pages/user/invoiceManagement/index",
        },
      },
      {
        type: "default",
        pic_title: "站内消息",
        pic_thumb: "https://oss.tigshop.com/static/user/xiaoxi.png",
        pic_url: "https://oss.tigshop.com/static/user/xiaoxi.png",
        pic_link: {
          path: "default",
          label: "站内消息",
          name: "站内消息",
          link: "/pages/user/messageLog/index",
        },
      },
      {
        type: "default",
        pic_title: "帮助中心",
        pic_thumb: "https://oss.tigshop.com/static/user/issue.png",
        pic_url: "https://oss.tigshop.com/static/user/issue.png",
        pic_link: {
          path: "default",
          label: "帮助中心",
          name: "帮助中心",
          link: "/pages/article/issue/list",
        },
      },
      {
        type: "default",
        pic_title: "资讯中心",
        pic_thumb: "https://oss.tigshop.com/static/user/news.png",
        pic_url: "https://oss.tigshop.com/static/user/news.png",
        pic_link: {
          path: "default",
          label: "资讯中心",
          name: "资讯中心",
          link: "/pages/article/news/list?id=bzgg",
        },
      },
      {
        type: "default",
        pic_title: "分销员中心",
        pic_thumb: "https://oss.tigshop.com/static/user/salesmanIco.png",
        pic_url: "https://oss.tigshop.com/static/user/salesmanIco.png",
        pic_link: {
          path: "default",
          label: "分销员中心",
          name: "分销员中心",
          link: "/pages/salesman/index",
        },
      },
      {
        type: "default",
        pic_title: "积分商城",
        pic_thumb: "https://oss.tigshop.com/static/user/jifen.png",
        pic_url: "https://oss.tigshop.com/static/user/jifen.png",
        pic_link: {
          path: "default",
          label: "积分商城",
          name: "积分商城",
          link: "/pages/exchange/list",
        },
      },
      {
        type: "default",
        pic_title: "实名认证",
        pic_thumb: "https://oss.tigshop.com/static/user/realName.png",
        pic_url: "https://oss.tigshop.com/static/user/realName.png",
        pic_link: {
          path: "default",
          label: "实名认证",
          name: "实名认证",
          link: "/pages/user/userCertification/index",
        },
      },
    ];
    return { code: 0, message: "success", data: { menus } };
  }
}
