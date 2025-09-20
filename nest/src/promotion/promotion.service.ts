// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePromotionDto, UpdatePromotionDto, PromotionType, TimeType } from './dto/promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any, select: string[] = [], append: string[] = []) {
    const where: any = {
      is_delete: 0,
      shop_id: filter.shop_id,
    };

    if (filter.time_type) {
      where.time_type = filter.time_type;
    }

    if (filter.type) {
      where.promotion_type = filter.type;
    }

    if (filter.keyword) {
      where.promotion_name = {
        contains: filter.keyword,
      };
    }

    const orderBy: any = {};
    orderBy[filter.sort_field || 'promotion_id'] = filter.sort_order || 'desc';

    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const promotions = await this.prisma.promotion.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    // 处理附加字段
    return promotions.map(promotion => {
      const result: any = { ...promotion };

      // 添加类型文本
      if (append.includes('type_text')) {
        result.type_text = this.getTypeText(promotion.promotion_type);
      }

      // 添加时间文本
      if (append.includes('time_text')) {
        result.time_text = this.getTimeText(promotion);
      }

      return result;
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where: any = {
      is_delete: 0,
      shop_id: filter.shop_id,
    };

    if (filter.time_type) {
      where.time_type = filter.time_type;
    }

    if (filter.type) {
      where.promotion_type = filter.type;
    }

    if (filter.keyword) {
      where.promotion_name = {
        contains: filter.keyword,
      };
    }

    return this.prisma.promotion.count({ where });
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
        is_delete: 1,
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
        is_delete: 1,
        update_time: Math.floor(Date.now() / 1000),
      },
    });
  }

  private getTypeText(type: string): string {
    const typeMap = {
      [PromotionType.DISCOUNT]: '折扣',
      [PromotionType.REDUCE]: '满减',
      [PromotionType.GIFT]: '赠品',
      [PromotionType.SHIPPING]: '包邮',
    };
    return typeMap[type as PromotionType] || type;
  }

  private getTimeText(promotion: any): string {
    if (promotion.time_type === TimeType.PERMANENT) {
      return '长期有效';
    } else if (promotion.time_type === TimeType.RELATIVE) {
      return `领取后${promotion.delay_day || 0}天生效，有效期${promotion.use_day || 0}天`;
    } else {
      return `${promotion.start_time} 至 ${promotion.end_time}`;
    }
  }
}
