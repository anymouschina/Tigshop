// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class UserDecorateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取开屏广告
   */
  async getOpenAdvertising(platform: string = "h5", position: string = "open") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array with proper structure
      // This can be enhanced later when the advertisement model is added to the schema
      return {
        code: 0,
        data: [],
        message: "success",
      };
    } catch (error) {
      console.error("获取开屏广告失败:", error);
      return {
        code: 500,
        data: [],
        message: "获取失败",
      };
    }
  }

  /**
   * 获取轮播图
   */
  async getBanner(platform: string = "h5", position: string = "home") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array with proper structure
      return {
        code: 0,
        data: [],
        message: "success",
      };
    } catch (error) {
      console.error("获取轮播图失败:", error);
      return {
        code: 500,
        data: [],
        message: "获取失败",
      };
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

      return {
        code: 0,
        data: navigation.map(nav => ({
          id: nav.id,
          name: nav.name,
          icon: nav.icon,
          link_url: nav.link_url,
          sort: nav.sort,
        })),
        message: "success",
      };
    } catch (error) {
      console.error("获取导航菜单失败:", error);
      return {
        code: 500,
        data: [],
        message: "获取失败",
      };
    }
  }

  /**
   * 获取浮动广告
   */
  async getFloatAd(platform: string = "h5", position: string = "float") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array with proper structure
      return {
        code: 0,
        data: [],
        message: "success",
      };
    } catch (error) {
      console.error("获取浮动广告失败:", error);
      return {
        code: 500,
        data: [],
        message: "获取失败",
      };
    }
  }

  /**
   * 获取弹窗广告
   */
  async getPopupAd(platform: string = "h5", position: string = "popup") {
    try {
      // Since advertisement model doesn't exist in schema, return empty array with proper structure
      return {
        code: 0,
        data: [],
        message: "success",
      };
    } catch (error) {
      console.error("获取弹窗广告失败:", error);
      return {
        code: 500,
        data: [],
        message: "获取失败",
      };
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
          code: 0,
          data: {
            components: [],
          },
          message: "success",
        };
      }

      return {
        code: 0,
        data: {
          id: decorate.id,
          name: decorate.name,
          config: decorate.config,
          components: decorate.components,
        },
        message: "success",
      };
    } catch (error) {
      console.error("获取首页装修配置失败:", error);
      return {
        code: 500,
        data: null,
        message: "获取失败",
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

      return {
        code: 0,
        data: decorate ? {
          id: decorate.id,
          config: decorate.config,
          components: decorate.components,
        } : { components: [] },
        message: "success",
      };
    } catch (error) {
      console.error("获取分类页装修配置失败:", error);
      return {
        code: 500,
        data: null,
        message: "获取失败",
      };
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

      return {
        code: 0,
        data: decorate ? {
          id: decorate.id,
          config: decorate.config,
          components: decorate.components,
        } : { components: [] },
        message: "success",
      };
    } catch (error) {
      console.error("获取购物车页装修配置失败:", error);
      return {
        code: 500,
        data: null,
        message: "获取失败",
      };
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

      return {
        code: 0,
        data: decorate ? {
          id: decorate.id,
          config: decorate.config,
          components: decorate.components,
        } : { components: [] },
        message: "success",
      };
    } catch (error) {
      console.error("获取用户中心页装修配置失败:", error);
      return {
        code: 500,
        data: null,
        message: "获取失败",
      };
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

      return {
        code: 0,
        data: decorate ? {
          id: decorate.id,
          config: decorate.config,
          components: decorate.components,
        } : { components: [] },
        message: "success",
      };
    } catch (error) {
      console.error("获取商品详情页装修配置失败:", error);
      return {
        code: 500,
        data: null,
        message: "获取失败",
      };
    }
  }

  /**
   * 跟踪广告点击
   */
  async trackAdClick(userId: number, body: { adId: number; adType: string; position: string }) {
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

      return {
        code: 0,
        data: null,
        message: "success",
      };
    } catch (error) {
      console.error("跟踪广告点击失败:", error);
      return {
        code: 500,
        data: null,
        message: "记录失败",
      };
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

      return {
        code: 0,
        data: null,
        message: "success",
      };
    } catch (error) {
      console.error("跟踪广告曝光失败:", error);
      return {
        code: 500,
        data: null,
        message: "记录失败",
      };
    }
  }
}