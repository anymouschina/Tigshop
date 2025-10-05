// @ts-nocheck
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { toMoneyString, toWeightString, toDateTime } from "src/common/utils/format";
import { CommentService } from "./comment/comment.service";

@Injectable()
export class ProductDetailService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CommentService)) private readonly commentService: CommentService,
  ) {}

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
      eCardGroup,
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
      this.getECardGroup(product.card_group_id ?? 0),
    ]);

    // 对齐PHP版本与前端期望的响应数据结构（item 使用 camelCase）
    const shopDataReal = await this.getShopBasic(product.shop_id ?? 0);
    return {
      // 商品基本信息 - 对齐PHP的item字段（camelCase + 类型对齐）
      item: {
        productId: product.product_id,
        productName: product.product_name,
        productSn: product.product_sn,
        productTsn: product.product_tsn ?? "0",
        productDesc: product.product_desc ?? "",
  productPrice: toMoneyString(product.product_price),
  marketPrice: toMoneyString(product.market_price),
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
  productWeight: toWeightString(product.product_weight),
        isPromote: product.is_promote ?? 0,
        isPromoteActivity: product.is_promote_activity ? 1 : 0,
  promotePrice: toMoneyString(product.promote_price),
  promoteStartDate: toDateTime(product.promote_start_date),
  promoteEndDate: toDateTime(product.promote_end_date),
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
  prepayPrice: toMoneyString(product.prepay_price ?? 0),
        cardGroupId: product.card_group_id ?? 0,
        virtualSample: product.virtual_sample ?? "",
        paidContent: product.paid_content ?? "",
        noShipping: product.no_shipping ?? 0,
        fixedShippingType: product.fixed_shipping_type ?? 2,
  fixedShippingFee: toMoneyString(product.fixed_shipping_fee ?? 0),
        vendorProductId: product.vendor_product_id ?? null,
        vendorId: product.vendor_id ?? null,
        // 兼容前端使用的扩展字段
        isBuy: 1,
        // 按秒杀详情的状态设置：有进行中(status=1)的活动则为 1
        isSeckill: Array.isArray(seckillDetail) && seckillDetail.some((s:any) => s?.status === 1) ? 1 : 0,
        shopPickupTplId: null,
        isShopPickup: 0,
        isLogistics: 1,
        isShopDelivery: 0,
        eCardGroup: eCardGroup,
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
      // 新增：店铺客服/联系方式（与订单详情结构部分对齐）
      shop: shopDataReal
        ? {
            shopId: shopDataReal.shop_id,
            shopTitle: shopDataReal.shop_title || "",
            kefuInlet: this.safeParseArray(shopDataReal.kefu_inlet),
            kefuLink: shopDataReal.kefu_link || "",
            kefuPhone: shopDataReal.kefu_phone || "",
          }
        : null,
      // 为前端快速访问（有些旧代码可能直接读顶层）再扁平提供一份（不影响已有字段）
      kefuInlet: shopDataReal ? this.safeParseArray(shopDataReal.kefu_inlet) : [],
      kefuLink: shopDataReal?.kefu_link || "",
      kefuPhone: shopDataReal?.kefu_phone || "",
    };
  }

  private async getShopBasic(shopId: number) {
    if (!shopId || shopId <= 0) return null;
    try {
      return await this.prisma.shop.findFirst({
        where: { shop_id: shopId },
        select: {
          shop_id: true,
          shop_title: true,
          kefu_inlet: true,
          kefu_link: true,
          kefu_phone: true,
        },
      });
    } catch (_) {
      return null;
    }
  }

  private safeParseArray(v: any) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try {
      const parsed = JSON.parse(String(v));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (typeof v === "string" && v.includes(",")) return v.split(",").map((x) => x.trim()).filter(Boolean);
      return [];
    }
  }

  // 将布尔/可选字段转为数值标记，默认 defaultVal
  private toNumberFlag(val: any, defaultVal = 0): number {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === "boolean") return val ? 1 : 0;
    const n = Number(val);
    return Number.isNaN(n) ? defaultVal : n;
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
          pic: imgMatch[1],
          html: part,
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

        const attrType = Number(attr.attr_type ?? 0);
        attrMap.get(attrName)?.push({
          attributesId: attr.attributes_id,
          productId: attr.product_id,
          attrType,
          attrName: attr.attr_name,
          attrValue: attr.attr_value,
          // 按两位小数的字符串返回
          attrPrice: toMoneyString(attr.attr_price ?? 0),
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
        const resolvedType = Number(attrList[0]?.attrType ?? 0);
        if (resolvedType === 0) {
          result.normal.push(group);
        } else if (resolvedType === 1) {
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
      const stats = await this.commentService.getCommentStats(Number(productId));
      const total = stats?.totalComments ?? 0;
      const goodCount = Array.isArray(stats?.ratingDistribution)
        ? (stats.ratingDistribution.find((r: any) => r.rating === 5)?.count || 0)
        : 0;
      const averageRank = stats?.averageRating ?? 0;
      const goodPercent = total > 0 ? Math.round((goodCount / total) * 100) : 0;
      return { total, averageRank, goodPercent };
    } catch (_) {
      return { total: 0, averageRank: 0, goodPercent: 0 };
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
    try {
      // 读取商品的服务ID串
      const product = await this.prisma.product.findFirst({
        where: { product_id: productId },
        select: { product_service_ids: true },
      });
      const idsStr = (product?.product_service_ids || "").trim();
      if (!idsStr) return [];
      const ids = idsStr
        .split(/[ ,]+/)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length === 0) return [];

      const rows = await this.prisma.product_services.findMany({
        where: { product_service_id: { in: ids } },
        select: {
          product_service_id: true,
          product_service_name: true,
          product_service_desc: true,
          ico_img: true,
          sort_order: true,
        },
        orderBy: { sort_order: "asc" },
      });

      // 返回与 admin 端一致的结构字段，便于前后端复用
      return rows.map((r: any) => ({
        productServiceId: r.product_service_id,
        productServiceName: r.product_service_name,
        productServiceDesc: r.product_service_desc,
        icoImg: r.ico_img || "",
        sortOrder: r.sort_order ?? 0,
      }));
    } catch (e) {
      return [];
    }
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

  /**
   * 获取电子卡券组信息
   * @param cardGroupId 组ID
   */
  private async getECardGroup(cardGroupId: number): Promise<any | null> {
    try {
      const id = Number(cardGroupId);
      if (!Number.isFinite(id) || id <= 0) return null;
      const g = await this.prisma.e_card_group.findFirst({
        where: { group_id: id },
        select: { group_id: true, group_name: true, is_use: true },
      });
      if (!g) return null;
      return {
        groupId: g.group_id,
        groupName: g.group_name,
        isUse: g.is_use,
      };
    } catch (_) {
      return null;
    }
  }
}
