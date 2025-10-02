// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { toMoneyString } from "src/common/utils/format";

@Injectable()
export class ProductPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(params: { productId: number; skuId?: number | null }) {
    const { productId, skuId } = params;
    let stock = 0;
    let price = 0;
    let originPrice = 0;
    const product = await this.prisma.product.findFirst({
      where: { product_id: productId },
      select: { product_price: true, market_price: true, product_stock: true },
    });
    if (skuId) {
      const sku = await this.prisma.product_sku.findFirst({
        where: { product_id: productId, sku_id: skuId },
        select: { sku_stock: true, sku_price: true },
      });
      stock = Number(sku?.sku_stock ?? 0);
      price = Number((sku?.sku_price ?? 0).toString());
    } else {
      stock = Number(product?.product_stock ?? 0);
      price = Number((product?.product_price ?? 0).toString());
    }
    originPrice = Number((product?.market_price ?? 0).toString());
    return {
      stock,
      priceStr: toMoneyString(price),
      originPriceStr: toMoneyString(originPrice),
      priceNum: price,
      originPriceNum: originPrice,
    };
  }

  async getAmount(productId: number, items: Array<{ skuId: number; num: number }>) {
    let count = 0;
    let total = 0;
    for (const it of items) {
      const skuId = Number(it.skuId);
      const num = Number(it.num) || 0;
      count += num;
      if (!Number.isFinite(skuId) || skuId <= 0 || num <= 0) continue;
      const sku = await this.prisma.product_sku.findFirst({
        where: { product_id: productId, sku_id: skuId },
        select: { sku_price: true },
      });
      const price = Number((sku?.sku_price ?? 0).toString());
      total += price * num;
    }
    return { count, totalStr: toMoneyString(total), totalNum: total };
  }

  async getBatchAvailability(skuIds: number[]) {
    if (skuIds.length === 0) return {} as Record<string, { price: string; stock: number }>;
    const skus = await this.prisma.product_sku.findMany({
      where: { sku_id: { in: skuIds } },
      select: { sku_id: true, sku_price: true, sku_stock: true },
    });
    const result: Record<string, { price: string; stock: number }> = {};
    for (const sku of skus) {
      const key = String(sku.sku_id);
      result[key] = { price: toMoneyString(sku.sku_price), stock: Number(sku.sku_stock ?? 0) };
    }
    return result;
  }

  async getPriceInBatches(items: Array<{ productId: number; skuId: number }>) {
    return Promise.all(
      items.map(async (item) => {
        try {
          const product = await this.prisma.product.findFirst({
            where: { product_id: item.productId },
            select: { market_price: true, product_price: true, product_stock: true },
          });
          const sku = await this.prisma.product_sku.findFirst({
            where: { product_id: item.productId, sku_id: item.skuId },
            select: { sku_price: true, sku_stock: true },
          });
          const originPrice = Number(product?.market_price || product?.product_price || 0);
          const price = Number((sku?.sku_price ?? product?.product_price) || 0);
          const stock = Number((sku?.sku_stock ?? product?.product_stock) || 0);
          return {
            origin_price: originPrice,
            price,
            stock,
            promotion: null,
            sku_id: item.skuId,
            product_id: item.productId,
          };
        } catch (_) {
          return { origin_price: 0, price: 0, stock: 0, promotion: null, sku_id: item.skuId, product_id: item.productId };
        }
      }),
    );
  }
}
