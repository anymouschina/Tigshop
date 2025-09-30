// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export enum SeckillStatus {
  WAITING = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  ENDED = 2, // 已结束
  CANCELLED = 3, // 已取消
}

export const SECKILL_STATUS_NAME = {
  [SeckillStatus.WAITING]: "未开始",
  [SeckillStatus.IN_PROGRESS]: "进行中",
  [SeckillStatus.ENDED]: "已结束",
  [SeckillStatus.CANCELLED]: "已取消",
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
    });

    const now = Math.floor(Date.now() / 1000);
    return results.map((result) => {
      const status = this.calculateStatusByTime(
        result.seckill_start_time ?? 0,
        result.seckill_end_time ?? 0,
        now,
      );
      return {
        ...result,
        status,
        status_name: this.getStatusName(status),
        start_time_text: this.formatTime(result.seckill_start_time ?? 0),
        end_time_text: this.formatTime(result.seckill_end_time ?? 0),
      };
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.seckill.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索（仅按名称）
    if (filter.keyword) {
      where.seckill_name = { contains: String(filter.keyword) };
    }

    // 店铺筛选
    if (filter.shop_id && Number(filter.shop_id) > 0) {
      where.shop_id = Number(filter.shop_id);
    }

    // 状态筛选（基于当前时间推导）
    if (filter.status !== undefined && filter.status !== "") {
      const now = Math.floor(Date.now() / 1000);
      const statusNum = Number(filter.status);
      if (statusNum === SeckillStatus.WAITING) {
        where.seckill_start_time = { gt: now };
      } else if (statusNum === SeckillStatus.IN_PROGRESS) {
        where.AND = [
          { seckill_start_time: { lte: now } },
          { seckill_end_time: { gt: now } },
        ];
      } else if (statusNum === SeckillStatus.ENDED) {
        where.seckill_end_time = { lte: now };
      }
    }

    // 时间筛选（解释为开始/结束时间区间重叠）
    if (Array.isArray(filter.add_time) && filter.add_time.length === 2) {
      const [startDate, endDate] = filter.add_time;
      const startSec = Math.floor(new Date(startDate).getTime() / 1000);
      const endSec = Math.floor(new Date(endDate).getTime() / 1000) + 86400;
      where.AND = where.AND || [];
      where.AND.push({ seckill_start_time: { gte: startSec } });
      where.AND.push({ seckill_end_time: { lte: endSec } });
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
      seckill_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.seckill.findUnique({
      where: { seckill_id: id },
    });

    if (!result) {
      throw new Error("秒杀活动不存在");
    }

    // 组装关联的商品信息
    const items = await this.prisma.seckill_item.findMany({
      where: { seckill_id: id },
    });
    const productIds = Array.from(
      new Set(items.map((it) => it.product_id).filter(Boolean) as number[]),
    );
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { product_id: { in: productIds } },
          select: {
            product_id: true,
            product_name: true,
            product_price: true,
            pic_thumb: true,
          },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.product_id, p]));

    const now = Math.floor(Date.now() / 1000);
    const currentStatus = this.calculateStatusByTime(
      result.seckill_start_time ?? 0,
      result.seckill_end_time ?? 0,
      now,
    );

    return {
      ...result,
      status: currentStatus,
      status_name: this.getStatusName(currentStatus),
      start_time_text: this.formatTime(result.seckill_start_time ?? 0),
      end_time_text: this.formatTime(result.seckill_end_time ?? 0),
      seckill_items: items.map((it) => ({
        ...it,
        product: productMap.get(it.product_id ?? 0) || null,
      })),
    };
  }

  // 装修用：获取秒杀商品列表（对齐 PHP getSeckillProductList）
  async getSeckillProductList(params: any): Promise<{ list: any[]; total: number }> {
    const page = Number(params.page || 1);
    const size = Number(params.size || 15);
    const skip = (page - 1) * size;
    const now = Math.floor(Date.now() / 1000);

    const where: any = {};
    if (params.un_started) {
      where.seckill_start_time = { gt: now };
    } else {
      where.AND = [
        { seckill_start_time: { lt: now } },
        { seckill_end_time: { gt: now } },
      ];
    }

    // 取出秒杀与其条目（按价格升序）
    const seckills = await this.prisma.seckill.findMany({
      where,
      skip,
      take: size,
      orderBy: { seckill_id: "desc" },
    });

    const seckillIds = seckills.map((s) => s.seckill_id);
    const items = seckillIds.length
      ? await this.prisma.seckill_item.findMany({
          where: { seckill_id: { in: seckillIds } },
          orderBy: { seckill_price: "asc" },
        })
      : [];

    // 聚合产品维度统计
    const productStats = new Map<number, { sales: number; stock: number; sku_id?: number; sku_sn?: string }>();
    const seckillByProduct = new Map<number, any>();
    const productIds: number[] = [];
    for (const s of seckills) {
      if (s.product_id) seckillByProduct.set(s.product_id, s);
    }
    for (const it of items) {
      const pid = it.product_id ?? 0;
      if (!pid) continue;
      productIds.push(pid);
      const st = productStats.get(pid) || { sales: 0, stock: 0 };
      st.sales += Number(it.seckill_sales ?? 0);
      st.stock += Number(it.seckill_stock ?? 0);
      if (st.sku_id == null && it.sku_id) st.sku_id = Number(it.sku_id);
      productStats.set(pid, st);
    }

    const uniqProductIds = Array.from(new Set(productIds));
    let products: any[] = [];
    if (uniqProductIds.length) {
      products = await this.prisma.product.findMany({
        where: { product_id: { in: uniqProductIds } },
        select: {
          product_id: true,
          product_name: true,
          product_price: true,
          market_price: true,
          pic_thumb: true,
        },
      });
    }
    const skus = uniqProductIds.length
      ? await this.prisma.product_sku.findMany({
          where: { product_id: { in: uniqProductIds } },
          select: { sku_id: true, product_id: true, sku_price: true, sku_sn: true },
        })
      : [];
    const skuByProduct = new Map<number, any[]>();
    for (const s of skus) {
      const arr = skuByProduct.get(s.product_id) || [];
      arr.push(s);
      skuByProduct.set(s.product_id, arr);
    }
    // sku_sn 需从 product_sku 里找 sku_id 对应项
    return {
      list: products.map((p) => {
        const st = productStats.get(p.product_id) || { sales: 0, stock: 0 };
        const sec = seckillByProduct.get(p.product_id);
        let market_price = p.product_price;
        let sku_sn = "";
        if (st.sku_id) {
          const list = skuByProduct.get(p.product_id) || [];
          const sku = list.find((x: any) => Number(x.sku_id) === Number(st.sku_id));
          if (sku) {
            market_price = sku.sku_price ?? market_price;
            sku_sn = sku.sku_sn ?? "";
          }
        }
        return {
          ...p,
          seckill_limit_num: sec?.seckill_limit_num ?? 0,
          seckill_sales: st.sales,
          seckill_stock: st.stock,
          seckkill_data: sec || null,
          sku_id: st.sku_id ?? 0,
          sku_sn,
          market_price,
        };
      }),
      total: products.length,
    };
  }

  async create(data: any): Promise<any> {
    // 验证时间
    if (Number(data.start_time) >= Number(data.end_time)) {
      throw new Error("开始时间必须小于结束时间");
    }

    const result = await this.prisma.seckill.create({
      data: {
        seckill_name: data.seckill_name ?? "",
        seckill_start_time: Number(data.start_time),
        seckill_end_time: Number(data.end_time),
        seckill_limit_num: Number(data.seckill_limit_num ?? 0),
        product_id: Number(data.product_id ?? 0),
        shop_id: Number(data.shop_id ?? 0),
      },
    });

    // 创建秒杀商品
    if (Array.isArray(data.items) && data.items.length > 0) {
      for (const item of data.items) {
        await this.prisma.seckill_item.create({
          data: {
            seckill_id: result.seckill_id,
            product_id: Number(item.product_id ?? 0),
            sku_id: Number(item.sku_id ?? 0),
            seckill_price: item.seckill_price ?? 0,
            seckill_stock: Number(item.seckill_stock ?? 0),
            seckill_start_time: Number(item.start_time ?? data.start_time ?? 0),
            seckill_end_time: Number(item.end_time ?? data.end_time ?? 0),
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
      throw new Error("秒杀活动不存在");
    }

    // 验证时间
    if (
      data.start_time !== undefined &&
      data.end_time !== undefined &&
      Number(data.start_time) >= Number(data.end_time)
    ) {
      throw new Error("开始时间必须小于结束时间");
    }

    const updateData: any = {};

    if (data.seckill_name !== undefined)
      updateData.seckill_name = data.seckill_name;
    if (data.start_time !== undefined)
      updateData.seckill_start_time = Number(data.start_time);
    if (data.end_time !== undefined)
      updateData.seckill_end_time = Number(data.end_time);
    if (data.seckill_limit_num !== undefined)
      updateData.seckill_limit_num = Number(data.seckill_limit_num);
    if (data.product_id !== undefined)
      updateData.product_id = Number(data.product_id);
    if (data.shop_id !== undefined) updateData.shop_id = Number(data.shop_id);

    const result = await this.prisma.seckill.update({
      where: { seckill_id: id },
      data: updateData,
    });

    // 更新秒杀商品
    if (Array.isArray(data.items)) {
      // 先删除原有商品
      await this.prisma.seckill_item.deleteMany({ where: { seckill_id: id } });

      // 重新创建商品
      for (const item of data.items) {
        await this.prisma.seckill_item.create({
          data: {
            seckill_id: id,
            product_id: Number(item.product_id ?? 0),
            sku_id: Number(item.sku_id ?? 0),
            seckill_price: item.seckill_price ?? 0,
            seckill_stock: Number(item.seckill_stock ?? 0),
            seckill_start_time: Number(
              item.start_time ?? result.seckill_start_time ?? 0,
            ),
            seckill_end_time: Number(
              item.end_time ?? result.seckill_end_time ?? 0,
            ),
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
      throw new Error("秒杀活动不存在");
    }

    // 字段白名单映射
    const fieldMap: Record<string, string> = {
      seckillName: "seckill_name",
      seckill_start_time: "seckill_start_time",
      seckill_end_time: "seckill_end_time",
      start_time: "seckill_start_time",
      end_time: "seckill_end_time",
      seckill_limit_num: "seckill_limit_num",
      product_id: "product_id",
      shop_id: "shop_id",
    };
    const realField = fieldMap[field] || field;
    const result = await this.prisma.seckill.update({
      where: { seckill_id: id },
      data: { [realField]: value },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.prisma.seckill.delete({
      where: { seckill_id: id },
    });
    await this.prisma.seckill_item.deleteMany({ where: { seckill_id: id } });
    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.seckill.deleteMany({
      where: { seckill_id: { in: ids } },
    });
    await this.prisma.seckill_item.deleteMany({
      where: { seckill_id: { in: ids } },
    });
    return true;
  }

  private calculateInitialStatus(startTime: number, endTime: number): number {
    const now = Math.floor(Date.now() / 1000);
    return this.calculateStatusByTime(startTime, endTime, now);
  }

  private calculateStatusByTime(
    startTime: number,
    endTime: number,
    now: number,
  ): number {
    if (now < startTime) return SeckillStatus.WAITING;
    if (now >= startTime && now < endTime) return SeckillStatus.IN_PROGRESS;
    return SeckillStatus.ENDED;
  }

  private getStatusName(status: number): string {
    return SECKILL_STATUS_NAME[status] || "未知状态";
  }

  private formatTime(timestamp: number): string {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleString("zh-CN");
  }
}
