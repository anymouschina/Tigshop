// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export enum BargainStatus {
  WAITING = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  ENDED = 2, // 已结束
  CANCELLED = 3, // 已取消
}

export enum BargainGroupStatus {
  IN_PROGRESS = 0, // 砍价中
  SUCCESS = 1, // 砍价成功
  FAILED = 2, // 砍价失败
  CANCELLED = 3, // 已取消
}

export const BARGAIN_STATUS_NAME = {
  [BargainStatus.WAITING]: "未开始",
  [BargainStatus.IN_PROGRESS]: "进行中",
  [BargainStatus.ENDED]: "已结束",
  [BargainStatus.CANCELLED]: "已取消",
};

export const BARGAIN_GROUP_STATUS_NAME = {
  [BargainGroupStatus.IN_PROGRESS]: "砍价中",
  [BargainGroupStatus.SUCCESS]: "砍价成功",
  [BargainGroupStatus.FAILED]: "砍价失败",
  [BargainGroupStatus.CANCELLED]: "已取消",
};

@Injectable()
export class BargainService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.bargain.findMany({
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
        product_sku: {
          select: {
            sku_id: true,
            sku_name: true,
            sku_image: true,
          },
        },
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
        _count: {
          select: {
            bargain_group: true,
          },
        },
      },
    });

    // 检查活动状态并更新
    const now = Math.floor(Date.now() / 1000);
    for (const result of results) {
      if (
        result.end_time < now &&
        result.status === BargainStatus.IN_PROGRESS
      ) {
        await this.prisma.bargain.update({
          where: { bargain_id: result.bargain_id },
          data: { status: BargainStatus.ENDED },
        });
        result.status = BargainStatus.ENDED;
      } else if (
        result.start_time > now &&
        result.status === BargainStatus.WAITING
      ) {
        // 活动开始时间已到，更新为进行中
        if (result.start_time <= now) {
          await this.prisma.bargain.update({
            where: { bargain_id: result.bargain_id },
            data: { status: BargainStatus.IN_PROGRESS },
          });
          result.status = BargainStatus.IN_PROGRESS;
        }
      }
    }

    return results.map((result) => ({
      ...result,
      status_name: this.getStatusName(result.status),
      start_time_text: this.formatTime(result.start_time),
      end_time_text: this.formatTime(result.end_time),
    }));
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.bargain.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          bargain_name: {
            contains: filter.keyword,
          },
        },
        {
          product: {
            product_name: {
              contains: filter.keyword,
            },
          },
        },
      ];
    }

    // 店铺筛选
    if (filter.shop_id && filter.shop_id > 0) {
      where.shop_id = filter.shop_id;
    }

    // 状态筛选
    if (filter.status !== undefined && filter.status !== "") {
      where.status = filter.status;
    }

    // 显示状态筛选
    if (filter.is_show !== undefined && filter.is_show !== "") {
      where.is_show = filter.is_show;
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
      bargain_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.bargain.findUnique({
      where: { bargain_id: id },
      include: {
        product: {
          select: {
            product_id: true,
            product_name: true,
            image: true,
          },
        },
        product_sku: {
          select: {
            sku_id: true,
            sku_name: true,
            sku_image: true,
          },
        },
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
        bargain_group: {
          include: {
            user: {
              select: {
                user_id: true,
                username: true,
              },
            },
            bargain_log: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    username: true,
                  },
                },
              },
              orderBy: {
                add_time: "desc",
              },
            },
          },
          orderBy: {
            create_time: "desc",
          },
          take: 10, // 只取最近10个砍价组
        },
      },
    });

    if (!result) {
      throw new Error("砍价活动不存在");
    }

    // 检查并更新状态
    const now = Math.floor(Date.now() / 1000);
    let currentStatus = result.status;
    if (result.end_time < now && result.status === BargainStatus.IN_PROGRESS) {
      currentStatus = BargainStatus.ENDED;
      await this.prisma.bargain.update({
        where: { bargain_id: id },
        data: { status: BargainStatus.ENDED },
      });
    } else if (
      result.start_time <= now &&
      result.status === BargainStatus.WAITING
    ) {
      currentStatus = BargainStatus.IN_PROGRESS;
      await this.prisma.bargain.update({
        where: { bargain_id: id },
        data: { status: BargainStatus.IN_PROGRESS },
      });
    }

    return {
      ...result,
      status: currentStatus,
      status_name: this.getStatusName(currentStatus),
      start_time_text: this.formatTime(result.start_time),
      end_time_text: this.formatTime(result.end_time),
      bargain_groups: result.bargain_group.map((group) => ({
        ...group,
        status_name: this.getGroupStatusName(group.status),
        bargain_logs: group.bargain_log.map((log) => ({
          ...log,
          add_time_text: this.formatTime(log.add_time),
        })),
      })),
    };
  }

  async create(data: any): Promise<any> {
    const now = Math.floor(Date.now() / 1000);

    // 验证时间
    if (data.start_time >= data.end_time) {
      throw new Error("开始时间必须小于结束时间");
    }

    // 验证价格
    if (data.cut_price_limit >= data.product_price) {
      throw new Error("目标价格必须小于原价");
    }

    const result = await this.prisma.bargain.create({
      data: {
        bargain_name: data.bargain_name,
        bargain_pic: data.bargain_pic || "",
        product_id: data.product_id,
        sku_id: data.sku_id || 0,
        product_price: data.product_price,
        cut_price_limit: data.cut_price_limit,
        cut_num_limit: data.cut_num_limit || 1,
        first_cut_range: data.first_cut_range || "0.01-0.10",
        cut_range: data.cut_range || "0.01-0.05",
        start_time: data.start_time,
        end_time: data.end_time,
        shop_id: data.shop_id || 1,
        is_show: data.is_show ?? 1,
        sort: data.sort || 0,
        create_time: now,
        update_time: now,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const bargain = await this.prisma.bargain.findUnique({
      where: { bargain_id: id },
    });

    if (!bargain) {
      throw new Error("砍价活动不存在");
    }

    // 验证时间
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      throw new Error("开始时间必须小于结束时间");
    }

    // 验证价格
    if (
      data.cut_price_limit &&
      data.product_price &&
      data.cut_price_limit >= data.product_price
    ) {
      throw new Error("目标价格必须小于原价");
    }

    const updateData: any = {
      update_time: Math.floor(Date.now() / 1000),
    };

    if (data.bargain_name !== undefined)
      updateData.bargain_name = data.bargain_name;
    if (data.bargain_pic !== undefined)
      updateData.bargain_pic = data.bargain_pic;
    if (data.product_id !== undefined) updateData.product_id = data.product_id;
    if (data.sku_id !== undefined) updateData.sku_id = data.sku_id;
    if (data.product_price !== undefined)
      updateData.product_price = data.product_price;
    if (data.cut_price_limit !== undefined)
      updateData.cut_price_limit = data.cut_price_limit;
    if (data.cut_num_limit !== undefined)
      updateData.cut_num_limit = data.cut_num_limit;
    if (data.first_cut_range !== undefined)
      updateData.first_cut_range = data.first_cut_range;
    if (data.cut_range !== undefined) updateData.cut_range = data.cut_range;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.shop_id !== undefined) updateData.shop_id = data.shop_id;
    if (data.is_show !== undefined) updateData.is_show = data.is_show;
    if (data.sort !== undefined) updateData.sort = data.sort;

    // 如果修改了时间，重新计算状态
    if (data.start_time !== undefined || data.end_time !== undefined) {
      const startTime = data.start_time || bargain.start_time;
      const endTime = data.end_time || bargain.end_time;
      updateData.status = this.calculateInitialStatus(startTime, endTime);
    }

    const result = await this.prisma.bargain.update({
      where: { bargain_id: id },
      data: updateData,
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const bargain = await this.prisma.bargain.findUnique({
      where: { bargain_id: id },
    });

    if (!bargain) {
      throw new Error("砍价活动不存在");
    }

    const updateData: any = {
      [field]: value,
      update_time: Math.floor(Date.now() / 1000),
    };

    const result = await this.prisma.bargain.update({
      where: { bargain_id: id },
      data: updateData,
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const bargain = await this.prisma.bargain.findUnique({
      where: { bargain_id: id },
    });

    if (!bargain) {
      throw new Error("砍价活动不存在");
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.bargain.delete({
        where: { bargain_id: id },
      });

      // 删除相关的砍价组和记录
      await prisma.bargain_group.deleteMany({
        where: { bargain_id: id },
      });

      await prisma.bargain_log.deleteMany({
        where: { bargain_id: id },
      });
    });

    return true;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.bargain.deleteMany({
        where: { bargain_id: { in: ids } },
      });

      // 删除相关的砍价组和记录
      await prisma.bargain_group.deleteMany({
        where: { bargain_id: { in: ids } },
      });

      await prisma.bargain_log.deleteMany({
        where: { bargain_id: { in: ids } },
      });
    });

    return true;
  }

  private calculateInitialStatus(startTime: number, endTime: number): number {
    const now = Math.floor(Date.now() / 1000);
    if (now < startTime) {
      return BargainStatus.WAITING;
    } else if (now >= startTime && now < endTime) {
      return BargainStatus.IN_PROGRESS;
    } else {
      return BargainStatus.ENDED;
    }
  }

  private getStatusName(status: number): string {
    return BARGAIN_STATUS_NAME[status] || "未知状态";
  }

  private getGroupStatusName(status: number): string {
    return BARGAIN_GROUP_STATUS_NAME[status] || "未知状态";
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString("zh-CN");
  }
}
