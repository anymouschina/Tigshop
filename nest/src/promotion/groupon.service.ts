// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export enum GrouponStatus {
  WAITING = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  ENDED = 2, // 已结束
  CANCELLED = 3, // 已取消
}

export const GROUPON_STATUS_NAME = {
  [GrouponStatus.WAITING]: "未开始",
  [GrouponStatus.IN_PROGRESS]: "进行中",
  [GrouponStatus.ENDED]: "已结束",
  [GrouponStatus.CANCELLED]: "已取消",
};

@Injectable()
export class GrouponService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.groupon.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results.map((result) => {
      const status = this.calculateStatusByTime(
        result.start_time,
        result.end_time,
      );
      return {
        ...result,
        status,
        status_name: this.getStatusName(status),
        start_time_text: this.formatTime(result.start_time),
        end_time_text: this.formatTime(result.end_time),
      };
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.groupon.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          groupon_name: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 店铺筛选
    if (filter.shop_id && filter.shop_id > -1) {
      where.shop_id = filter.shop_id;
    }

    // 状态筛选（基于时间）
    if (filter.status !== undefined && filter.status !== "") {
      const now = Math.floor(Date.now() / 1000);
      switch (Number(filter.status)) {
        case GrouponStatus.WAITING:
          where.start_time = { gt: now };
          break;
        case GrouponStatus.IN_PROGRESS:
          where.AND = [
            { start_time: { lte: now } },
            { end_time: { gte: now } },
          ];
          break;
        case GrouponStatus.ENDED:
          where.end_time = { lt: now };
          break;
        default:
          break;
      }
    }

    // 时间筛选
    if (filter.add_time && filter.add_time.length === 2) {
      const [startDate, endDate] = filter.add_time;
      where.add_time = {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000) + 86400,
      };
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      const sortFieldMap: Record<string, string> = {
        product_team_id: "groupon_id",
        product_team_name: "groupon_name",
        create_time: "add_time",
      };
      const field = sortFieldMap[filter.sort_field] || filter.sort_field;
      return { [field]: filter.sort_order };
    }
    return {
      groupon_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.groupon.findUnique({
      where: { groupon_id: id },
    });

    if (!result) {
      throw new Error("拼团活动不存在");
    }

    const items = await this.prisma.groupon_item.findMany({
      where: { groupon_id: id },
    });

    const currentStatus = this.calculateStatusByTime(
      result.start_time,
      result.end_time,
    );

    return {
      ...result,
      items: items.map((it) => ({
        sku_id: it.product_sku_id ?? 0,
        price: it.price,
        product_id: it.product_id ?? result.product_id ?? 0,
        start_time: it.start_time ?? result.start_time,
        end_time: it.end_time ?? result.end_time,
      })),
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
    if (
      await this.checkActivityIsExist(
        validatedData.product_id,
        validatedData.start_time,
        validatedData.end_time,
        0,
      )
    ) {
      throw new Error("当前时间内已存在拼团活动");
    }

    const itemData = validatedData.items;
    delete validatedData.items;

    const result = await this.prisma.groupon.create({
      data: {
        groupon_name: validatedData.product_team_name,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        limit_num: validatedData.limit_num,
        product_id: validatedData.product_id,
        shop_id: validatedData.shop_id ?? 0,
        add_time: now,
        team_num: validatedData.team_num ?? undefined,
        expiration_time: validatedData.expiration_time ?? undefined,
      },
    });

    // 创建拼团商品项
    if (itemData && itemData.length > 0) {
      for (const item of itemData) {
        await this.prisma.groupon_item.create({
          data: {
            groupon_id: result.groupon_id,
            product_id: validatedData.product_id,
            product_sku_id: item.sku_id || 0,
            price: item.price,
            start_time: validatedData.start_time,
            end_time: validatedData.end_time,
          },
        });
      }
    }

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const groupon = await this.prisma.groupon.findUnique({
      where: { groupon_id: id },
    });

    if (!groupon) {
      throw new Error("拼团活动不存在");
    }

    // 验证数据
    const validatedData = await this.getJudge({ ...data, product_team_id: id });

    // 检查活动冲突
    if (
      await this.checkActivityIsExist(
        validatedData.product_id,
        validatedData.start_time,
        validatedData.end_time,
        id,
      )
    ) {
      throw new Error("当前时间内已存在拼团活动");
    }

    const updateData: any = {
      groupon_name: validatedData.product_team_name,
      start_time: validatedData.start_time,
      end_time: validatedData.end_time,
      limit_num: validatedData.limit_num,
      product_id: validatedData.product_id,
      shop_id: validatedData.shop_id ?? groupon.shop_id ?? 0,
    };
    delete updateData.items;

    const result = await this.prisma.groupon.update({
      where: { groupon_id: id },
      data: updateData,
    });

    // 更新拼团商品项
    if (validatedData.items && validatedData.items.length > 0) {
      // 先删除原有商品项
      await this.prisma.groupon_item.deleteMany({
        where: { groupon_id: id },
      });

      // 重新创建商品项
      for (const item of validatedData.items) {
        await this.prisma.groupon_item.create({
          data: {
            groupon_id: id,
            product_id: validatedData.product_id,
            product_sku_id: item.sku_id || 0,
            price: item.price,
            start_time: validatedData.start_time,
            end_time: validatedData.end_time,
          },
        });
      }
    }

    return result;
  }

  async delete(id: number): Promise<boolean> {
    const groupon = await this.prisma.groupon.findUnique({
      where: { groupon_id: id },
    });

    if (!groupon) {
      throw new Error("拼团活动不存在");
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.groupon_item.deleteMany({
        where: { groupon_id: id },
      });
      await prisma.groupon.delete({
        where: { groupon_id: id },
      });
    });

    return true;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.groupon_item.deleteMany({
        where: { groupon_id: { in: ids } },
      });
      await prisma.groupon.deleteMany({
        where: { groupon_id: { in: ids } },
      });
    });

    return true;
  }

  async getProductActivityInfo(
    productId: number,
    skuId: number = 0,
  ): Promise<any> {
    const now = Math.floor(Date.now() / 1000);
    const where: any = {
      product_id: productId,
      product_sku_id: skuId,
      start_time: { lte: now },
      end_time: { gte: now },
    };

    const info = await this.prisma.groupon_item.findFirst({
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
      throw new Error("请选择参加拼团的商品");
    }

    return validatedData;
  }

  private async checkActivityIsExist(
    productId: number,
    startTime: number,
    endTime: number,
    excludeId: number = 0,
  ): Promise<boolean> {
    const conflictingActivities = await this.prisma.groupon_item.findMany({
      where: {
        product_id: productId,
        start_time: { lte: endTime },
        end_time: { gte: startTime },
        NOT: {
          groupon_id: excludeId,
        },
      },
    });

    return conflictingActivities.length > 0;
  }

  private getStatusName(status: number): string {
    return GROUPON_STATUS_NAME[status] || "未知状态";
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString("zh-CN");
  }

  private calculateStatusByTime(
    startTime?: number | null,
    endTime?: number | null,
  ): GrouponStatus {
    const now = Math.floor(Date.now() / 1000);
    if (!startTime || !endTime) return GrouponStatus.WAITING;
    if (endTime < now) return GrouponStatus.ENDED;
    if (startTime > now) return GrouponStatus.WAITING;
    return GrouponStatus.IN_PROGRESS;
  }
}
