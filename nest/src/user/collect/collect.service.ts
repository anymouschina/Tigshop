// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

import {
  CollectListDto,
  CreateCollectDto,
  UpdateCollectDto,
  DeleteCollectDto,
  BatchDeleteCollectDto,
  CollectProductDto,
  CheckCollectDto,
  CollectListResponse,
  CollectResponse,
  SuccessResponse,
  CheckCollectResponse,
  CollectType,
} from "./dto/collect.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class CollectService {
  constructor(private readonly databaseService: PrismaService) {}

  /**
   * 获取收藏列表 - 对齐PHP版本 user/collect/list
   */
  async getCollectList(
    userId: number,
    collectListDto: CollectListDto,
  ): Promise<CollectListResponse> {
    const {
      keyword = "",
      page = 1,
      size = 15,
      sort_field = "collect_id",
      sort_order = "desc",
      collect_type,
    } = collectListDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = { user_id: userId };

    // keyword与remark字段在收藏表中不存在，这里忽略关键字过滤

    // 选择收藏表
    const isShop = collect_type === CollectType.SHOP;
    const table = isShop ? "collect_shop" : "collect_product";

    const [collects, total] = await Promise.all([
      (this.databaseService as any)[table].findMany({
        where,
        skip,
        take: size,
        orderBy: { [sort_field]: sort_order },
      }),
      (this.databaseService as any)[table].count({ where }),
    ]);

    // 获取收藏的详细信息
    const detailedCollects = await Promise.all(
      collects.map(async (collect: any) => {
        if (isShop) {
          // 暂时不改动店铺收藏结构（若后续需要再补）
          return {
            collectId: collect.collect_id,
            userId,
            shopId: collect.shop_id,
            addTime: this.formatTime(collect.add_time),
          };
        }

        const product = await (this.databaseService as any).product.findFirst({
          where: { product_id: collect.product_id },
          select: {
            product_id: true,
            product_name: true,
            product_sn: true,
            pic_thumb: true,
            market_price: true,
            is_promote: true,
            product_price: true,
            product_stock: true,
            pic_url: true,
          },
        });

        // 用户信息（需要 username / rankId / discount 之类，这里最小化查询——如有折扣逻辑后续补充）
        const user = await (this.databaseService as any).user.findFirst({
          where: { user_id: userId },
          select: { username: true, rank_id: true },
        });

        // 价格统一转字符串（与期望示例保持："78.00"）
        const formatPrice = (p: any) => (p != null ? Number(p).toFixed(2) : "0.00");

        return {
          collectId: collect.collect_id,
          userId,
          productId: product?.product_id || collect.product_id,
          addTime: this.formatTime(collect.add_time),
          productName: product?.product_name || "",
            productSn: product?.product_sn || "",
          picThumb: product?.pic_thumb || "",
          marketPrice: formatPrice(product?.market_price),
          isPromote: product?.is_promote || 0,
          productPrice: formatPrice(product?.product_price),
          productStock: product?.product_stock || 0,
          picUrl: product?.pic_url || "",
          username: user?.username || "",
          rankId: user?.rank_id || 0,
          discount: "0.0", // TODO: 会员折扣逻辑后续接入
          skuPrice: null, // TODO: 如果需要展示最低 SKU 价，这里可扩展
          price: formatPrice(product?.product_price), // 同 productPrice
          productSku: [], // TODO: 后续可加载 sku 列表
        };
      }),
    );

    return { records: detailedCollects, total };
  }

  private formatTime(ts: number) {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const pad = (n: number) => (n < 10 ? "0" + n : String(n));
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * 收藏商品 - 对齐PHP版本 user/collect/save
   */
  async collectProduct(
    userId: number,
    collectProductDto: CollectProductDto,
  ): Promise<SuccessResponse> {
    // 兼容 product_id 与 productId 两种写法
    const product_id = (collectProductDto as any).product_id ?? (collectProductDto as any).productId;
    if (!product_id || isNaN(Number(product_id))) {
      throw new BadRequestException("商品ID不能为空");
    }

    // 检查商品是否存在
    const product = await (this.databaseService as any).product.findFirst({
      where: { product_id },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    // 检查是否已经收藏
    const existingCollect = await (
      this.databaseService as any
    ).collect_product.findFirst({
      where: {
        user_id: userId,
        product_id: product_id,
      },
    });

    if (existingCollect) {
      throw new ConflictException("商品已收藏");
    }

    // 创建收藏
    const newCollect = await (
      this.databaseService as any
    ).collect_product.create({
      data: {
        user_id: userId,
        product_id: product_id,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      message: "收藏成功",
      collect_id: newCollect.collect_id,
    };
  }

  /**
   * 取消收藏 - 对齐PHP版本 user/collect/cancel
   */
  async cancelCollect(
    userId: number,
    deleteCollectDto: DeleteCollectDto,
  ): Promise<SuccessResponse> {
    const { id, productId, product_id } = deleteCollectDto as any;

    let collectIdToDelete: number | undefined = id;

    // 如果未直接提供收藏ID，尝试通过商品ID查询
    if (!collectIdToDelete) {
      const resolvedProductId = productId ?? product_id;
      if (!resolvedProductId && resolvedProductId !== 0) {
        throw new NotFoundException("缺少取消收藏所需的参数 (id 或 productId)");
      }
      const existingByProduct = await (
        this.databaseService as any
      ).collect_product.findFirst({
        where: { user_id: userId, product_id: resolvedProductId },
      });
      if (!existingByProduct) {
        throw new NotFoundException("收藏不存在");
      }
      collectIdToDelete = existingByProduct.collect_id;
    }

    // 再次校验（防止传入他人收藏ID）
    const existingCollect = await (
      this.databaseService as any
    ).collect_product.findFirst({
      where: { collect_id: collectIdToDelete, user_id: userId },
    });
    if (!existingCollect) {
      throw new NotFoundException("收藏不存在");
    }

    await (this.databaseService as any).collect_product.delete({
      where: { collect_id: collectIdToDelete },
    });

    return {
      message: "取消收藏成功",
    };
  }

  /**
   * 创建收藏
   */
  async createCollect(
    userId: number,
    createCollectDto: CreateCollectDto,
  ): Promise<SuccessResponse> {
    const { collect_type, target_id, remark } = createCollectDto;

    // 检查目标是否存在
    await this.validateTargetExists(collect_type, target_id);

    // 检查是否已经收藏
    const table2 =
      collect_type === CollectType.SHOP ? "collect_shop" : "collect_product";
    const where2 =
      collect_type === CollectType.SHOP
        ? { user_id: userId, shop_id: target_id }
        : { user_id: userId, product_id: target_id };
    const existingCollect = await (this.databaseService as any)[
      table2
    ].findFirst({ where: where2 });

    if (existingCollect) {
      throw new ConflictException("已收藏该内容");
    }

    // 创建收藏
    const newCollect = await (this.databaseService as any)[table2].create({
      data:
        collect_type === CollectType.SHOP
          ? {
              user_id: userId,
              shop_id: target_id,
              add_time: Math.floor(Date.now() / 1000),
            }
          : {
              user_id: userId,
              product_id: target_id,
              add_time: Math.floor(Date.now() / 1000),
            },
    });

    return {
      message: "收藏成功",
      collect_id: newCollect.collect_id,
    };
  }

  /**
   * 更新收藏
   */
  async updateCollect(
    userId: number,
    updateCollectDto: UpdateCollectDto,
  ): Promise<SuccessResponse> {
    const { id, remark } = updateCollectDto;

    // 验证收藏是否存在
    const existingCollect = await (
      this.databaseService as any
    ).collect_product.findFirst({
      where: {
        collect_id: id,
        user_id: userId,
      },
    });

    if (!existingCollect) {
      throw new NotFoundException("收藏不存在");
    }

    // 更新收藏
    const updatedCollect = await (
      this.databaseService as any
    ).collect_product.update({
      where: { collect_id: id },
      data: { remark },
    });

    return {
      message: "更新成功",
      collect_id: updatedCollect.collectId,
    };
  }

  /**
   * 批量删除收藏
   */
  async batchDeleteCollect(
    userId: number,
    batchDeleteCollectDto: BatchDeleteCollectDto,
  ): Promise<SuccessResponse> {
    const { ids } = batchDeleteCollectDto;

    // 验证收藏是否存在
    const existingCollects = await (
      this.databaseService as any
    ).collect_product.findMany({
      where: {
        collect_id: { in: ids },
        user_id: userId,
      },
    });

    if (existingCollects.length !== ids.length) {
      throw new NotFoundException("部分收藏不存在");
    }

    // 删除收藏
    await (this.databaseService as any).collect_product.deleteMany({
      where: {
        collect_id: { in: ids },
        user_id: userId,
      },
    });

    return {
      message: "批量删除成功",
    };
  }

  /**
   * 检查是否已收藏
   */
  async checkCollect(
    userId: number,
    checkCollectDto: CheckCollectDto,
  ): Promise<CheckCollectResponse> {
    const { target_id, collect_type = CollectType.PRODUCT } = checkCollectDto;

    const table2 =
      collect_type === CollectType.SHOP ? "collect_shop" : "collect_product";
    const where2 =
      collect_type === CollectType.SHOP
        ? { user_id: userId, shop_id: target_id }
        : { user_id: userId, product_id: target_id };
    const existingCollect = await (this.databaseService as any)[
      table2
    ].findFirst({ where: where2 });

    return {
      is_collected: !!existingCollect,
      collect_id: existingCollect?.collect_id,
    };
  }

  /**
   * 获取收藏数量
   */
  async getCollectCount(
    userId: number,
    collect_type?: CollectType,
  ): Promise<number> {
    if (collect_type === CollectType.SHOP) {
      return (this.databaseService as any).collect_shop.count({
        where: { user_id: userId },
      });
    }
    return (this.databaseService as any).collect_product.count({
      where: { user_id: userId },
    });
  }

  /**
   * 获取收藏详情
   */
  async getCollectDetail(
    userId: number,
    collectId: number,
  ): Promise<CollectResponse> {
    let mapped: any = null;
    const c = await (this.databaseService as any).collect_product.findFirst({
      where: { collect_id: collectId, user_id: userId },
    });
    if (c)
      mapped = {
        collectId: c.collect_id,
        targetId: c.product_id,
        collectType: CollectType.PRODUCT,
      };
    if (!mapped) {
      const srow = await (this.databaseService as any).collect_shop.findFirst({
        where: { collect_id: collectId, user_id: userId },
      });
      if (srow)
        mapped = {
          collectId: srow.collect_id,
          targetId: srow.shop_id,
          collectType: CollectType.SHOP,
        };
    }
    if (!mapped) {
      throw new NotFoundException("收藏不存在");
    }
    let targetInfo = null;
    if (mapped.collectType === CollectType.PRODUCT) {
      targetInfo = await (this.databaseService as any).product.findFirst({
        where: { product_id: mapped.targetId },
        select: {
          product_id: true,
          product_name: true,
          pic_url: true,
          product_price: true,
          market_price: true,
          product_status: true,
        },
      });
    } else {
      targetInfo = await (this.databaseService as any).shop.findFirst({
        where: { shop_id: mapped.targetId },
        select: { shop_id: true, shop_title: true, shop_logo: true },
      });
    }
    return { collect: { ...mapped, target_info: targetInfo } };
  }

  /**
   * 验证目标是否存在
   */
  private async validateTargetExists(
    collectType: CollectType,
    targetId: number,
  ) {
    let target = null;

    switch (collectType) {
      case CollectType.PRODUCT:
        target = await (this.databaseService as any).product.findFirst({
          where: { product_id: targetId },
        });
        break;
      case CollectType.SHOP:
        target = await (this.databaseService as any).shop.findFirst({
          where: { shop_id: targetId },
        });
        break;
      case CollectType.ARTICLE:
        target = await (this.databaseService as any).article.findFirst({
          where: { article_id: targetId },
        });
        break;
    }

    if (!target) {
      throw new NotFoundException(`${collectType} 不存在`);
    }
  }
}
