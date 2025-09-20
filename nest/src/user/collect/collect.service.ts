// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
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

@Injectable()
export class CollectService {
  constructor(private readonly databaseService: DatabaseService) {}

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
        let targetInfo = null;

        const mapped = isShop
          ? {
              collectId: collect.collect_id,
              targetId: collect.shop_id,
              collectType: CollectType.SHOP,
            }
          : {
              collectId: collect.collect_id,
              targetId: collect.product_id,
              collectType: CollectType.PRODUCT,
            };

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
        } else if (mapped.collectType === CollectType.SHOP) {
          targetInfo = await (this.databaseService as any).shop.findFirst({
            where: { shop_id: mapped.targetId },
            select: {
              shop_id: true,
              shop_title: true,
              shop_logo: true,
            },
          });
        }

        return {
          ...mapped,
          add_time: collect.add_time,
          target_info: targetInfo,
        };
      }),
    );

    return {
      records: detailedCollects,
      total,
    };
  }

  /**
   * 收藏商品 - 对齐PHP版本 user/collect/save
   */
  async collectProduct(
    userId: number,
    collectProductDto: CollectProductDto,
  ): Promise<SuccessResponse> {
    const { product_id } = collectProductDto;

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
    const { id } = deleteCollectDto;

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

    // 删除收藏
    await (this.databaseService as any).collect_product.delete({
      where: { collect_id: id },
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
