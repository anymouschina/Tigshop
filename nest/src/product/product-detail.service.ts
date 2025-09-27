// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
      throw new Error('商品不存在');
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

    return {
      item: product,
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
    };
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
    const divider = '<div data-division=1></div>';
    const parts = html.split(divider);

    const descArr: any[] = [];

    for (const part of parts) {
      if (!part.trim()) continue;

      // 检查是否包含图片
      const imgMatch = part.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch) {
        descArr.push({
          type: 'pic',
          html: part,
          pic: imgMatch[1],
        });
      } else {
        descArr.push({
          type: 'text',
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
        orderBy: { sku_id: 'asc' },
      });

      return skuList.map(sku => ({
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
        orderBy: { sort_order: 'asc' },
      });

      return galleryList.map(gallery => ({
        picId: gallery.pic_id,
        productId: gallery.product_id,
        picUrl: gallery.pic_url,
        picDesc: gallery.pic_desc,
        picThumb: gallery.pic_thumb,
        picLarge: gallery.pic_original, // 修正字段名
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
    return [{
      videoId: productId,
      productId: productId,
      videoUrl: product.product_video,
      videoCover: null,
      videoDesc: '',
      sortOrder: 1,
    }];
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
        orderBy: { attributes_id: 'asc' },
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
          attrPrice: attr.attr_price,
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
    // 暂时返回空数组，后续可以实现秒杀功能
    return [];
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