// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UserDecorateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取开屏广告
   */
  async getOpenAdvertising(platform: string = "h5", position: string = "open") {
    try {
      // Based on the frontend code analysis, the expected response format should be:
      // {
      //   state: number,           // 0: disabled, 1: enabled
      //   materialType: number,   // 0: image, 1: video
      //   materialImg: string,    // image URL when materialType is 0
      //   materialVideo: string,  // video URL when materialType is 1
      //   maxWaitTime: number,    // maximum wait time in seconds
      //   redirectType: string,   // "0": no redirect, "1": redirect
      //   redirectUrl: string     // URL to redirect to when redirectType is "1"
      // }

      // For now, return disabled state as the advertisement models don't exist in the schema
      // This matches the expected format from the frontend code
      return {
        state: 0,
        materialType: 0,
        materialImg: "",
        materialVideo: "",
        maxWaitTime: 3,
        redirectType: "0",
        redirectUrl: "",
      };
    } catch (error) {
      console.error("获取开屏广告失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取轮播图
   */
  async getBanner(platform: string = "h5", position: string = "home") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array
      return [];
    } catch (error) {
      console.error("获取轮播图失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取导航菜单
   */
  async getNavigation(platform: string = "h5", position: string = "bottom") {
    try {
      const navigation = await this.prisma.navigation.findMany({
        where: {
          platform: platform,
          position: position,
          status: 1,
        },
        orderBy: {
          sort: "asc",
        },
      });

      return navigation.map((nav) => ({
        id: nav.id,
        name: nav.name,
        icon: nav.icon,
        link_url: nav.link_url,
        sort: nav.sort,
      }));
    } catch (error) {
      console.error("获取导航菜单失败:", error);
      // 如果navigation表不存在或出错，返回默认导航数据
      return [
        {
          id: 1,
          name: "首页",
          icon: "/images/nav/home.png",
          link_url: "/pages/index/index",
          sort: 1,
        },
        {
          id: 2,
          name: "分类",
          icon: "/images/nav/category.png",
          link_url: "/pages/category/index",
          sort: 2,
        },
        {
          id: 3,
          name: "购物车",
          icon: "/images/nav/cart.png",
          link_url: "/pages/cart/index",
          sort: 3,
        },
        {
          id: 4,
          name: "我的",
          icon: "/images/nav/user.png",
          link_url: "/pages/user/index",
          sort: 4,
        },
      ];
    }
  }

  /**
   * 获取浮动广告
   */
  async getFloatAd(platform: string = "h5", position: string = "float") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array
      return [];
    } catch (error) {
      console.error("获取浮动广告失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取弹窗广告
   */
  async getPopupAd(platform: string = "h5", position: string = "popup") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array
      return [];
    } catch (error) {
      console.error("获取弹窗广告失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取首页装修配置
   */
  async getHomePage(platform: string = "h5") {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          type: "home",
          platform: platform,
          status: 1,
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      if (!decorate) {
        return {
          components: [],
        };
      }

      return {
        id: decorate.id,
        name: decorate.name,
        config: decorate.config,
        components: decorate.components,
      };
    } catch (error) {
      console.error("获取首页装修配置失败:", error);
      // 如果decorate表不存在或出错，返回默认首页配置
      return {
        components: [
          {
            type: "search",
            id: "search-1",
            config: {
              placeholder: "搜索商品",
              backgroundColor: "#ffffff",
            },
          },
          {
            type: "banner",
            id: "banner-1",
            config: {
              images: ["/images/banner1.jpg", "/images/banner2.jpg"],
              autoPlay: true,
              interval: 3000,
            },
          },
          {
            type: "nav",
            id: "nav-1",
            config: {
              columns: 4,
              items: [
                {
                  name: "新品",
                  icon: "/images/nav/new.png",
                  url: "/pages/list/new",
                },
                {
                  name: "热卖",
                  icon: "/images/nav/hot.png",
                  url: "/pages/list/hot",
                },
                {
                  name: "优惠",
                  icon: "/images/nav/sale.png",
                  url: "/pages/list/sale",
                },
                {
                  name: "品牌",
                  icon: "/images/nav/brand.png",
                  url: "/pages/list/brand",
                },
              ],
            },
          },
        ],
      };
    }
  }

  /**
   * 获取分类页装修配置
   */
  async getCategoryPage(platform: string = "h5") {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          type: "category",
          platform: platform,
          status: 1,
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      return decorate
        ? {
            id: decorate.id,
            config: decorate.config,
            components: decorate.components,
          }
        : { components: [] };
    } catch (error) {
      console.error("获取分类页装修配置失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取购物车页装修配置
   */
  async getCartPage(platform: string = "h5") {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          type: "cart",
          platform: platform,
          status: 1,
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      return decorate
        ? {
            id: decorate.id,
            config: decorate.config,
            components: decorate.components,
          }
        : { components: [] };
    } catch (error) {
      console.error("获取购物车页装修配置失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取用户中心页装修配置
   */
  async getUserPage(platform: string = "h5") {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          type: "user",
          platform: platform,
          status: 1,
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      return decorate
        ? {
            id: decorate.id,
            config: decorate.config,
            components: decorate.components,
          }
        : { components: [] };
    } catch (error) {
      console.error("获取用户中心页装修配置失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 获取商品详情页装修配置
   */
  async getProductPage(platform: string = "h5") {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          type: "product",
          platform: platform,
          status: 1,
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      return decorate
        ? {
            id: decorate.id,
            config: decorate.config,
            components: decorate.components,
          }
        : { components: [] };
    } catch (error) {
      console.error("获取商品详情页装修配置失败:", error);
      throw new Error("获取失败");
    }
  }

  /**
   * 跟踪广告点击
   */
  async trackAdClick(
    userId: number,
    body: { adId: number; adType: string; position: string },
  ) {
    try {
      await this.prisma.adStatistics.create({
        data: {
          ad_id: body.adId,
          user_id: userId,
          action_type: "click",
          ad_type: body.adType,
          position: body.position,
          ip_address: "unknown", // 可以从请求中获取真实IP
          user_agent: "unknown", // 可以从请求中获取User-Agent
        },
      });

      return null; // 成功返回null，由拦截器包装
    } catch (error) {
      console.error("跟踪广告点击失败:", error);
      throw new Error("记录失败");
    }
  }

  /**
   * 跟踪广告曝光
   */
  async trackAdView(body: { adId: number; adType: string; position: string }) {
    try {
      await this.prisma.adStatistics.create({
        data: {
          ad_id: body.adId,
          action_type: "view",
          ad_type: body.adType,
          position: body.position,
          ip_address: "unknown",
          user_agent: "unknown",
        },
      });

      return null; // 成功返回null，由拦截器包装
    } catch (error) {
      console.error("跟踪广告曝光失败:", error);
      throw new Error("记录失败");
    }
  }
}
