// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCouponDto, UpdateCouponDto } from "./dto/coupon.dto";

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any) {
    const where: any = { shop_id: filter.shop_id };
    if (filter.keyword) where.coupon_name = { contains: filter.keyword };
    const orderBy: any = { [filter.sort_field || "coupon_id"]: filter.sort_order || "desc" };
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const rows = await this.prisma.coupon.findMany({ where, orderBy, skip, take });

    // 批量统计领取数量 receiveNum
    const ids = rows.map((r: any) => r.coupon_id);
    let recvMap: Record<number, number> = {};
    if (ids.length > 0) {
      try {
        // 优先使用 groupBy（Prisma >=2.13 支持）
        const grouped: any[] = await (this.prisma as any).user_coupon.groupBy({
          by: ["coupon_id"],
          where: { coupon_id: { in: ids } },
          _count: { coupon_id: true },
        });
        recvMap = grouped.reduce((acc: any, g: any) => {
          acc[g.coupon_id] = g._count?.coupon_id ?? 0;
          return acc;
        }, {} as Record<number, number>);
      } catch (e) {
        // 兼容旧版 Prisma：降级为 Promise.all 逐一 count
        const list = await Promise.all(
          ids.map(async (id: number) => [id, await this.prisma.user_coupon.count({ where: { coupon_id: id } })] as const),
        );
        recvMap = Object.fromEntries(list);
      }
    }

    const to2 = (v: any) => (v == null ? "0.00" : Number(v).toFixed(2));
    const to1 = (v: any) => (v == null ? "0.0" : Number(v).toFixed(1));
    const fmt = (ts?: number) => {
      const t = Number(ts || 0);
      if (!t) return "";
      const d = new Date(t * 1000);
      const p = (n: number) => (n < 10 ? "0" + n : String(n));
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    const parseList = (raw: any): any[] => {
      if (raw == null) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw !== "string") return [];
      const s = raw.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        if (s.includes(",")) return s.split(",").map((x) => Number(x)).filter((n) => Number.isFinite(n));
        const n = Number(s);
        return Number.isFinite(n) ? [n] : [];
      }
    };
    const parseRanks = (raw: any): number[] => {
      if (raw == null) return [];
      if (Array.isArray(raw)) return raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
      const s = String(raw).trim();
      if (!s) return [];
      return s
        .split(",")
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));
    };

    // 映射为 PHP 兼容的驼峰结构
    const mapped = rows.map((r: any) => {
      const useStart = fmt(r.use_start_date);
      const useEnd = fmt(r.use_end_date);
      return {
        isReceive: r.is_new_user === 1 ? 1 : 0,
        receiveNum: recvMap[r.coupon_id] || 0,
        couponId: r.coupon_id,
        couponName: r.coupon_name,
        couponMoney: to2(r.coupon_money),
        couponDiscount: to1(r.coupon_discount),
        couponDesc: r.coupon_desc ?? "",
        couponType: Number(r.coupon_type ?? 1),
        sendRange: Number(r.send_range ?? 0),
        sendRangeData: parseList(r.send_range_data),
        minOrderAmount: to2(r.min_order_amount),
        sendStartDate: fmt(r.send_start_date),
        sendEndDate: fmt(r.send_end_date),
        sendType: Number(r.send_type ?? 0),
        useDay: Number(r.use_day ?? 0),
        useStartDate: useStart,
        useEndDate: useEnd,
        isShow: Number(r.is_show ?? 0),
        isGlobal: Number(r.is_global ?? 0),
        isNewUser: Number(r.is_new_user ?? 0),
        enabledClickGet: Number(r.enabled_click_get ?? 0),
        limitUserRank: parseRanks(r.limit_user_rank),
        shopId: Number(r.shop_id ?? 0),
        isDelete: r.is_delete ? 1 : 0,
        limitNum: Number(r.limit_num ?? 0),
        delayDay: Number(r.delay_day ?? 0),
        sendNum: Number(r.send_num ?? 0),
        maxOrderAmount: to2(r.max_order_amount),
        couponUnit: Number(r.coupon_unit ?? 1),
        reduceType: Number(r.reduce_type ?? 1),
        addTime: fmt(r.add_time),
        timeText: useStart && useEnd ? `${useStart} 至 ${useEnd}` : "",
      };
    });

    return mapped;
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
    // DTO 为驼峰，Prisma 为下划线；同时布尔需转 0/1，日期需转时间戳
    const now = Math.floor(Date.now() / 1000);
    const parseDateToTs = (s?: string) => {
      if (!s) return 0;
      const t = Date.parse(s.replace(/-/g, "/"));
      return Number.isNaN(t) ? 0 : Math.floor(t / 1000);
    };

    const payload = createCouponDto as any;

  const data: any = {
      // 必填/主字段
      coupon_name: payload.couponName ?? payload.coupon_name,
      coupon_desc: payload.couponDesc ?? payload.coupon_desc ?? "",
      coupon_type: Number(payload.couponType ?? payload.coupon_type ?? 1),
      coupon_money: Number(payload.couponMoney ?? payload.coupon_money ?? 0),
      coupon_discount: Number(
        payload.couponDiscount ?? payload.coupon_discount ?? 10,
      ),
      min_order_amount: Number(
        payload.minOrderAmount ?? payload.min_order_amount ?? 0,
      ),
      max_order_amount: Number(
        payload.maxOrderAmount ?? payload.max_order_amount ?? 0,
      ),
      // 发送范围
      send_range: Number(payload.sendRange ?? payload.send_range ?? 0),
      send_range_data: (() => {
        const v1 = payload.sendRangeData;
        const v2 = payload.send_range_data;
        const v = v1 !== undefined ? v1 : v2;
        if (v == null) return "";
        if (typeof v === "string") return v;
        // 如果传入数组或对象，序列化为 JSON 字符串
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      })(),
      // 使用期限
      use_start_date: Number(
        payload.useStartDateTs ?? parseDateToTs(payload.useStartDate ?? payload.use_start_date),
      ),
      use_end_date: Number(
        payload.useEndDateTs ?? parseDateToTs(payload.useEndDate ?? payload.use_end_date),
      ),
      // 领取相关
      send_type: Number(payload.sendType ?? payload.send_type ?? 1),
      delay_day: Number(payload.delayDay ?? payload.delay_day ?? 0),
      send_num: Number(payload.sendNum ?? payload.send_num ?? 1),
      // 类型与限制
      coupon_unit: Number(payload.couponUnit ?? payload.coupon_unit ?? 1),
      reduce_type: Number(payload.reduceType ?? payload.reduce_type ?? 1),
      limit_num: Number(payload.limitNum ?? payload.limit_num ?? 0),
      // 标志位（转 0/1）
      is_global: (payload.isGlobal ?? payload.is_global) ? 1 : 0,
      is_new_user: (payload.isNewUser ?? payload.is_new_user) ? 1 : 0,
      is_show: (payload.isShow ?? payload.is_show) ? 1 : 0,
      enabled_click_get: (payload.enabledClickGet ?? payload.enabled_click_get)
        ? 1
        : 0,
      // 用户等级
      limit_user_rank: (() => {
        const v1 = payload.limitUserRank;
        const v2 = payload.limit_user_rank;
        const v = v1 !== undefined ? v1 : v2;
        if (v == null) return "";
        if (typeof v === "string") return v;
        if (Array.isArray(v)) {
          // 规范化为以逗号分隔的 id 列表
          return v
            .map((x: any) => (typeof x === "object" && x !== null ? x.id ?? x.rank_id ?? x : x))
            .map((x: any) => Number(x))
            .filter((n: any) => Number.isFinite(n))
            .join(",");
        }
        return String(v);
      })(),
      // 门店
      shop_id: Number(payload.shop_id ?? payload.shopId),
    };

    // 补齐默认文本字段，Prisma 要求 send_range_data 为 string
    if (data.send_range_data == null) data.send_range_data = "";

    return this.prisma.coupon.create({ data });
  }

  async updateCoupon(id: number, updateCouponDto: UpdateCouponDto) {
    const parseDateToTs = (s?: string) => {
      if (!s) return undefined;
      const t = Date.parse(s.replace(/-/g, "/"));
      return Number.isNaN(t) ? undefined : Math.floor(t / 1000);
    };
    const p: any = updateCouponDto ? { ...updateCouponDto } : {};
    delete p.coupon_id;

    const data: any = {};
    if (p.couponName ?? p.coupon_name) data.coupon_name = p.couponName ?? p.coupon_name;
    if (p.couponDesc ?? p.coupon_desc) data.coupon_desc = p.couponDesc ?? p.coupon_desc;
    if (p.couponType ?? p.coupon_type) data.coupon_type = Number(p.couponType ?? p.coupon_type);
    if (p.couponMoney ?? p.coupon_money) data.coupon_money = Number(p.couponMoney ?? p.coupon_money);
    if (p.couponDiscount ?? p.coupon_discount) data.coupon_discount = Number(p.couponDiscount ?? p.coupon_discount);
    if (p.minOrderAmount ?? p.min_order_amount) data.min_order_amount = Number(p.minOrderAmount ?? p.min_order_amount);
    if (p.maxOrderAmount ?? p.max_order_amount) data.max_order_amount = Number(p.maxOrderAmount ?? p.max_order_amount);
    if (p.sendRange ?? p.send_range) data.send_range = Number(p.sendRange ?? p.send_range);
    if (p.sendRangeData ?? p.send_range_data) {
      const v = p.sendRangeData ?? p.send_range_data;
      if (typeof v === "string") data.send_range_data = v;
      else {
        try {
          data.send_range_data = JSON.stringify(v);
        } catch {
          data.send_range_data = String(v);
        }
      }
    }
    const sTs = parseDateToTs(p.useStartDate ?? p.use_start_date);
    const eTs = parseDateToTs(p.useEndDate ?? p.use_end_date);
    if (sTs != null) data.use_start_date = sTs;
    if (eTs != null) data.use_end_date = eTs;
    if (p.sendType ?? p.send_type) data.send_type = Number(p.sendType ?? p.send_type);
    if (p.delayDay ?? p.delay_day) data.delay_day = Number(p.delayDay ?? p.delay_day);
    if (p.sendNum ?? p.send_num) data.send_num = Number(p.sendNum ?? p.send_num);
    if (p.couponUnit ?? p.coupon_unit) data.coupon_unit = Number(p.couponUnit ?? p.coupon_unit);
    if (p.reduceType ?? p.reduce_type) data.reduce_type = Number(p.reduceType ?? p.reduce_type);
    if (p.limitNum ?? p.limit_num) data.limit_num = Number(p.limitNum ?? p.limit_num);
    if (p.isGlobal ?? p.is_global) data.is_global = (p.isGlobal ?? p.is_global) ? 1 : 0;
    if (p.isNewUser ?? p.is_new_user) data.is_new_user = (p.isNewUser ?? p.is_new_user) ? 1 : 0;
    if (p.isShow ?? p.is_show) data.is_show = (p.isShow ?? p.is_show) ? 1 : 0;
    if (p.enabledClickGet ?? p.enabled_click_get) data.enabled_click_get = (p.enabledClickGet ?? p.enabled_click_get) ? 1 : 0;
    if (p.limitUserRank ?? p.limit_user_rank) {
      const v = p.limitUserRank ?? p.limit_user_rank;
      if (typeof v === "string") data.limit_user_rank = v;
      else if (Array.isArray(v)) {
        data.limit_user_rank = v
          .map((x: any) => (typeof x === "object" && x !== null ? x.id ?? x.rank_id ?? x : x))
          .map((x: any) => Number(x))
          .filter((n: any) => Number.isFinite(n))
          .join(",");
      } else data.limit_user_rank = String(v);
    }

    return this.prisma.coupon.update({ where: { coupon_id: id }, data });
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
    // 按现有 schema 返回用户等级列表（无 is_delete/is_show/sort_order 字段）
    return this.prisma.user_rank.findMany({
      orderBy: { rank_id: "asc" },
    });
  }
}
