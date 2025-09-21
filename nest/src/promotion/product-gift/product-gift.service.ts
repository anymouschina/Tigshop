// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateProductGiftDto,
  UpdateProductGiftDto,
} from "./dto/product-gift.dto";

@Injectable()
export class ProductGiftService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const { page, size, sort_field, sort_order, keyword, gift_id } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { gift_name: { contains: keyword } },
        { product: { product_name: { contains: keyword } } },
      ];
    }
    if (gift_id) {
      where.gift_id = parseInt(gift_id);
    }

    const records = await this.prisma.productGift.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            product_name: true,
            product_image: true,
          },
        },
        sku: {
          select: {
            id: true,
            sku_name: true,
            sku_image: true,
          },
        },
      },
      skip,
      take: size,
      orderBy,
    });

    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const { page, size, sort_field, sort_order, keyword, gift_id } = filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { gift_name: { contains: keyword } },
        { product: { product_name: { contains: keyword } } },
      ];
    }
    if (gift_id) {
      where.gift_id = parseInt(gift_id);
    }

    return this.prisma.productGift.count({ where });
  }

  async getDetail(giftId: number) {
    const item = await this.prisma.productGift.findFirst({
      where: { gift_id: giftId },
      include: {
        product: {
          select: {
            id: true,
            product_name: true,
            product_image: true,
          },
        },
        sku: {
          select: {
            id: true,
            sku_name: true,
            sku_image: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("赠品不存在");
    }

    return item;
  }

  async createProductGift(createData: CreateProductGiftDto) {
    return this.prisma.productGift.create({
      data: {
        gift_name: createData.gift_name,
        product_id: createData.product_id,
        sku_id: createData.sku_id,
        gift_stock: createData.gift_stock,
        shop_id: createData.shop_id || 1,
        create_time: new Date(),
      },
    });
  }

  async updateProductGift(updateData: UpdateProductGiftDto) {
    return this.prisma.productGift.update({
      where: { gift_id: updateData.gift_id },
      data: {
        gift_name: updateData.gift_name,
        product_id: updateData.product_id,
        sku_id: updateData.sku_id,
        gift_stock: updateData.gift_stock,
        update_time: new Date(),
      },
    });
  }

  async deleteProductGift(giftId: number) {
    return this.prisma.productGift.delete({
      where: { gift_id: giftId },
    });
  }

  async getGiftStatistics() {
    const [total, available, outOfStock] = await Promise.all([
      this.prisma.productGift.count(),
      this.prisma.productGift.count({ where: { gift_stock: { gt: 0 } } }),
      this.prisma.productGift.count({ where: { gift_stock: { lte: 0 } } }),
    ]);

    return {
      total,
      available,
      out_of_stock: outOfStock,
    };
  }

  async getAvailableGifts(productId?: number) {
    const where: any = { gift_stock: { gt: 0 } };
    if (productId) {
      where.product_id = productId;
    }

    return this.prisma.productGift.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            product_name: true,
            product_image: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
    });
  }

  async reduceGiftStock(giftId: number, quantity: number) {
    return this.prisma.productGift.update({
      where: { gift_id: giftId },
      data: {
        gift_stock: {
          decrement: quantity,
        },
      },
    });
  }

  async addGiftStock(giftId: number, quantity: number) {
    return this.prisma.productGift.update({
      where: { gift_id: giftId },
      data: {
        gift_stock: {
          increment: quantity,
        },
      },
    });
  }
}
