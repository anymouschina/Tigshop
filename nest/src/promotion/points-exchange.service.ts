// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export const POINTS_EXCHANGE_ENABLED = {
  0: '禁用',
  1: '启用',
};

export const POINTS_EXCHANGE_HOT = {
  0: '普通',
  1: '热门',
};

@Injectable()
export class PointsExchangeService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.pointsExchange.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        product: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
          },
        },
        product_sku: {
          select: {
            sku_id: true,
            sku_name: true,
            sku_image: true,
            sku_price: true,
            sku_stock: true,
          },
        },
      },
    });

    // 计算折扣价格
    for (const item of results) {
      let productPrice = 0;
      if (item.product_sku && item.sku_id > 0) {
        productPrice = Number(item.product_sku.sku_price);
      } else if (item.product) {
        // 如果没有SKU，使用商品基础价格
        productPrice = Number(item.product.product_price || 0);
      }

      const discountsPrice = Math.max(0, productPrice - Number(item.points_deducted_amount));
      item.product_price = productPrice;
      item.discounts_price = Number(discountsPrice.toFixed(2));
    }

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.pointsExchange.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          product: {
            product_name: {
              contains: filter.keyword,
            },
          },
        },
      ];
    }

    // 启用状态筛选
    if (filter.is_enabled !== undefined && filter.is_enabled !== -1) {
      where.is_enabled = filter.is_enabled;
    }

    // 热门状态筛选
    if (filter.is_hot !== undefined && filter.is_hot !== -1) {
      where.is_hot = filter.is_hot;
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      return {
        [filter.sort_field]: filter.sort_order,
      };
    }
    return {
      id: 'desc',
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.pointsExchange.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
            product_price: true,
          },
        },
        product_sku: {
          select: {
            sku_id: true,
            sku_name: true,
            sku_image: true,
            sku_price: true,
            sku_stock: true,
          },
        },
      },
    });

    if (!result) {
      throw new Error('积分商品不存在');
    }

    let productPrice = 0;
    let productStock = 0;
    let isEnabled = result.is_enabled;

    if (result.product_sku && result.sku_id > 0) {
      productPrice = Number(result.product_sku.sku_price);
      productStock = Number(result.product_sku.sku_stock);
    } else {
      productPrice = Number(result.product?.product_price || 0);
      productStock = Number(result.product?.product_stock || 0);
    }

    const discountsPrice = Math.max(0, productPrice - Number(result.points_deducted_amount));

    // 检查SKU是否存在或商品是否有价格
    if (result.sku_id > 0 && !result.product_sku) {
      // 属性已变更，无属性可兑换
      isEnabled = 0;
      productStock = 0;
    }

    if (result.sku_id === 0 && productPrice > 0) {
      isEnabled = 0;
      productStock = 0;
    }

    return {
      ...result,
      product_price: productPrice,
      product_stock: productStock,
      discounts_price: Number(discountsPrice.toFixed(2)),
      is_enabled: isEnabled,
      enabled_name: POINTS_EXCHANGE_ENABLED[isEnabled],
      hot_name: POINTS_EXCHANGE_HOT[result.is_hot],
    };
  }

  async create(data: any): Promise<any> {
    // 验证积分必须大于0
    if (data.exchange_integral <= 0) {
      throw new Error('兑换积分必须大于0');
    }

    // 验证抵扣金额不能为负数
    if (data.points_deducted_amount < 0) {
      throw new Error('抵扣金额不能为负数');
    }

    const result = await this.prisma.pointsExchange.create({
      data: {
        product_id: data.product_id,
        exchange_integral: data.exchange_integral,
        points_deducted_amount: data.points_deducted_amount || 0,
        is_hot: data.is_hot || 0,
        is_enabled: data.is_enabled ?? 1,
        sku_id: data.sku_id || 0,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const pointsExchange = await this.prisma.pointsExchange.findUnique({
      where: { id },
    });

    if (!pointsExchange) {
      throw new Error('积分商品不存在');
    }

    // 验证积分必须大于0
    if (data.exchange_integral !== undefined && data.exchange_integral <= 0) {
      throw new Error('兑换积分必须大于0');
    }

    // 验证抵扣金额不能为负数
    if (data.points_deducted_amount !== undefined && data.points_deducted_amount < 0) {
      throw new Error('抵扣金额不能为负数');
    }

    const updateData: any = {};
    if (data.product_id !== undefined) updateData.product_id = data.product_id;
    if (data.exchange_integral !== undefined) updateData.exchange_integral = data.exchange_integral;
    if (data.points_deducted_amount !== undefined) updateData.points_deducted_amount = data.points_deducted_amount;
    if (data.is_hot !== undefined) updateData.is_hot = data.is_hot;
    if (data.is_enabled !== undefined) updateData.is_enabled = data.is_enabled;
    if (data.sku_id !== undefined) updateData.sku_id = data.sku_id;

    const result = await this.prisma.pointsExchange.update({
      where: { id },
      data: updateData,
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const pointsExchange = await this.prisma.pointsExchange.findUnique({
      where: { id },
    });

    if (!pointsExchange) {
      throw new Error('积分商品不存在');
    }

    // 验证字段
    if (!['is_hot', 'is_enabled'].includes(field)) {
      throw new Error('不支持的字段');
    }

    const result = await this.prisma.pointsExchange.update({
      where: { id },
      data: {
        [field]: value,
      },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const pointsExchange = await this.prisma.pointsExchange.findUnique({
      where: { id },
    });

    if (!pointsExchange) {
      throw new Error('积分商品不存在');
    }

    const result = await this.prisma.pointsExchange.delete({
      where: { id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.pointsExchange.deleteMany({
      where: { id: { in: ids } },
    });

    return true;
  }

  async getInfoByProductId(productId: number, skuId: number): Promise<any> {
    const result = await this.prisma.pointsExchange.findFirst({
      where: {
        product_id: productId,
        sku_id: skuId,
      },
    });

    return result || {};
  }
}
