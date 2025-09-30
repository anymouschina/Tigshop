// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  PromotionType,
  TimeType,
} from "./dto/promotion.dto";

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(
    filter: any,
    select: string[] = [],
    append: string[] = [],
  ) {
    const now = Math.floor(Date.now() / 1000);
    // 基础 where（布尔/等值）
    const where: any = {
      // Prisma 中 is_delete 为 Boolean?，默认查询未删除（false）
      is_delete:
        filter.is_delete !== undefined
          ? Boolean(Number(filter.is_delete))
          : false,
      // is_available 为整型(可空)，默认 1；兼容字符串
      is_available:
        filter.is_available !== undefined
          ? Number(filter.is_available)
          : 1,
      shop_id: filter.shop_id,
    };

    // 类型筛选（支持逗号分隔或数组）
    if (filter.type) {
      const types = Array.isArray(filter.type)
        ? filter.type.map((t) => Number(t))
        : String(filter.type)
            .split(",")
            .filter((s) => s !== "")
            .map((s) => Number(s));
      if (types.length > 0) where.type = { in: types };
    }

    // 关键字（名称）
    if (filter.keyword) {
      where.promotion_name = { contains: filter.keyword };
    }

    // 时间类型筛选（按 PHP 逻辑）
    const AND: any[] = [];
    const OR: any[] = [];
    const timeType = Number(filter.time_type || 0);
    if (timeType === 1) {
      // 进行中 或 长期有效（start<=now<=end 或 start=0&end=0）
      OR.push({ start_time: { lte: now }, end_time: { gte: now } });
      OR.push({ start_time: 0, end_time: 0 });
    } else if (timeType === 2) {
      // 即将结束：进行中，且 end_time 在 7 天内且不为 0
      AND.push({ start_time: { lte: now } });
      AND.push({ end_time: { gte: now, lte: now + 7 * 24 * 3600, not: 0 } });
    } else if (timeType === 3) {
      // 未开始
      AND.push({ start_time: { gt: now } });
    } else if (timeType === 4) {
      // 结束时间大于当前（兼容 PHP 分支）
      AND.push({ end_time: { gt: now } });
    }

    const whereFinal = { ...where } as any;
    if (OR.length > 0) whereFinal.OR = OR;
    if (AND.length > 0) whereFinal.AND = AND;

    const orderBy: any = {};
    orderBy[filter.sort_field || "promotion_id"] = filter.sort_order || "desc";

    const skip = (filter.page - 1) * (filter.size > 0 ? filter.size : 15);
    const take = filter.size === -1 ? undefined : filter.size || 15;

    const promotions = await this.prisma.promotion.findMany({
      where: whereFinal,
      orderBy,
      skip,
      take,
    });

    // 处理附加字段
    return promotions.map((promotion) => {
      const result: any = { ...promotion };

      // 添加类型文本
      if (append.includes("type_text")) {
        result.type_text = this.getTypeText(promotion.type);
      }

      // 添加时间文本
      if (append.includes("time_text")) {
        result.time_text = this.getTimeText(promotion);
      }

      return result;
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const where: any = {
      is_delete:
        filter.is_delete !== undefined
          ? Boolean(Number(filter.is_delete))
          : false,
      is_available:
        filter.is_available !== undefined
          ? Number(filter.is_available)
          : 1,
      shop_id: filter.shop_id,
    };
    if (filter.type) {
      const types = Array.isArray(filter.type)
        ? filter.type.map((t) => Number(t))
        : String(filter.type)
            .split(",")
            .filter((s) => s !== "")
            .map((s) => Number(s));
      if (types.length > 0) where.type = { in: types };
    }
    if (filter.keyword) {
      where.promotion_name = { contains: filter.keyword };
    }
    const AND: any[] = [];
    const OR: any[] = [];
    const timeType = Number(filter.time_type || 0);
    if (timeType === 1) {
      OR.push({ start_time: { lte: now }, end_time: { gte: now } });
      OR.push({ start_time: 0, end_time: 0 });
    } else if (timeType === 2) {
      AND.push({ start_time: { lte: now } });
      AND.push({ end_time: { gte: now, lte: now + 7 * 24 * 3600, not: 0 } });
    } else if (timeType === 3) {
      AND.push({ start_time: { gt: now } });
    } else if (timeType === 4) {
      AND.push({ end_time: { gt: now } });
    }
    const whereFinal = { ...where } as any;
    if (OR.length > 0) whereFinal.OR = OR;
    if (AND.length > 0) whereFinal.AND = AND;

    return this.prisma.promotion.count({ where: whereFinal });
  }

  async getDetail(id: number) {
    return this.prisma.promotion.findUnique({
      where: { promotion_id: id },
    });
  }

  async createPromotion(createPromotionDto: CreatePromotionDto) {
    const data = {
      ...createPromotionDto,
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000),
    };

    return this.prisma.promotion.create({
      data,
    });
  }

  async updatePromotion(id: number, updatePromotionDto: UpdatePromotionDto) {
    const data = {
      ...updatePromotionDto,
      update_time: Math.floor(Date.now() / 1000),
    };

    delete data.promotion_id;

    return this.prisma.promotion.update({
      where: { promotion_id: id },
      data,
    });
  }

  async updatePromotionField(id: number, field: string, value: any) {
    const updateData: any = {
      [field]: value,
      update_time: Math.floor(Date.now() / 1000),
    };

    return this.prisma.promotion.update({
      where: { promotion_id: id },
      data: updateData,
    });
  }

  async deletePromotion(id: number) {
    return this.prisma.promotion.update({
      where: { promotion_id: id },
      data: {
        is_delete: true,
        update_time: Math.floor(Date.now() / 1000),
      },
    });
  }

  async batchDelete(ids: number[]) {
    return this.prisma.promotion.updateMany({
      where: {
        promotion_id: {
          in: ids,
        },
      },
      data: {
        is_delete: true,
        update_time: Math.floor(Date.now() / 1000),
      },
    });
  }

  private getTypeText(type: number | string): string {
    // 兼容后端：type 为数值，含义在 PHP 端定义。这里保持直传或做有限映射。
    const map: Record<string, string> = {
      "1": "折扣",
      "2": "满减",
      "3": "赠品",
      "4": "包邮",
    };
    const key = String(type);
    return map[key] || key;
  }

  private getTimeText(promotion: any): string {
    const s = Number(promotion.start_time || 0);
    const e = Number(promotion.end_time || 0);
    if (s === 0 && e === 0) return "长期有效";
    // 简单格式：时间戳转 YYYY-MM-DD
    const fmt = (ts: number) => {
      if (!ts) return "";
      const d = new Date(ts * 1000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    return `${fmt(s)} 至 ${fmt(e)}`.trim();
  }
}
