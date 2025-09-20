// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const where: any = {
      shop_id: filter.shop_id,
    };

    if (filter.keyword) {
      where.coupon_name = {
        contains: filter.keyword,
      };
    }

    const orderBy: any = {};
    orderBy[filter.sort_field || 'coupon_id'] = filter.sort_order || 'desc';

    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    return this.prisma.coupon.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where: any = {
      shop_id: filter.shop_id,
    };

    if (filter.keyword) {
      where.coupon_name = {
        contains: filter.keyword,
      };
    }

    return this.prisma.coupon.count({ where });
  }

  async getDetail(id: number) {
    return this.prisma.coupon.findUnique({
      where: { coupon_id: id },
    });
  }

  async createCoupon(createCouponDto: CreateCouponDto) {
    const data = {
      ...createCouponDto,
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000),
    };

    return this.prisma.coupon.create({
      data,
    });
  }

  async updateCoupon(id: number, updateCouponDto: UpdateCouponDto) {
    const data = {
      ...updateCouponDto,
      update_time: Math.floor(Date.now() / 1000),
    };

    delete data.coupon_id;

    return this.prisma.coupon.update({
      where: { coupon_id: id },
      data,
    });
  }

  async updateCouponField(id: number, field: string, value: any) {
    const updateData: any = {
      [field]: value,
      update_time: Math.floor(Date.now() / 1000),
    };

    return this.prisma.coupon.update({
      where: { coupon_id: id },
      data: updateData,
    });
  }

  async deleteCoupon(id: number) {
    return this.prisma.coupon.delete({
      where: { coupon_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    return this.prisma.coupon.deleteMany({
      where: {
        coupon_id: {
          in: ids,
        },
      },
    });
  }

  async getUserRankList() {
    return this.prisma.user_rank.findMany({
      where: {
        is_delete: 0,
        is_show: 1,
      },
      orderBy: {
        sort_order: 'asc',
      },
    });
  }
}
