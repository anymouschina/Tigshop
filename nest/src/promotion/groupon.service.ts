import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum GrouponStatus {
  WAITING = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  ENDED = 2, // 已结束
  CANCELLED = 3, // 已取消
}

export const GROUPON_STATUS_NAME = {
  [GrouponStatus.WAITING]: '未开始',
  [GrouponStatus.IN_PROGRESS]: '进行中',
  [GrouponStatus.ENDED]: '已结束',
  [GrouponStatus.CANCELLED]: '已取消',
};

@Injectable()
export class GrouponService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.productTeam.findMany({
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
        items: {
          include: {
            product_sku: {
              select: {
                sku_id: true,
                sku_name: true,
                sku_image: true,
              },
            },
          },
        },
      },
    });

    // 检查活动状态并更新
    const now = Math.floor(Date.now() / 1000);
    for (const result of results) {
      if (result.end_time < now && result.status === GrouponStatus.IN_PROGRESS) {
        await this.prisma.productTeam.update({
          where: { product_team_id: result.product_team_id },
          data: { status: GrouponStatus.ENDED },
        });
        result.status = GrouponStatus.ENDED;
      } else if (result.start_time > now && result.status === GrouponStatus.WAITING) {
        // 活动开始时间已到，更新为进行中
        if (result.start_time <= now) {
          await this.prisma.productTeam.update({
            where: { product_team_id: result.product_team_id },
            data: { status: GrouponStatus.IN_PROGRESS },
          });
          result.status = GrouponStatus.IN_PROGRESS;
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
    return this.prisma.productTeam.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          product_team_name: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 店铺筛选
    if (filter.shop_id && filter.shop_id > -1) {
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
      product_team_id: 'desc',
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.productTeam.findUnique({
      where: { product_team_id: id },
      include: {
        product: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
          },
        },
        items: {
          include: {
            product_sku: {
              select: {
                sku_id: true,
                sku_name: true,
                sku_image: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new Error('拼团活动不存在');
    }

    // 检查并更新状态
    const now = Math.floor(Date.now() / 1000);
    let currentStatus = result.status;
    if (result.end_time < now && result.status === GrouponStatus.IN_PROGRESS) {
      currentStatus = GrouponStatus.ENDED;
      await this.prisma.productTeam.update({
        where: { product_team_id: id },
        data: { status: GrouponStatus.ENDED },
      });
    } else if (result.start_time <= now && result.status === GrouponStatus.WAITING) {
      currentStatus = GrouponStatus.IN_PROGRESS;
      await this.prisma.productTeam.update({
        where: { product_team_id: id },
        data: { status: GrouponStatus.IN_PROGRESS },
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

    // 验证数据
    const validatedData = await this.getJudge(data);

    // 检查活动冲突
    if (await this.checkActivityIsExist(
      validatedData.product_id,
      validatedData.start_time,
      validatedData.end_time,
      0
    )) {
      throw new Error('当前时间内已存在拼团活动');
    }

    const itemData = validatedData.items;
    delete validatedData.items;

    const result = await this.prisma.productTeam.create({
      data: {
        ...validatedData,
        create_time: now,
        update_time: now,
      },
    });

    // 创建拼团商品项
    if (itemData && itemData.length > 0) {
      for (const item of itemData) {
        await this.prisma.productTeamItem.create({
          data: {
            product_team_id: result.product_team_id,
            product_id: validatedData.product_id,
            sku_id: item.sku_id || 0,
            price: item.price,
            start_time: validatedData.start_time,
            end_time: validatedData.end_time,
            shop_id: validatedData.shop_id,
            create_time: now,
          },
        });
      }
    }

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const groupon = await this.prisma.productTeam.findUnique({
      where: { product_team_id: id },
    });

    if (!groupon) {
      throw new Error('拼团活动不存在');
    }

    // 验证数据
    const validatedData = await this.getJudge({ ...data, product_team_id: id });

    // 检查活动冲突
    if (await this.checkActivityIsExist(
      validatedData.product_id,
      validatedData.start_time,
      validatedData.end_time,
      id
    )) {
      throw new Error('当前时间内已存在拼团活动');
    }

    const updateData: any = {
      ...validatedData,
      update_time: Math.floor(Date.now() / 1000),
    };
    delete updateData.items;

    const result = await this.prisma.productTeam.update({
      where: { product_team_id: id },
      data: updateData,
    });

    // 更新拼团商品项
    if (validatedData.items && validatedData.items.length > 0) {
      // 先删除原有商品项
      await this.prisma.productTeamItem.deleteMany({
        where: { product_team_id: id },
      });

      // 重新创建商品项
      for (const item of validatedData.items) {
        await this.prisma.productTeamItem.create({
          data: {
            product_team_id: id,
            product_id: validatedData.product_id,
            sku_id: item.sku_id || 0,
            price: item.price,
            start_time: validatedData.start_time,
            end_time: validatedData.end_time,
            shop_id: validatedData.shop_id,
            create_time: Math.floor(Date.now() / 1000),
          },
        });
      }
    }

    return result;
  }

  async delete(id: number): Promise<boolean> {
    const groupon = await this.prisma.productTeam.findUnique({
      where: { product_team_id: id },
    });

    if (!groupon) {
      throw new Error('拼团活动不存在');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.productTeam.delete({
        where: { product_team_id: id },
      });

      await prisma.productTeamItem.deleteMany({
        where: { product_team_id: id },
      });
    });

    return true;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.productTeam.deleteMany({
        where: { product_team_id: { in: ids } },
      });

      await prisma.productTeamItem.deleteMany({
        where: { product_team_id: { in: ids } },
      });
    });

    return true;
  }

  async getProductActivityInfo(productId: number, skuId: number = 0): Promise<any> {
    const now = Math.floor(Date.now() / 1000);
    const where: any = {
      product_id: productId,
      sku_id: skuId,
      start_time: { lte: now },
      end_time: { gte: now },
    };

    const info = await this.prisma.productTeamItem.findFirst({
      where,
    });

    return info || {};
  }

  private async getJudge(data: any): Promise<any> {
    const validatedData = {
      product_team_name: data.product_team_name,
      start_time: data.start_time,
      end_time: data.end_time,
      limit_num: data.limit_num,
      product_id: data.product_id,
    };

    if (data.shop_id !== undefined) {
      validatedData.shop_id = data.shop_id;
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('请选择参加拼团的商品');
    }

    return validatedData;
  }

  private async checkActivityIsExist(
    productId: number,
    startTime: number,
    endTime: number,
    excludeId: number = 0
  ): Promise<boolean> {
    const conflictingActivities = await this.prisma.seckillItem.findMany({
      where: {
        product_id: productId,
        start_time: { lte: endTime },
        end_time: { gte: startTime },
        NOT: {
          product_team_id: excludeId,
        },
      },
    });

    return conflictingActivities.length > 0;
  }

  private getStatusName(status: number): string {
    return GROUPON_STATUS_NAME[status] || '未知状态';
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  }
}