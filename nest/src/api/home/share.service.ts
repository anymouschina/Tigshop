// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  ShareProductDto,
  ShareOrderDto,
  ShareShopDto,
  GenerateShareDto,
  ShareStatsDto,
} from "./dto/share.dto";

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async generateProductShare(query: ShareProductDto) {
    const { product_id, channel = "wechat" } = query;

    // 验证商品是否存在
    const product = await this.prisma.product.findFirst({
      where: {
        product_id,
        is_show: 1,
        is_delete: 0,
      },
      include: {
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
        category: {
          select: {
            category_id: true,
            category_name: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("商品不存在或已下架");
    }

    // 生成分享链接
    const shareUrl = this.generateShareUrl("product", product_id, channel);
    const shareCode = this.generateShareCode();

    // 创建分享记录
    const share = await this.prisma.share.create({
      data: {
        share_code: shareCode,
        share_type: "product",
        target_id: product_id,
        channel,
        share_url: shareUrl,
        title: product.product_name,
        description: product.brief || `推荐商品：${product.product_name}`,
        image: product.image,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 生成分享内容
    const shareContent = this.generateProductShareContent(
      product,
      shareUrl,
      channel,
    );

    return {
      code: 200,
      message: "生成成功",
      data: {
        share_id: share.share_id,
        share_code: shareCode,
        share_url: shareUrl,
        title: shareContent.title,
        description: shareContent.description,
        image: shareContent.image,
        content: shareContent.content,
        qrcode_url: `${shareUrl}&qrcode=1`,
      },
    };
  }

  async generateOrderShare(query: ShareOrderDto) {
    const { order_id, channel = "wechat" } = query;

    // 验证订单是否存在
    const order = await this.prisma.order.findFirst({
      where: { order_id, is_delete: 0 },
      include: {
        order_items: {
          include: {
            product: {
              select: {
                product_id: true,
                product_name: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("订单不存在");
    }

    // 生成分享链接
    const shareUrl = this.generateShareUrl("order", order_id, channel);
    const shareCode = this.generateShareCode();

    // 创建分享记录
    const share = await this.prisma.share.create({
      data: {
        share_code: shareCode,
        share_type: "order",
        target_id: order_id,
        channel,
        share_url: shareUrl,
        title: `我的订单：${order.order_sn}`,
        description: `分享我的购物体验`,
        image: order.order_items[0]?.product.image || "",
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 生成分享内容
    const shareContent = this.generateOrderShareContent(
      order,
      shareUrl,
      channel,
    );

    return {
      code: 200,
      message: "生成成功",
      data: {
        share_id: share.share_id,
        share_code: shareCode,
        share_url: shareUrl,
        title: shareContent.title,
        description: shareContent.description,
        image: shareContent.image,
        content: shareContent.content,
        qrcode_url: `${shareUrl}&qrcode=1`,
      },
    };
  }

  async generateShopShare(query: ShareShopDto) {
    const { shop_id, channel = "wechat" } = query;

    // 验证店铺是否存在
    const shop = await this.prisma.shop.findFirst({
      where: { shop_id, status: 1, is_delete: 0 },
    });

    if (!shop) {
      throw new Error("店铺不存在或已关闭");
    }

    // 生成分享链接
    const shareUrl = this.generateShareUrl("shop", shop_id, channel);
    const shareCode = this.generateShareCode();

    // 创建分享记录
    const share = await this.prisma.share.create({
      data: {
        share_code: shareCode,
        share_type: "shop",
        target_id: shop_id,
        channel,
        share_url: shareUrl,
        title: shop.shop_name,
        description: shop.description || `推荐店铺：${shop.shop_name}`,
        image: shop.shop_logo,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 生成分享内容
    const shareContent = this.generateShopShareContent(shop, shareUrl, channel);

    return {
      code: 200,
      message: "生成成功",
      data: {
        share_id: share.share_id,
        share_code: shareCode,
        share_url: shareUrl,
        title: shareContent.title,
        description: shareContent.description,
        image: shareContent.image,
        content: shareContent.content,
        qrcode_url: `${shareUrl}&qrcode=1`,
      },
    };
  }

  async generateShareContent(body: GenerateShareDto) {
    const { type, target_id, channel = "wechat", custom_content } = body;

    let shareData;
    switch (type) {
      case "product":
        shareData = await this.getProductShareData(target_id);
        break;
      case "order":
        shareData = await this.getOrderShareData(target_id);
        break;
      case "shop":
        shareData = await this.getShopShareData(target_id);
        break;
      default:
        throw new Error("不支持的分享类型");
    }

    const shareUrl = this.generateShareUrl(type, target_id, channel);
    const shareCode = this.generateShareCode();

    // 创建分享记录
    const share = await this.prisma.share.create({
      data: {
        share_code: shareCode,
        share_type: type,
        target_id,
        channel,
        share_url: shareUrl,
        title: custom_content?.title || shareData.title,
        description: custom_content?.description || shareData.description,
        image: custom_content?.image || shareData.image,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "生成成功",
      data: {
        share_id: share.share_id,
        share_code: shareCode,
        share_url: shareUrl,
        ...shareData,
      },
    };
  }

  async getShareStats(shareId: number) {
    const share = await this.prisma.share.findFirst({
      where: { share_id: shareId },
      include: {
        share_logs: true,
      },
    });

    if (!share) {
      throw new Error("分享记录不存在");
    }

    const stats = {
      share_id: share.share_id,
      view_count: share.share_logs.filter((log) => log.action === "view")
        .length,
      click_count: share.share_logs.filter((log) => log.action === "click")
        .length,
      share_count: share.share_logs.filter((log) => log.action === "share")
        .length,
      register_count: share.share_logs.filter(
        (log) => log.action === "register",
      ).length,
      order_count: share.share_logs.filter((log) => log.action === "order")
        .length,
      total_reward: share.share_logs
        .filter((log) => log.reward_amount > 0)
        .reduce((sum, log) => sum + log.reward_amount, 0),
    };

    return {
      code: 200,
      message: "获取成功",
      data: stats,
    };
  }

  async getUserShares(
    userId: number,
    query: { page?: number; size?: number; type?: string },
  ) {
    const { page = 1, size = 20, type } = query;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };
    if (type) {
      where.share_type = type;
    }

    const [shares, total] = await Promise.all([
      this.prisma.share.findMany({
        where,
        orderBy: { add_time: "desc" },
        skip,
        take: size,
      }),
      this.prisma.share.count({ where }),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records: shares,
        total,
        page,
        size,
      },
    };
  }

  async recordShareBehavior(body: { share_id: number; channel: string }) {
    const { share_id, channel } = body;

    await this.prisma.share_log.create({
      data: {
        share_id,
        action: "share",
        channel,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "记录成功",
      data: null,
    };
  }

  async getShareReward(userId: number) {
    const [totalReward, pendingReward, todayReward] = await Promise.all([
      this.prisma.share_log.aggregate({
        where: {
          share: { user_id: userId },
          reward_amount: { gt: 0 },
        },
        _sum: { reward_amount: true },
      }),
      this.prisma.share_log.aggregate({
        where: {
          share: { user_id: userId },
          reward_status: 0,
          reward_amount: { gt: 0 },
        },
        _sum: { reward_amount: true },
      }),
      this.prisma.share_log.aggregate({
        where: {
          share: { user_id: userId },
          reward_amount: { gt: 0 },
          add_time: {
            gte: Math.floor(Date.now() / 1000) - 86400,
          },
        },
        _sum: { reward_amount: true },
      }),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        total_reward: totalReward._sum.reward_amount || 0,
        pending_reward: pendingReward._sum.reward_amount || 0,
        today_reward: todayReward._sum.reward_amount || 0,
      },
    };
  }

  async generateShareQRCode(url: string, size: number = 200) {
    // 生成二维码（这里需要集成二维码生成库）
    const qrCodeUrl = `${url}&qrcode=1&size=${size}`;

    return {
      code: 200,
      message: "生成成功",
      data: {
        qr_code_url: qrCodeUrl,
        size,
      },
    };
  }

  async getShareConfig() {
    const config = {
      channels: [
        { code: "wechat", name: "微信", icon: "wechat" },
        { code: "wechat_moments", name: "朋友圈", icon: "wechat-moments" },
        { code: "qq", name: "QQ", icon: "qq" },
        { code: "weibo", name: "微博", icon: "weibo" },
        { code: "douyin", name: "抖音", icon: "douyin" },
      ],
      rewards: {
        enabled: true,
        rules: [
          { action: "register", reward: 5, description: "用户注册奖励5积分" },
          { action: "order", reward: 10, description: "用户下单奖励10积分" },
        ],
      },
      templates: [
        {
          type: "product",
          title: "发现好物",
          description: "{product_name} 价格优惠，快来购买吧！",
        },
        {
          type: "shop",
          title: "推荐店铺",
          description: "{shop_name} 商品丰富，服务优质！",
        },
      ],
    };

    return {
      code: 200,
      message: "获取成功",
      data: config,
    };
  }

  async analyzeShareEffect(shareId: number) {
    const share = await this.prisma.share.findFirst({
      where: { share_id: shareId },
      include: {
        share_logs: {
          orderBy: { add_time: "asc" },
        },
      },
    });

    if (!share) {
      throw new Error("分享记录不存在");
    }

    const analysis = {
      share_id: share.share_id,
      total_logs: share.share_logs.length,
      unique_users: [...new Set(share.share_logs.map((log) => log.user_id))]
        .length,
      actions_by_day: this.groupLogsByDay(share.share_logs),
      conversion_rate: this.calculateConversionRate(share.share_logs),
      top_channels: this.getTopChannels(share.share_logs),
    };

    return {
      code: 200,
      message: "分析成功",
      data: analysis,
    };
  }

  async getTrendingShares(limit: number = 10) {
    const shares = await this.prisma.share.findMany({
      where: {
        add_time: {
          gte: Math.floor(Date.now() / 1000) - 604800, // 7天内
        },
      },
      include: {
        share_logs: true,
      },
      orderBy: {
        share_logs: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return {
      code: 200,
      message: "获取成功",
      data: shares.map((share) => ({
        share_id: share.share_id,
        title: share.title,
        share_type: share.share_type,
        view_count: share.share_logs.filter((log) => log.action === "view")
          .length,
        share_count: share.share_logs.filter((log) => log.action === "share")
          .length,
      })),
    };
  }

  async getShareTemplates(type?: string) {
    const where: any = { status: 1 };
    if (type) {
      where.template_type = type;
    }

    const templates = await this.prisma.share_template.findMany({
      where,
      orderBy: { sort_order: "asc" },
    });

    return {
      code: 200,
      message: "获取成功",
      data: templates,
    };
  }

  // 私有方法
  private generateShareUrl(
    type: string,
    targetId: number,
    channel: string,
  ): string {
    const baseUrl =
      process.env.SHARE_BASE_URL || "https://yourdomain.com/share";
    return `${baseUrl}/${type}/${targetId}?channel=${channel}`;
  }

  private generateShareCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private generateProductShareContent(
    product: any,
    shareUrl: string,
    channel: string,
  ) {
    const channelTemplates = {
      wechat: {
        title: `🛒 ${product.product_name}`,
        description: `💰 价格：¥${product.price}\n🏪 店铺：${product.shop.shop_name}\n${product.brief || ""}`,
        content: `【好物推荐】\n${product.product_name}\n💰 特价：¥${product.price}\n👉 立即购买：${shareUrl}`,
      },
      wechat_moments: {
        title: `发现好物：${product.product_name}`,
        description: `价格：¥${product.price}，来自${product.shop.shop_name}`,
        content: `发现一个不错的商品：${product.product_name}，只要¥${product.price}！`,
      },
    };

    return channelTemplates[channel] || channelTemplates.wechat;
  }

  private generateOrderShareContent(
    order: any,
    shareUrl: string,
    channel: string,
  ) {
    const itemCount = order.order_items.length;
    const totalAmount = order.pay_amount;

    return {
      title: `我的购物分享`,
      description: `购买${itemCount}件商品，共计¥${totalAmount}`,
      image: order.order_items[0]?.product.image || "",
      content: `分享我的购物体验，${itemCount}件好物，共计¥${totalAmount}！`,
    };
  }

  private generateShopShareContent(
    shop: any,
    shareUrl: string,
    channel: string,
  ) {
    return {
      title: `推荐店铺：${shop.shop_name}`,
      description: shop.description || "优质店铺，值得信赖",
      image: shop.shop_logo,
      content: `推荐一个不错的店铺：${shop.shop_name}，商品丰富，服务优质！`,
    };
  }

  private async getProductShareData(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { product_id: productId },
      select: {
        product_name: true,
        brief: true,
        image: true,
        price: true,
      },
    });

    return {
      title: product?.product_name || "",
      description: product?.brief || "",
      image: product?.image || "",
    };
  }

  private async getOrderShareData(orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { order_id: orderId },
      select: {
        order_sn: true,
        pay_amount: true,
      },
    });

    return {
      title: `我的订单：${order?.order_sn || ""}`,
      description: `订单金额：¥${order?.pay_amount || 0}`,
      image: "",
    };
  }

  private async getShopShareData(shopId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: { shop_id: shopId },
      select: {
        shop_name: true,
        description: true,
        shop_logo: true,
      },
    });

    return {
      title: shop?.shop_name || "",
      description: shop?.description || "",
      image: shop?.shop_logo || "",
    };
  }

  private groupLogsByDay(logs: any[]) {
    const grouped = {};
    logs.forEach((log) => {
      const day = new Date(log.add_time * 1000).toISOString().split("T")[0];
      if (!grouped[day]) {
        grouped[day] = 0;
      }
      grouped[day]++;
    });
    return grouped;
  }

  private calculateConversionRate(logs: any[]) {
    const totalViews = logs.filter((log) => log.action === "view").length;
    const totalActions = logs.filter((log) =>
      ["register", "order"].includes(log.action),
    ).length;
    return totalViews > 0 ? (totalActions / totalViews) * 100 : 0;
  }

  private getTopChannels(logs: any[]) {
    const channelStats = {};
    logs.forEach((log) => {
      if (!channelStats[log.channel]) {
        channelStats[log.channel] = 0;
      }
      channelStats[log.channel]++;
    });
    return Object.entries(channelStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([channel, count]) => ({ channel, count }));
  }
}
