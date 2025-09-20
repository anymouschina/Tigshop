// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum MerchantStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已审核
  REJECTED = 2, // 已拒绝
  DISABLED = 3, // 已禁用
}

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    return this.prisma.merchant.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        merchant_account: true,
        merchant_user: true,
        shop: true,
      },
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.merchant.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          merchant_name: {
            contains: filter.keyword,
          },
        },
        {
          contact_person: {
            contains: filter.keyword,
          },
        },
        {
          mobile: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 状态筛选
    if (filter.status !== undefined && filter.status !== '') {
      where.status = filter.status;
    }

    // 时间筛选
    if (filter.add_time && filter.add_time.length === 2) {
      const [startDate, endDate] = filter.add_time;
      where.create_time = {
        gte: new Date(startDate).getTime() / 1000,
        lte: new Date(endDate).getTime() / 1000 + 86400,
      };
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
      merchant_id: 'desc',
    };
  }

  async getDetail(id: number): Promise<any> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { merchant_id: id },
      include: {
        merchant_account: true,
        merchant_user: true,
        shop: true,
      },
    });

    if (!merchant) {
      throw new Error('商家不存在');
    }

    return merchant;
  }

  async approveMerchant(id: number, adminId: number): Promise<boolean> {
    const merchant = await this.prisma.merchant.update({
      where: { merchant_id: id },
      data: {
        status: MerchantStatus.APPROVED,
        update_time: Math.floor(Date.now() / 1000),
        audit_time: Math.floor(Date.now() / 1000),
        audit_admin_id: adminId,
      },
    });

    return !!merchant;
  }

  async rejectMerchant(id: number, reason: string, adminId: number): Promise<boolean> {
    const merchant = await this.prisma.merchant.update({
      where: { merchant_id: id },
      data: {
        status: MerchantStatus.REJECTED,
        reject_reason: reason,
        update_time: Math.floor(Date.now() / 1000),
        audit_time: Math.floor(Date.now() / 1000),
        audit_admin_id: adminId,
      },
    });

    return !!merchant;
  }

  async disableMerchant(id: number): Promise<boolean> {
    const merchant = await this.prisma.merchant.update({
      where: { merchant_id: id },
      data: {
        status: MerchantStatus.DISABLED,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return !!merchant;
  }

  async enableMerchant(id: number): Promise<boolean> {
    const merchant = await this.prisma.merchant.update({
      where: { merchant_id: id },
      data: {
        status: MerchantStatus.APPROVED,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return !!merchant;
  }
}
