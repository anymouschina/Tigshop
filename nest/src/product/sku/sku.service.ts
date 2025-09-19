import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateSkuDto,
  UpdateSkuDto,
  GetSkusDto,
  SkuStockUpdateDto,
  SkuBatchStockUpdateDto,
  SkuAvailabilityDto,
  SkuPriceUpdateDto,
} from './dto/sku.dto';

export interface SkuResponse {
  id: number;
  productId: number;
  skuCode: string;
  skuName?: string;
  price: number;
  originalPrice: number;
  stock: number;
  skuImage?: string;
  weight?: number;
  barcode?: string;
  isEnable: boolean;
  attributes: Array<{
    name: string;
    value: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SkuAvailabilityResponse {
  skuId: number;
  isAvailable: boolean;
  stock: number;
  price: number;
  originalPrice: number;
  skuName?: string;
  skuImage?: string;
}

export interface SkuStatsResponse {
  totalSkus: number;
  totalStock: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  outOfStockCount: number;
  lowStockCount: number;
}

@Injectable()
export class SkuService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 创建SKU - 对齐PHP版本 product/sku/create
   */
  async createSku(createSkuDto: CreateSkuDto): Promise<SkuResponse> {
    const { productId, skuCode, price, originalPrice, stock, skuImage, skuName, weight, barcode, attributes } = createSkuDto;

    // 检查产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { productId: productId },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 检查SKU编码是否已存在
    const existingSku = await this.prisma.productSku.findFirst({
      where: { skuSn: skuCode },
    });

    if (existingSku) {
      throw new BadRequestException('SKU编码已存在');
    }

    // 验证价格
    if (price <= 0) {
      throw new BadRequestException('价格必须大于0');
    }

    if (originalPrice <= 0) {
      throw new BadRequestException('原价必须大于0');
    }

    if (price > originalPrice) {
      throw new BadRequestException('售价不能大于原价');
    }

    // 验证库存
    if (stock < 0) {
      throw new BadRequestException('库存不能为负数');
    }

    // 验证属性组合是否已存在
    const attributeNames = attributes.map(attr => attr.name).sort();
    const attributeValues = attributes.map(attr => attr.value).sort();

    const existingSkus = await this.prisma.productSku.findMany({
      where: { productId },
      include: {
        skuAttributes: {
          include: {
            attribute: true,
            attributeValue: true,
          },
        },
      },
    });

    for (const existingSku of existingSkus) {
      const existingAttrNames = existingSku.skuAttributes
        .map(sa => sa.attribute.name)
        .sort();
      const existingAttrValues = existingSku.skuAttributes
        .map(sa => sa.attributeValue.value)
        .sort();

      if (JSON.stringify(attributeNames) === JSON.stringify(existingAttrNames) &&
          JSON.stringify(attributeValues) === JSON.stringify(existingAttrValues)) {
        throw new BadRequestException('该属性组合的SKU已存在');
      }
    }

    // 创建SKU
    const sku = await this.prisma.$queryRaw`
      INSERT INTO "ProductSku" (productId, skuSn, skuName, price, originalPrice, stock, skuImage, weight, barcode, isEnable, addTime, "createdAt", "updatedAt")
      VALUES (${productId}, ${skuCode}, ${skuName || null}, ${price}, ${originalPrice}, ${stock}, ${skuImage || null}, ${weight || null}, ${barcode || null}, true, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
      RETURNING skuId, productId, skuSn, skuName, price, originalPrice, stock, skuImage, weight, barcode, isEnable, addTime, "createdAt", "updatedAt"
    ` as any[];

    const createdSku = sku[0];

    // 创建SKU属性关联
    for (const attr of attributes) {
      // 查找或创建属性
      let attribute = await this.prisma.productAttribute.findFirst({
        where: { name: attr.name, productId },
      });

      if (!attribute) {
        attribute = await this.prisma.$queryRaw`
          INSERT INTO "ProductAttribute" (name, productId, addTime, "createdAt", "updatedAt")
          VALUES (${attr.name}, ${productId}, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
          RETURNING attributeId, name, productId, addTime, "createdAt", "updatedAt"
        ` as any[];
        attribute = attribute[0];
      }

      // 查找或创建属性值
      let attributeValue = await this.prisma.productAttributeValue.findFirst({
        where: { value: attr.value, attributeId: attribute.attributeId },
      });

      if (!attributeValue) {
        attributeValue = await this.prisma.$queryRaw`
          INSERT INTO "ProductAttributeValue" (value, attributeId, addTime, "createdAt", "updatedAt")
          VALUES (${attr.value}, ${attribute.attributeId}, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
          RETURNING attributeValueId, value, attributeId, addTime, "createdAt", "updatedAt"
        ` as any[];
        attributeValue = attributeValue[0];
      }

      // 创建SKU属性关联
      await this.prisma.$queryRaw`
        INSERT INTO "SkuAttribute" (skuId, attributeId, attributeValueId, addTime, "createdAt", "updatedAt")
        VALUES (${createdSku.skuId}, ${attribute.attributeId}, ${attributeValue.attributeValueId}, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
      `;
    }

    return this.formatSkuResponse(createdSku);
  }

  /**
   * 获取SKU列表 - 对齐PHP版本 product/sku/list
   */
  async getSkuList(query: GetSkusDto) {
    const { productId, skuCode, isEnable, page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const whereClause: any = {};
    if (productId) whereClause.productId = productId;
    if (skuCode) whereClause.skuSn = { contains: skuCode };
    if (isEnable !== undefined) whereClause.isEnable = isEnable;

    const [skus, total] = await Promise.all([
      this.prisma.productSku.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [
          { createdAt: 'desc' },
          { skuId: 'desc' }
        ],
        include: {
          skuAttributes: {
            include: {
              attribute: true,
              attributeValue: true,
            },
          },
        },
      }),
      this.prisma.productSku.count({
        where: whereClause,
      }),
    ]);

    return {
      list: skus.map(sku => this.formatSkuResponse(sku)),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取SKU详情 - 对齐PHP版本 product/sku/detail
   */
  async getSkuDetail(skuId: number): Promise<SkuResponse> {
    const sku = await this.prisma.productSku.findFirst({
      where: { skuId: skuId },
      include: {
        skuAttributes: {
          include: {
            attribute: true,
            attributeValue: true,
          },
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    return this.formatSkuResponse(sku);
  }

  /**
   * 更新SKU - 对齐PHP版本 product/sku/update
   */
  async updateSku(skuId: number, updateSkuDto: UpdateSkuDto): Promise<SkuResponse> {
    // 检查SKU是否存在
    const existingSku = await this.prisma.productSku.findFirst({
      where: { skuId: skuId },
    });

    if (!existingSku) {
      throw new NotFoundException('SKU不存在');
    }

    // 验证价格
    if (updateSkuDto.price !== undefined && updateSkuDto.price <= 0) {
      throw new BadRequestException('价格必须大于0');
    }

    if (updateSkuDto.originalPrice !== undefined && updateSkuDto.originalPrice <= 0) {
      throw new BadRequestException('原价必须大于0');
    }

    if (updateSkuDto.price !== undefined && updateSkuDto.originalPrice !== undefined &&
        updateSkuDto.price > updateSkuDto.originalPrice) {
      throw new BadRequestException('售价不能大于原价');
    }

    // 验证库存
    if (updateSkuDto.stock !== undefined && updateSkuDto.stock < 0) {
      throw new BadRequestException('库存不能为负数');
    }

    // 更新SKU
    const updatedSku = await this.prisma.productSku.update({
      where: { skuId: skuId },
      data: updateSkuDto,
      include: {
        skuAttributes: {
          include: {
            attribute: true,
            attributeValue: true,
          },
        },
      },
    });

    // 如果有属性更新，先删除旧的属性关联，再创建新的
    if (updateSkuDto.attributes) {
      await this.prisma.skuAttribute.deleteMany({
        where: { skuId },
      });

      for (const attr of updateSkuDto.attributes) {
        // 查找或创建属性
        let attribute = await this.prisma.productAttribute.findFirst({
          where: { name: attr.name, productId: updatedSku.productId },
        });

        if (!attribute) {
          attribute = await this.prisma.$queryRaw`
            INSERT INTO "ProductAttribute" (name, productId, addTime, "createdAt", "updatedAt")
            VALUES (${attr.name}, ${updatedSku.productId}, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
            RETURNING attributeId, name, productId, addTime, "createdAt", "updatedAt"
          ` as any[];
          attribute = attribute[0];
        }

        // 查找或创建属性值
        let attributeValue = await this.prisma.productAttributeValue.findFirst({
          where: { value: attr.value, attributeId: attribute.attributeId },
        });

        if (!attributeValue) {
          attributeValue = await this.prisma.$queryRaw`
            INSERT INTO "ProductAttributeValue" (value, attributeId, addTime, "createdAt", "updatedAt")
            VALUES (${attr.value}, ${attribute.attributeId}, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
            RETURNING attributeValueId, value, attributeId, addTime, "createdAt", "updatedAt"
          ` as any[];
          attributeValue = attributeValue[0];
        }

        // 创建SKU属性关联
        await this.prisma.$queryRaw`
          INSERT INTO "SkuAttribute" (skuId, attributeId, attributeValueId, addTime, "createdAt", "updatedAt")
          VALUES (${skuId}, ${attribute.attributeId}, ${attributeValue.attributeValueId}, ${Math.floor(Date.now() / 1000)}, NOW(), NOW())
        `;
      }
    }

    return this.formatSkuResponse(updatedSku);
  }

  /**
   * 删除SKU - 对齐PHP版本 product/sku/delete
   */
  async deleteSku(skuId: number) {
    // 检查SKU是否存在
    const sku = await this.prisma.productSku.findFirst({
      where: { skuId: skuId },
    });

    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    // 检查是否有关联的订单项
    const orderItemCount = await this.prisma.orderItem.count({
      where: { skuId },
    });

    if (orderItemCount > 0) {
      throw new BadRequestException('该SKU已被订单使用，不能删除');
    }

    // 删除SKU属性关联
    await this.prisma.skuAttribute.deleteMany({
      where: { skuId },
    });

    // 删除SKU
    await this.prisma.productSku.delete({
      where: { skuId: skuId },
    });

    return { message: 'SKU删除成功' };
  }

  /**
   * 更新SKU库存 - 对齐PHP版本 product/sku/updateStock
   */
  async updateSkuStock(skuId: number, stockUpdateDto: SkuStockUpdateDto) {
    const { stock } = stockUpdateDto;

    if (stock < 0) {
      throw new BadRequestException('库存不能为负数');
    }

    // 检查SKU是否存在
    const sku = await this.prisma.productSku.findFirst({
      where: { skuId: skuId },
    });

    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    // 更新库存
    await this.prisma.productSku.update({
      where: { skuId: skuId },
      data: { stock },
    });

    return { message: '库存更新成功', stock };
  }

  /**
   * 批量更新SKU库存 - 对齐PHP版本 product/sku/batchUpdateStock
   */
  async batchUpdateSkuStock(batchUpdateDto: SkuBatchStockUpdateDto) {
    const { skuUpdates } = batchUpdateDto;

    const results = await Promise.all(
      skuUpdates.map(async (update) => {
        try {
          await this.updateSkuStock(update.skuId, { stock: update.stock });
          return { skuId: update.skuId, success: true, stock: update.stock };
        } catch (error) {
          return { skuId: update.skuId, success: false, error: error.message };
        }
      })
    );

    return {
      message: '批量库存更新完成',
      results,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length,
    };
  }

  /**
   * 更新SKU价格 - 对齐PHP版本 product/sku/updatePrice
   */
  async updateSkuPrice(skuId: number, priceUpdateDto: SkuPriceUpdateDto) {
    const { price, originalPrice } = priceUpdateDto;

    if (price <= 0) {
      throw new BadRequestException('价格必须大于0');
    }

    if (originalPrice && originalPrice <= 0) {
      throw new BadRequestException('原价必须大于0');
    }

    if (originalPrice && price > originalPrice) {
      throw new BadRequestException('售价不能大于原价');
    }

    // 检查SKU是否存在
    const sku = await this.prisma.productSku.findFirst({
      where: { skuId: skuId },
    });

    if (!sku) {
      throw new NotFoundException('SKU不存在');
    }

    // 更新价格
    const updateData: any = { price };
    if (originalPrice) {
      updateData.originalPrice = originalPrice;
    }

    await this.prisma.productSku.update({
      where: { skuId: skuId },
      data: updateData,
    });

    return { message: '价格更新成功', price, originalPrice };
  }

  /**
   * 获取SKU可用性 - 对齐PHP版本 product/sku/getAvailability
   */
  async getSkuAvailability(availabilityDto: SkuAvailabilityDto) {
    const { skuIds } = availabilityDto;

    const skus = await this.prisma.productSku.findMany({
      where: {
        skuId: { in: skuIds },
        isEnable: true,
      },
    });

    const results = skus.map(sku => ({
      skuId: sku.skuId,
      isAvailable: sku.skuStock > 0,
      stock: sku.skuStock,
      price: Number(sku.skuPrice),
      originalPrice: Number(sku.skuPrice),
      skuName: sku.skuName,
      skuImage: sku.skuImage,
    }));

    // 包含请求的所有SKU ID，不存在的SKU标记为不可用
    const allResults = skuIds.map(skuId => {
      const existingSku = results.find(r => r.skuId === skuId);
      if (existingSku) {
        return existingSku;
      }
      return {
        skuId,
        isAvailable: false,
        stock: 0,
        price: 0,
        originalPrice: 0,
      };
    });

    return {
      results: allResults,
      availableCount: results.filter(r => r.isAvailable).length,
      totalCount: skuIds.length,
    };
  }

  /**
   * 获取产品SKU列表 - 对齐PHP版本 product/sku/getProductSkus
   */
  async getProductSkus(productId: number) {
    // 检查产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { productId: productId },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    const skus = await this.prisma.productSku.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      productId,
      skus: skus.map(sku => this.formatSkuResponse(sku)),
      total: skus.length,
    };
  }

  /**
   * 获取SKU统计信息 - 对齐PHP版本 product/sku/getStats
   */
  async getSkuStats(productId?: number): Promise<SkuStatsResponse> {
    const whereClause: any = {};
    if (productId) whereClause.productId = productId;

    const skus = await this.prisma.productSku.findMany({ where: whereClause });

    if (skus.length === 0) {
      return {
        totalSkus: 0,
        totalStock: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
      };
    }

    const totalStock = skus.reduce((sum, sku) => sum + Number(sku.skuStock), 0);
    const prices = skus.map(sku => Number(sku.skuPrice));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const outOfStockCount = skus.filter(sku => sku.skuStock === 0).length;
    const lowStockCount = skus.filter(sku => sku.skuStock > 0 && sku.skuStock < 10).length;

    return {
      totalSkus: skus.length,
      totalStock,
      avgPrice: Number(avgPrice.toFixed(2)),
      minPrice,
      maxPrice,
      outOfStockCount,
      lowStockCount,
    };
  }

  /**
   * 格式化SKU响应
   */
  private formatSkuResponse(sku: any): SkuResponse {
    return {
      id: sku.skuId,
      productId: sku.productId,
      skuCode: sku.skuSn,
      skuName: sku.skuName,
      price: Number(sku.skuPrice),
      originalPrice: Number(sku.skuPrice), // Using same field as price for now
      stock: sku.skuStock,
      skuImage: sku.skuImage,
      weight: sku.skuWeight,
      barcode: sku.skuCode, // Using skuCode as barcode for now
      isEnable: sku.isEnable,
      attributes: [], // Simplified for now
      createdAt: sku.createdAt,
      updatedAt: sku.updatedAt,
    };
  }
}