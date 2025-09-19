import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
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
} from './dto/collect.dto';

@Injectable()
export class CollectService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 获取收藏列表 - 对齐PHP版本 user/collect/list
   */
  async getCollectList(userId: number, collectListDto: CollectListDto): Promise<CollectListResponse> {
    const {
      keyword = '',
      page = 1,
      size = 15,
      sort_field = 'collect_id',
      sort_order = 'desc',
      collect_type,
    } = collectListDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {
      userId,
    };

    if (keyword) {
      where.remark = {
        contains: keyword,
      };
    }

    if (collect_type) {
      where.collectType = collect_type;
    }

    const [collects, total] = await Promise.all([
      this.databaseService.collectProduct.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          [sort_field]: sort_order,
        },
      }),
      this.databaseService.collectProduct.count({
        where,
      }),
    ]);

    // 获取收藏的详细信息
    const detailedCollects = await Promise.all(
      collects.map(async (collect) => {
        let targetInfo = null;

        if (collect.collectType === CollectType.PRODUCT) {
          targetInfo = await this.databaseService.product.findUnique({
            where: { productId: collect.targetId },
            select: {
              productId: true,
              productName: true,
              productImage: true,
              productPrice: true,
              marketPrice: true,
              isOnSale: true,
            },
          });
        } else if (collect.collectType === CollectType.SHOP) {
          targetInfo = await this.databaseService.shop.findUnique({
            where: { shopId: collect.targetId },
            select: {
              shopId: true,
              shopName: true,
              shopLogo: true,
            },
          });
        } else if (collect.collectType === CollectType.ARTICLE) {
          targetInfo = await this.databaseService.article.findUnique({
            where: { articleId: collect.targetId },
            select: {
              articleId: true,
              title: true,
              coverImage: true,
            },
          });
        }

        return {
          ...collect,
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
  async collectProduct(userId: number, collectProductDto: CollectProductDto): Promise<SuccessResponse> {
    const { product_id } = collectProductDto;

    // 检查商品是否存在
    const product = await this.databaseService.product.findUnique({
      where: { productId: product_id },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // 检查是否已经收藏
    const existingCollect = await this.databaseService.collectProduct.findFirst({
      where: {
        userId,
        targetId: product_id,
        collectType: CollectType.PRODUCT,
      },
    });

    if (existingCollect) {
      throw new ConflictException('商品已收藏');
    }

    // 创建收藏
    const newCollect = await this.databaseService.collectProduct.create({
      data: {
        userId,
        targetId: product_id,
        collectType: CollectType.PRODUCT,
      },
    });

    return {
      message: '收藏成功',
      collect_id: newCollect.collectId,
    };
  }

  /**
   * 取消收藏 - 对齐PHP版本 user/collect/cancel
   */
  async cancelCollect(userId: number, deleteCollectDto: DeleteCollectDto): Promise<SuccessResponse> {
    const { id } = deleteCollectDto;

    // 验证收藏是否存在
    const existingCollect = await this.databaseService.collectProduct.findFirst({
      where: {
        collectId: id,
        userId,
      },
    });

    if (!existingCollect) {
      throw new NotFoundException('收藏不存在');
    }

    // 删除收藏
    await this.databaseService.collectProduct.delete({
      where: { collectId: id },
    });

    return {
      message: '取消收藏成功',
    };
  }

  /**
   * 创建收藏
   */
  async createCollect(userId: number, createCollectDto: CreateCollectDto): Promise<SuccessResponse> {
    const { collect_type, target_id, remark } = createCollectDto;

    // 检查目标是否存在
    await this.validateTargetExists(collect_type, target_id);

    // 检查是否已经收藏
    const existingCollect = await this.databaseService.collectProduct.findFirst({
      where: {
        userId,
        targetId: target_id,
        collectType: collect_type,
      },
    });

    if (existingCollect) {
      throw new ConflictException('已收藏该内容');
    }

    // 创建收藏
    const newCollect = await this.databaseService.collectProduct.create({
      data: {
        userId,
        targetId: target_id,
        collectType: collect_type,
        remark,
      },
    });

    return {
      message: '收藏成功',
      collect_id: newCollect.collectId,
    };
  }

  /**
   * 更新收藏
   */
  async updateCollect(userId: number, updateCollectDto: UpdateCollectDto): Promise<SuccessResponse> {
    const { id, remark } = updateCollectDto;

    // 验证收藏是否存在
    const existingCollect = await this.databaseService.collectProduct.findFirst({
      where: {
        collectId: id,
        userId,
      },
    });

    if (!existingCollect) {
      throw new NotFoundException('收藏不存在');
    }

    // 更新收藏
    const updatedCollect = await this.databaseService.collectProduct.update({
      where: { collectId: id },
      data: { remark },
    });

    return {
      message: '更新成功',
      collect_id: updatedCollect.collectId,
    };
  }

  /**
   * 批量删除收藏
   */
  async batchDeleteCollect(userId: number, batchDeleteCollectDto: BatchDeleteCollectDto): Promise<SuccessResponse> {
    const { ids } = batchDeleteCollectDto;

    // 验证收藏是否存在
    const existingCollects = await this.databaseService.collectProduct.findMany({
      where: {
        collectId: { in: ids },
        userId,
      },
    });

    if (existingCollects.length !== ids.length) {
      throw new NotFoundException('部分收藏不存在');
    }

    // 删除收藏
    await this.databaseService.collectProduct.deleteMany({
      where: {
        collectId: { in: ids },
        userId,
      },
    });

    return {
      message: '批量删除成功',
    };
  }

  /**
   * 检查是否已收藏
   */
  async checkCollect(userId: number, checkCollectDto: CheckCollectDto): Promise<CheckCollectResponse> {
    const { target_id, collect_type = CollectType.PRODUCT } = checkCollectDto;

    const existingCollect = await this.databaseService.collectProduct.findFirst({
      where: {
        userId,
        targetId: target_id,
        collectType: collect_type,
      },
    });

    return {
      is_collected: !!existingCollect,
      collect_id: existingCollect?.collectId,
    };
  }

  /**
   * 获取收藏数量
   */
  async getCollectCount(userId: number, collect_type?: CollectType): Promise<number> {
    const where: any = { userId };

    if (collect_type) {
      where.collectType = collect_type;
    }

    return this.databaseService.collectProduct.count({
      where,
    });
  }

  /**
   * 获取收藏详情
   */
  async getCollectDetail(userId: number, collectId: number): Promise<CollectResponse> {
    const collect = await this.databaseService.collectProduct.findFirst({
      where: {
        collectId,
        userId,
      },
    });

    if (!collect) {
      throw new NotFoundException('收藏不存在');
    }

    let targetInfo = null;

    if (collect.collectType === CollectType.PRODUCT) {
      targetInfo = await this.databaseService.product.findUnique({
        where: { productId: collect.targetId },
        select: {
          productId: true,
          productName: true,
          productImage: true,
          productPrice: true,
          marketPrice: true,
          isOnSale: true,
        },
      });
    } else if (collect.collectType === CollectType.SHOP) {
      targetInfo = await this.databaseService.shop.findUnique({
        where: { shopId: collect.targetId },
        select: {
          shopId: true,
          shopName: true,
          shopLogo: true,
        },
      });
    } else if (collect.collectType === CollectType.ARTICLE) {
      targetInfo = await this.databaseService.article.findUnique({
        where: { articleId: collect.targetId },
        select: {
          articleId: true,
          title: true,
          coverImage: true,
        },
      });
    }

    return {
      collect: {
        ...collect,
        target_info: targetInfo,
      },
    };
  }

  /**
   * 验证目标是否存在
   */
  private async validateTargetExists(collectType: CollectType, targetId: number) {
    let target = null;

    switch (collectType) {
      case CollectType.PRODUCT:
        target = await this.databaseService.product.findUnique({
          where: { productId: targetId },
        });
        break;
      case CollectType.SHOP:
        target = await this.databaseService.shop.findUnique({
          where: { shopId: targetId },
        });
        break;
      case CollectType.ARTICLE:
        target = await this.databaseService.article.findUnique({
          where: { articleId: targetId },
        });
        break;
    }

    if (!target) {
      throw new NotFoundException(`${collectType} 不存在`);
    }
  }
}