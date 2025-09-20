// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum SeckillStatus {
  WAITING = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  ENDED = 2, // 已结束
  CANCELLED = 3, // 已取消
}

export const SECKILL_STATUS_NAME = {
  [SeckillStatus.WAITING]: '未开始',
  [SeckillStatus.IN_PROGRESS]: '进行中',
  [SeckillStatus.ENDED]: '已结束',
  [SeckillStatus.CANCELLED]: '已取消',
};

@Injectable()
export class SeckillService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.seckill.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
        seckill_items: {
          include: {
            items: {
              select: {
                item_id: true,
                item_name: true,
                item_price: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // 检查活动状态并更新
    const now = Math.floor(Date.now() / 1000);
    for (const result of results) {
      if (result.end_time < now && result.status === SeckillStatus.IN_PROGRESS) {
        await this.prisma.seckill.update({
          where: { seckill_id: result.seckill_id },
          data: { status: SeckillStatus.ENDED },
        });
        result.status = SeckillStatus.ENDED;
      } else if (result.start_time > now && result.status === SeckillStatus.WAITING) {
        // 活动开始时间已到，更新为进行中
        if (result.start_time <= now) {
          await this.prisma.seckill.update({
            where: { seckill_id: result.seckill_id },
            data: { status: SeckillStatus.IN_PROGRESS },
          });
          result.status = SeckillStatus.IN_PROGRESS;
        }
      }
    }

    return results.map(result => ({
      ...result,
      status_name: this.getStatusName(result.status),
      start_time_text: this.formatTime(result.start_time),
      end_time_text: this.formatTime(result.end_time),
    }));
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.seckill.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          seckill_name: {
            contains: filter.keyword,
          },
        },
        {
          seckill_remark: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 店铺筛选
    if (filter.shop_id && filter.shop_id > 0) {
      where.shop_id = filter.shop_id;
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
      seckill_id: 'desc',
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.seckill.findUnique({
      where: { seckill_id: id },
      include: {
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
        seckill_items: {
          include: {
            items: {
              select: {
                item_id: true,
                item_name: true,
                item_price: true,
                image: true,
                product: {
                  select: {
                    suppliers_id: true,
                    suppliers_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new Error('秒杀活动不存在');
    }

    // 检查并更新状态
    const now = Math.floor(Date.now() / 1000);
    let currentStatus = result.status;
    if (result.end_time < now && result.status === SeckillStatus.IN_PROGRESS) {
      currentStatus = SeckillStatus.ENDED;
      await this.prisma.seckill.update({
        where: { seckill_id: id },
        data: { status: SeckillStatus.ENDED },
      });
    } else if (result.start_time <= now && result.status === SeckillStatus.WAITING) {
      currentStatus = SeckillStatus.IN_PROGRESS;
      await this.prisma.seckill.update({
        where: { seckill_id: id },
        data: { status: SeckillStatus.IN_PROGRESS },
      });
    }

    return {
      ...result,
      status: currentStatus,
      status_name: this.getStatusName(currentStatus),
      start_time_text: this.formatTime(result.start_time),
      end_time_text: this.formatTime(result.end_time),
    };
  }

  async create(data: any): Promise<any> {
    const now = Math.floor(Date.now() / 1000);

    // 验证时间
    if (data.start_time >= data.end_time) {
      throw new Error('开始时间必须小于结束时间');
    }

    const result = await this.prisma.seckill.create({
      data: {
        seckill_name: data.seckill_name,
        seckill_remark: data.seckill_remark || '',
        start_time: data.start_time,
        end_time: data.end_time,
        shop_id: data.shop_id,
        sort: data.sort || 0,
        status: this.calculateInitialStatus(data.start_time, data.end_time),
        create_time: now,
        update_time: now,
      },
    });

    // 创建秒杀商品
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await this.prisma.seckill_items.create({
          data: {
            seckill_id: result.seckill_id,
            item_id: item.item_id,
            seckill_price: item.seckill_price,
            seckill_stock: item.seckill_stock,
            limit_num: item.limit_num || 0,
            create_time: now,
          },
        });
      }
    }

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const seckill = await this.prisma.seckill.findUnique({
      where: { seckill_id: id },
    });

    if (!seckill) {
      throw new Error('秒杀活动不存在');
    }

    // 验证时间
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      throw new Error('开始时间必须小于结束时间');
    }

    const updateData: any = {
      update_time: Math.floor(Date.now() / 1000),
    };

    if (data.seckill_name !== undefined) updateData.seckill_name = data.seckill_name;
    if (data.seckill_remark !== undefined) updateData.seckill_remark = data.seckill_remark;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.shop_id !== undefined) updateData.shop_id = data.shop_id;
    if (data.sort !== undefined) updateData.sort = data.sort;

    // 如果修改了时间，重新计算状态
    if (data.start_time !== undefined || data.end_time !== undefined) {
      const startTime = data.start_time || seckill.start_time;
      const endTime = data.end_time || seckill.end_time;
      updateData.status = this.calculateInitialStatus(startTime, endTime);
    }

    const result = await this.prisma.seckill.update({
      where: { seckill_id: id },
      data: updateData,
    });

    // 更新秒杀商品
    if (data.items && data.items.length > 0) {
      // 先删除原有商品
      await this.prisma.seckill_items.deleteMany({
        where: { seckill_id: id },
      });

      // 重新创建商品
      for (const item of data.items) {
        await this.prisma.seckill_items.create({
          data: {
            seckill_id: id,
            item_id: item.item_id,
            seckill_price: item.seckill_price,
            seckill_stock: item.seckill_stock,
            limit_num: item.limit_num || 0,
            create_time: Math.floor(Date.now() / 1000),
          },
        });
      }
    }

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const seckill = await this.prisma.seckill.findUnique({
      where: { seckill_id: id },
    });

    if (!seckill) {
      throw new Error('秒杀活动不存在');
    }

    const updateData: any = {
      [field]: value,
      update_time: Math.floor(Date.now() / 1000),
    };

    const result = await this.prisma.seckill.update({
      where: { seckill_id: id },
      data: updateData,
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.prisma.seckill.delete({
      where: { seckill_id: id },
    });

    // 同时删除关联的商品
    await this.prisma.seckill_items.deleteMany({
      where: { seckill_id: id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.seckill.deleteMany({
      where: { seckill_id: { in: ids } },
    });

    // 同时删除关联的商品
    await this.prisma.seckill_items.deleteMany({
      where: { seckill_id: { in: ids } },
    });

    return true;
  }

  private calculateInitialStatus(startTime: number, endTime: number): number {
    const now = Math.floor(Date.now() / 1000);
    if (now < startTime) {
      return SeckillStatus.WAITING;
    } else if (now >= startTime && now < endTime) {
      return SeckillStatus.IN_PROGRESS;
    } else {
      return SeckillStatus.ENDED;
    }
  }

  private getStatusName(status: number): string {
    return SECKILL_STATUS_NAME[status] || '未知状态';
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  }
}
