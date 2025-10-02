// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ProductDetailService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取商品完整详情
   * @param productId 商品ID
   * @returns 完整的商品详情数据
   */
  async getProductDetail(productId: number) {
    // 获取商品基本信息
    const product = await this.prisma.product.findFirst({
      where: { product_id: productId },
    });

    if (!product) {
      throw new Error("商品不存在");
    }

    // 并行获取所有相关数据
    const [
      descArr,
      skuList,
      picList,
      videoList,
      attrList,
      rankDetail,
      seckillDetail,
      serviceList,
      checkedValue,
      consultationTotal,
    ] = await Promise.all([
      this.getProductDescArr(product.product_desc),
      this.getSkuList(productId),
      this.getProductGalleryList(productId),
      this.getVideoList(productId),
      this.getAttrList(productId),
      this.getProductCommentRankDetail(productId),
      this.getSeckillInfo(productId),
      this.getServiceList(productId),
      this.getSelectValue(null),
      this.getConsultationCount(productId),
    ]);

    // 对齐PHP版本与前端期望的响应数据结构（item 使用 camelCase）
    return {
      // 商品基本信息 - 对齐PHP的item字段（camelCase + 类型对齐）
      item: {
        productId: product.product_id,
        productName: product.product_name,
        productSn: product.product_sn,
        productTsn: product.product_tsn ?? "0",
        productDesc: product.product_desc ?? "",
        productPrice: this.toMoneyString(product.product_price),
        marketPrice: this.toMoneyString(product.market_price),
        productStock: product.product_stock ?? 0,
        productStatus: product.product_status ?? 1,
        productType: this.toNumberFlag(product.product_type, 1),
        categoryId: product.category_id ?? 0,
        brandId: product.brand_id ?? 0,
        shopId: product.shop_id ?? 0,
        keywords: product.keywords ?? "",
        shopCategoryId: product.shop_category_id ?? 0,
        checkStatus: product.check_status ?? 1,
        checkReason: product.check_reason ?? "",
        clickCount: product.click_count ?? 0,
        productWeight: this.toWeightString(product.product_weight),
        isPromote: product.is_promote ?? 0,
        isPromoteActivity: product.is_promote_activity ? 1 : 0,
        promotePrice: this.toMoneyString(product.promote_price),
        promoteStartDate: this.toDateTime(product.promote_start_date),
        promoteEndDate: this.toDateTime(product.promote_end_date),
        seckillMaxNum: product.seckill_max_num ?? 0,
        productBrief: product.product_brief ?? "",
        shippingTplId: product.shipping_tpl_id ?? 0,
        picUrl: product.pic_url ?? "",
        picThumb: product.pic_thumb ?? "",
        picOriginal: product.pic_original ?? "",
        commentTag: product.comment_tag ?? "",
        freeShipping: product.free_shipping ?? 0,
        integral: product.integral ?? 0,
        addTime: product.add_time ?? 0,
        sortOrder: product.sort_order ?? 100,
        storeSortOrder: product.store_sort_order ?? 100,
        isDelete: product.is_delete ?? 0,
        isBest: product.is_best ?? 0,
        isNew: product.is_new ?? 0,
        isHot: product.is_hot ?? 0,
        lastUpdate: product.last_update ?? 0,
        remark: product.remark ?? "",
        giveIntegral: product.give_integral ?? -1,
        rankIntegral: product.rank_integral ?? -1,
        suppliersId: product.suppliers_id ?? 0,
        virtualSales: product.virtual_sales ?? 0,
        limitNumber: product.limit_number ?? 0,
        productCare: product.product_care ?? "",
        productRelated: product.product_related ?? null,
        productServiceIds: product.product_service_ids ?? "",
        isSupportReturn: product.is_support_return ?? 0,
        isSupportCod: product.is_support_cod ?? 1,
        productVideo: product.product_video ?? "",
        prepayPrice: this.toMoneyString(product.prepay_price ?? 0),
        cardGroupId: product.card_group_id ?? 0,
        virtualSample: product.virtual_sample ?? "",
        paidContent: product.paid_content ?? "",
        noShipping: product.no_shipping ?? 0,
        fixedShippingType: product.fixed_shipping_type ?? 2,
        fixedShippingFee: this.toMoneyString(product.fixed_shipping_fee ?? 0),
        vendorProductId: product.vendor_product_id ?? null,
        vendorId: product.vendor_id ?? null,
        // 兼容前端使用的扩展字段
        isBuy: 1,
        isSeckill: 0,
        shopPickupTplId: null,
        isShopPickup: 0,
        isLogistics: 1,
        isShopDelivery: 0,
        eCardGroup: null,
      },
      // 商品描述数组 - 对齐PHP的descArr字段
      descArr,
      // SKU列表 - 对齐PHP的skuList字段
      skuList,
      // 商品图片列表 - 对齐PHP的picList字段
      picList,
      // 视频列表 - 对齐PHP的videoList字段
      videoList,
      // 属性列表 - 对齐PHP的attrList字段
      attrList,
      // 评论评分详情 - 对齐PHP的rankDetail字段
      rankDetail,
      // 秒杀信息 - 对齐PHP的seckillDetail字段
      seckillDetail,
      // 服务列表 - 对齐PHP的serviceList字段
      serviceList,
      // 选中的属性值 - 对齐PHP的checkedValue字段
      checkedValue,
      // 咨询总数 - 对齐PHP的consultationTotal字段
      consultationTotal,
    };
  }

  // 将 Decimal/number 转换为金额字符串，保留两位小数
  private toMoneyString(value: any): string {
    try {
      if (value === null || value === undefined) return "0.00";
      const num = typeof value === "string" ? Number(value) : Number(value?.toString?.() ?? value);
      if (Number.isNaN(num)) return "0.00";
      return num.toFixed(2);
    } catch {
      return "0.00";
    }
  }

  // 将 Decimal/number 转换为重量字符串，保留三位小数
  private toWeightString(value: any): string {
    try {
      if (value === null || value === undefined) return "0.000";
      const num = typeof value === "string" ? Number(value) : Number(value?.toString?.() ?? value);
      if (Number.isNaN(num)) return "0.000";
      return num.toFixed(3);
    } catch {
      return "0.000";
    }
  }

  // 将布尔/可选字段转为数值标记，默认 defaultVal
  private toNumberFlag(val: any, defaultVal = 0): number {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === "boolean") return val ? 1 : 0;
    const n = Number(val);
    return Number.isNaN(n) ? defaultVal : n;
  }

  // 将Unix秒时间戳转为 "YYYY-MM-DD HH:mm:ss" 字符串
  private toDateTime(ts: any): string {
    try {
      const n = Number(ts);
      if (!n) return "";
      const d = new Date(n * 1000);
      const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);
      const yyyy = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
    } catch {
      return "";
    }
  }

  /**
   * 处理商品描述数组
   * @param html 商品描述HTML
   * @returns 描述数组
   */
  async getProductDescArr(html: string | null): Promise<any[]> {
    if (!html) {
      return [];
    }

    // 使用 <div data-division=1></div> 分割HTML
    const divider = "<div data-division=1></div>";
    const parts = html.split(divider);

    const descArr: any[] = [];

    for (const part of parts) {
      if (!part.trim()) continue;

      // 检查是否包含图片
      const imgMatch = part.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch) {
        descArr.push({
          type: "pic",
          html: part,
          pic: imgMatch[1],
        });
      } else {
        descArr.push({
          type: "text",
          html: part,
        });
      }
    }

    return descArr;
  }

  /**
   * 获取SKU列表
   * @param productId 商品ID
   * @returns SKU列表
   */
  async getSkuList(productId: number): Promise<any[]> {
    // 检查product_sku表是否存在
    try {
      const skuList = await this.prisma.product_sku.findMany({
        where: { product_id: productId },
        orderBy: { sku_id: "asc" },
      });

      return skuList.map((sku) => ({
        skuId: sku.sku_id,
        productId: sku.product_id,
        skuSn: sku.sku_sn,
        skuTsn: sku.sku_tsn,
        skuPrice: sku.sku_price,
        skuStock: sku.sku_stock,
        skuValue: sku.sku_value,
        skuData: sku.sku_data,
        vendorProductSkuId: sku.vendor_product_sku_id,
      }));
    } catch (error) {
      // 如果表不存在，返回空数组
      return [];
    }
  }

  /**
   * 获取商品图片列表
   * @param productId 商品ID
   * @returns 图片列表
   */
  async getProductGalleryList(productId: number): Promise<any[]> {
    try {
      const galleryList = await this.prisma.product_gallery.findMany({
        where: { product_id: productId },
        orderBy: { sort_order: "asc" },
      });

      return galleryList.map((gallery) => ({
        picId: gallery.pic_id,
        productId: gallery.product_id,
        picUrl: gallery.pic_url,
        picDesc: gallery.pic_desc,
        picThumb: gallery.pic_thumb,
        // 与期望保持一致：返回 800x800 的大图地址
        picLarge: gallery.pic_large || gallery.pic_original,
        sortOrder: gallery.sort_order,
      }));
    } catch (error) {
      // 如果表不存在，返回空数组
      return [];
    }
  }

  /**
   * 获取视频列表
   * @param productId 商品ID
   * @returns 视频列表
   */
  async getVideoList(productId: number): Promise<any[]> {
    // 如果商品有视频，返回视频信息
    const product = await this.prisma.product.findFirst({
      where: { product_id: productId },
      select: { product_video: true },
    });

    if (!product?.product_video) {
      return [];
    }

    // 这里可以进一步解析视频信息，暂时返回基础信息
    return [
      {
        videoId: productId,
        productId: productId,
        videoUrl: product.product_video,
        videoCover: null,
        videoDesc: "",
        sortOrder: 1,
      },
    ];
  }

  /**
   * 获取属性列表
   * @param productId 商品ID
   * @returns 属性列表
   */
  async getAttrList(productId: number): Promise<any> {
    try {
      const attributes = await this.prisma.product_attributes.findMany({
        where: { product_id: productId },
        orderBy: { attributes_id: "asc" },
      });

      // 按属性名称分组
      const attrMap = new Map<string, any[]>();

      for (const attr of attributes) {
        const attrName = attr.attr_name;
        if (!attrMap.has(attrName)) {
          attrMap.set(attrName, []);
        }

        attrMap.get(attrName)?.push({
          attributesId: attr.attributes_id,
          productId: attr.product_id,
          attrType: attr.attr_type,
          attrName: attr.attr_name,
          attrValue: attr.attr_value,
          // 按两位小数的字符串返回
          attrPrice: this.toMoneyString(attr.attr_price ?? 0),
          attrColor: attr.attr_color,
          attrPic: attr.attr_pic,
          attrPicThumb: attr.attr_pic_thumb,
        });
      }

      // 转换为目标格式
      const result: any = {
        normal: [],
        spe: [],
        extra: [],
      };

      for (const [attrName, attrList] of attrMap.entries()) {
        const group = {
          attrName,
          attrList,
        };

        // 根据属性类型分组
        if (attrList[0]?.attr_type === 0) {
          result.normal.push(group);
        } else if (attrList[0]?.attr_type === 1) {
          result.spe.push(group);
        } else {
          result.extra.push(group);
        }
      }

      return result;
    } catch (error) {
      // 如果表不存在，返回空结构
      return { normal: [], spe: [], extra: [] };
    }
  }

  /**
   * 获取商品评论评分详情
   * @param productId 商品ID
   * @returns 评分详情
   */
  async getProductCommentRankDetail(productId: number): Promise<any> {
    try {
      const comments = await this.prisma.comment.findMany({
        where: {
          product_id: productId,
          status: 1, // 已审核
        },
      });

      const total = comments.length;
      let totalRank = 0;
      let goodCount = 0;

      for (const comment of comments) {
        totalRank += comment.comment_rank;
        if (comment.comment_rank >= 4) {
          goodCount++;
        }
      }

      return {
        total,
        averageRank: total > 0 ? (totalRank / total).toFixed(1) : 0,
        goodPercent: total > 0 ? Math.round((goodCount / total) * 100) : 0,
      };
    } catch (error) {
      return {
        total: 0,
        averageRank: 0,
        goodPercent: 0,
      };
    }
  }

  /**
   * 获取秒杀信息
   * @param productId 商品ID
   * @returns 秒杀信息
   */
  async getSeckillInfo(productId: number): Promise<any[]> {
    try {
      // 查找当前商品参与的秒杀活动
      const now = Math.floor(Date.now() / 1000);

      // 查找进行中或即将开始的秒杀活动
      // 先查找seckill_item表（这个表包含具体的商品秒杀信息）
      const seckillItems = await this.prisma.seckill_item.findMany({
        where: {
          product_id: productId,
          OR: [
            {
              seckill_start_time: { lte: now },
              seckill_end_time: { gte: now },
            },
            {
              seckill_start_time: { gt: now },
            },
          ],
        },
      });

      if (seckillItems.length === 0) {
        return [];
      }

      // 获取当前最合适的秒杀活动（优先进行中的）
      const activeSeckill =
        seckillItems.find(
          (item) =>
            item.seckill_start_time &&
            item.seckill_end_time &&
            item.seckill_start_time <= now &&
            item.seckill_end_time >= now,
        ) || seckillItems[0];

      const seckillDetail = {
        seckillId: activeSeckill.seckill_id,
        seckillName: `秒杀活动-${activeSeckill.seckill_id}`,
        seckillPrice: activeSeckill.seckill_price,
        seckillStock: activeSeckill.seckill_stock,
        seckillSales: activeSeckill.seckill_sales || 0,
        seckillLimitNum: activeSeckill.seckill_limit_num || 0,
        seckillStartTime: activeSeckill.seckill_start_time,
        seckillEndTime: activeSeckill.seckill_end_time,
        status: this.getSeckillStatus(
          activeSeckill.seckill_start_time,
          activeSeckill.seckill_end_time,
          now,
        ),
      };

      return [seckillDetail];
    } catch (error) {
      console.error("获取秒杀信息失败:", error);
      return [];
    }
  }

  /**
   * 获取秒杀状态
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @param currentTime 当前时间
   * @returns 秒杀状态
   */
  private getSeckillStatus(
    startTime: number,
    endTime: number,
    currentTime: number,
  ): number {
    if (currentTime < startTime) {
      return 0; // 未开始
    } else if (currentTime >= startTime && currentTime < endTime) {
      return 1; // 进行中
    } else {
      return 2; // 已结束
    }
  }

  /**
   * 获取服务列表
   * @param productId 商品ID
   * @returns 服务列表
   */
  async getServiceList(productId: number): Promise<any[]> {
    // 暂时返回空数组，后续可以实现服务功能
    return [];
  }

  /**
   * 获取选中的属性值
   * @param skuId SKU ID
   * @returns 选中的属性值
   */
  async getSelectValue(skuId: number | null): Promise<any[]> {
    // 暂时返回空数组
    return [];
  }

  /**
   * 获取咨询总数
   * @param productId 商品ID
   * @returns 咨询总数
   */
  async getConsultationCount(productId: number): Promise<number> {
    // 暂时返回0，后续可以实现咨询功能
    return 0;
  }
}
