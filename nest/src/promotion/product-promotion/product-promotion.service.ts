// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ProductPromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const where: any = {};
    if (filter.keyword) where.promotion_name = { contains: filter.keyword };
    if (filter.promotion_type) where.promotion_type = Number(filter.promotion_type);
    if (filter.is_going !== undefined && filter.is_going !== "") {
      const now = Math.floor(Date.now() / 1000);
      if (Number(filter.is_going) === 1) {
        where.start_time = { lte: now };
        where.end_time = { gte: now };
        where.is_available = 1;
      } else if (Number(filter.is_going) === 0) {
        // 非进行中：结束或未开始
        where.OR = [
          { end_time: { lt: now } },
          { start_time: { gt: now } },
          { is_available: 0 },
        ];
      }
    }
    if (filter.range && filter.range_data && Array.isArray(filter.range_data)) {
      where.range = Number(filter.range);
      where.range_data = { contains: "" }; // 仅作占位，前端通常传递范围数据做服务端冲突校验
    }
    if (filter.shop_id) where.shop_id = Number(filter.shop_id);

    const orderBy = { [filter.sort_field || "promotion_id"]: filter.sort_order || "desc" };
    const skip = ((filter.page || 1) - 1) * (filter.size || 15);
    const take = filter.size || 15;

    const records = await this.prisma.product_promotion.findMany({ where, orderBy, skip, take });
    // 附加时间文本
    return records.map((r) => ({
      ...r,
      time_text: `${r.start_time || 0} 至 ${r.end_time || 0}`,
    }));
  }

  async getFilterCount(filter: any) {
    const where: any = {};
    if (filter.keyword) where.promotion_name = { contains: filter.keyword };
    if (filter.promotion_type) where.promotion_type = Number(filter.promotion_type);
    if (filter.shop_id) where.shop_id = Number(filter.shop_id);
    return this.prisma.product_promotion.count({ where });
  }

  async getConflictList(filter: any) {
    const start = Number(filter.start_time) || 0;
    const end = Number(filter.end_time) || 0;
    const type = Number(filter.promotion_type) || 0;
    const page = Number(filter.page) || 1;
    const size = Number(filter.size) || 15;
    const skip = (page - 1) * size;
    const take = size;
    const where: any = {
      promotion_type: type ? type : undefined,
      OR: [
        { start_time: { lte: end }, end_time: { gte: start } }, // 时间段有交集
      ],
    };
    const [list, total] = await Promise.all([
      this.prisma.product_promotion.findMany({ where, skip, take, orderBy: { promotion_id: "desc" } }),
      this.prisma.product_promotion.count({ where }),
    ]);
    return { list, total };
  }

  async getUserRankList() {
    return this.prisma.user_rank.findMany({ where: { is_delete: 0, is_show: 1 }, orderBy: { sort_order: "asc" } });
  }

  async getPromotionStatus() {
    return {
      1: "启用",
      0: "禁用",
    };
  }

  async getDetail(id: number) {
    return this.prisma.product_promotion.findUnique({ where: { promotion_id: Number(id) } });
  }

  async createProductPromotion(data: any) {
    const payload: any = {
      promotion_name: data.promotion_name,
      start_time: Number(data.start_time) || 0,
      end_time: Number(data.end_time) || 0,
      limit_user_rank: data.limit_user_rank || "",
      range: Number(data.range) || 0,
      range_data: Array.isArray(data.range_data) ? JSON.stringify(data.range_data) : data.range_data || "",
      min_order_amount: data.min_order_amount || 0,
      max_order_amount: data.max_order_amount || 0,
      promotion_type: Number(data.promotion_type) || 0,
      promotion_type_data: typeof data.promotion_type_data === "object" ? JSON.stringify(data.promotion_type_data) : data.promotion_type_data || "",
      is_available: data.is_available ?? 1,
      sort_order: Number(data.sort_order) || 50,
      shop_id: Number(data.shop_id) || 0,
      rules_type: Number(data.rules_type) || 1,
      unit: Number(data.unit) || 1,
    };
    return this.prisma.product_promotion.create({ data: payload });
  }

  async updateProductPromotion(id: number, data: any) {
    const payload: any = {};
    const keys = [
      "promotion_name",
      "start_time",
      "end_time",
      "limit_user_rank",
      "range",
      "range_data",
      "min_order_amount",
      "max_order_amount",
      "promotion_type",
      "promotion_type_data",
      "is_available",
      "sort_order",
      "rules_type",
      "unit",
    ];
    for (const k of keys) if (data[k] !== undefined) payload[k] = data[k];
    if (payload.range_data && Array.isArray(payload.range_data)) payload.range_data = JSON.stringify(payload.range_data);
    if (payload.promotion_type_data && typeof payload.promotion_type_data === "object") payload.promotion_type_data = JSON.stringify(payload.promotion_type_data);
    return this.prisma.product_promotion.update({ where: { promotion_id: Number(id) }, data: payload });
  }

  async updateProductPromotionField(id: number, data: any) {
    return this.prisma.product_promotion.update({ where: { promotion_id: Number(id) }, data });
  }

  async deleteProductPromotion(id: number) {
    return this.prisma.product_promotion.delete({ where: { promotion_id: Number(id) } });
  }

  async batchDeleteProductPromotion(ids: number[]) {
    return this.prisma.product_promotion.deleteMany({ where: { promotion_id: { in: ids.map((n) => Number(n)) } } });
  }

  async getPromotionStatistics() {
    const now = Math.floor(Date.now() / 1000);
    const [total, going, upcoming, ended] = await Promise.all([
      this.prisma.product_promotion.count(),
      this.prisma.product_promotion.count({ where: { start_time: { lte: now }, end_time: { gte: now }, is_available: 1 } }),
      this.prisma.product_promotion.count({ where: { start_time: { gt: now } } }),
      this.prisma.product_promotion.count({ where: { end_time: { lt: now } } }),
    ]);
    return { total, going, upcoming, ended };
  }
}
