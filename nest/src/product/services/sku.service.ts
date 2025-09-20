// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class SkuService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSpecTemplates(queryDto: any) {
    return {
      list: [],
      pagination: {
        page: queryDto.page || 1,
        size: queryDto.size || 20,
        total: 0,
        totalPages: 0,
      },
    };
  }

  async generateSkusFromTemplate(
    templateId: number,
    productId: number,
    skuData: any,
  ) {
    return {
      message: "SKU generation is temporarily disabled",
      templateId,
      productId,
    };
  }

  async batchUpdatePrices(productId: number, updates: any[]) {
    return {
      message: "Batch price update is temporarily disabled",
      productId,
      updatesCount: updates.length,
    };
  }

  async batchUpdateStock(productId: number, updates: any[]) {
    return {
      message: "Batch stock update is temporarily disabled",
      productId,
      updatesCount: updates.length,
    };
  }

  async getSkuStockDetails(productId: number) {
    return {
      productId,
      skus: [],
      totalStock: 0,
    };
  }

  async getLowStockSkus(shopId?: number, threshold?: number) {
    return {
      list: [],
      shopId,
      threshold,
    };
  }
}
