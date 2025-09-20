import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import {
  UserCouponListDto,
  AvailableCouponListDto,
  ClaimCouponDto,
  DeleteCouponDto,
  CouponDetailDto,
  ValidateCouponDto,
  UseCouponDto,
  CouponListResponse,
  CouponResponse,
  CouponValidationResponse,
  SuccessResponse,
  CouponStatus,
} from "./dto/coupon.dto";

// NOTE: Prisma schema uses snake_case model/field names and Int timestamps (Unix seconds).
// This service aligns all queries and mappings accordingly, removing assumptions about relations.
@Injectable()
export class UserCouponService {
  constructor(private readonly databaseService: DatabaseService) {}

  // 获取用户优惠券列表
  async getUserCouponList(
    userId: number,
    userCouponListDto: UserCouponListDto,
  ): Promise<CouponListResponse> {
    const {
      page = 1,
      size = 15,
      sort_field = "start_date",
      sort_order = "asc",
      status,
    } = userCouponListDto;

    const skip = (page - 1) * size;

    const where: any = { user_id: userId };
    const nowSec = Math.floor(Date.now() / 1000);

    if (status === CouponStatus.USED) {
      where.used_time = { gt: 0 } as any;
    } else if (status === CouponStatus.EXPIRED) {
      where.used_time = 0 as any;
      where.end_date = { lt: nowSec } as any;
    } else {
      // 可用
      where.used_time = 0 as any;
      where.end_date = { gte: nowSec } as any;
    }

    const [userCoupons, total] = await Promise.all([
      this.databaseService.userCoupon.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sort_field]: sort_order as any } as any,
      }),
      this.databaseService.userCoupon.count({ where }),
    ]);

    // 批量获取优惠券明细
    const couponIds = Array.from(
      new Set(userCoupons.map((uc) => uc.coupon_id)),
    ) as number[];
    const coupons = await this.databaseService.coupon.findMany({
      where: { coupon_id: { in: couponIds } },
    });
    const couponMap = new Map(coupons.map((c) => [c.coupon_id, c]));

    const formattedCoupons = userCoupons.map((uc) => {
      const c = couponMap.get(uc.coupon_id);
      return {
        id: uc.id,
        coupon_id: uc.coupon_id,
        coupon_name: c?.coupon_name ?? "",
        coupon_sn: uc.coupon_sn,
        coupon_type: c && c.coupon_type === 1 ? "fixed" : "percentage",
        coupon_money: Number(c?.coupon_money ?? 0),
        coupon_discount: Number(c?.coupon_discount ?? 0),
        min_order_amount: Number(c?.min_order_amount ?? 0),
        max_order_amount: Number(c?.max_order_amount ?? 0),
        coupon_desc: c?.coupon_desc ?? "",
        start_date: uc.start_date,
        end_date: uc.end_date,
        used_time: uc.used_time,
        add_time: uc.start_date,
        is_used: (uc.used_time || 0) > 0,
        status: this.getCouponStatus(uc),
      };
    });

    return { records: formattedCoupons, total };
  }

  // 获取可领取的优惠券列表
  async getAvailableCouponList(
    availableCouponListDto: AvailableCouponListDto,
  ): Promise<CouponListResponse> {
    const {
      page = 1,
      size = 15,
      sort_field = "add_time",
      sort_order = "desc",
      shop_id = -1,
    } = availableCouponListDto;

    const skip = (page - 1) * size;
    const nowSec = Math.floor(Date.now() / 1000);

    const where: any = {
      is_delete: false,
      is_show: 1,
      use_start_date: { lte: nowSec } as any,
      use_end_date: { gte: nowSec } as any,
      send_start_date: { lte: nowSec } as any,
      send_end_date: { gte: nowSec } as any,
    };

    if (shop_id !== -1) where.shop_id = shop_id;

    const [coupons, total] = await Promise.all([
      this.databaseService.coupon.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sort_field]: sort_order as any } as any,
      }),
      this.databaseService.coupon.count({ where }),
    ]);

    const formatted = coupons.map((coupon) => ({
      id: coupon.coupon_id,
      coupon_name: coupon.coupon_name,
      coupon_type: coupon.coupon_type === 1 ? "fixed" : "percentage",
      coupon_money: Number(coupon.coupon_money || 0),
      coupon_discount: Number(coupon.coupon_discount || 0),
      min_order_amount: Number(coupon.min_order_amount || 0),
      max_order_amount: Number(coupon.max_order_amount || 0),
      coupon_desc: coupon.coupon_desc,
      start_date: coupon.use_start_date,
      end_date: coupon.use_end_date,
      limit_num: coupon.limit_num,
      already_send_num: 0,
      can_receive: true,
      add_time: coupon.add_time,
    }));

    return { records: formatted, total };
  }

  // 领取优惠券
  async claimCoupon(
    userId: number,
    claimCouponDto: ClaimCouponDto,
  ): Promise<SuccessResponse> {
    const { coupon_id } = claimCouponDto;

    const coupon = await this.databaseService.coupon.findFirst({
      where: { coupon_id, is_delete: false, is_show: 1 },
    });
    if (!coupon) throw new NotFoundException("优惠券不存在或已失效");

    const nowSec = Math.floor(Date.now() / 1000);
    if (
      nowSec < (coupon.send_start_date || 0) ||
      nowSec > (coupon.send_end_date || 0)
    ) {
      throw new BadRequestException("优惠券不在领取有效期内");
    }

    const currentSendCount = await this.databaseService.userCoupon.count({
      where: { coupon_id },
    });
    if (
      (coupon.limit_num || 0) > 0 &&
      currentSendCount >= (coupon.limit_num || 0)
    ) {
      throw new BadRequestException("优惠券已领完");
    }

    const existing = await this.databaseService.userCoupon.findFirst({
      where: { user_id: userId, coupon_id },
    });
    if (existing) throw new ConflictException("您已领取过该优惠券");

    const userCoupon = await this.databaseService.userCoupon.create({
      data: {
        user_id: userId,
        coupon_id,
        coupon_sn: `CPN${Date.now()}`,
        start_date: coupon.use_start_date,
        end_date: coupon.use_end_date,
      },
    });

    return { message: "优惠券领取成功", coupon_id: userCoupon.id };
  }

  // 删除用户优惠券
  async deleteUserCoupon(
    userId: number,
    deleteCouponDto: DeleteCouponDto,
  ): Promise<SuccessResponse> {
    const { id } = deleteCouponDto;
    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: { id, user_id: userId },
    });
    if (!userCoupon) throw new NotFoundException("优惠券不存在");

    await this.databaseService.userCoupon.delete({ where: { id } });
    return { message: "删除成功" };
  }

  // 获取优惠券详情
  async getCouponDetail(
    userId: number,
    couponDetailDto: CouponDetailDto,
  ): Promise<CouponResponse> {
    const { id } = couponDetailDto;
    const coupon = await this.databaseService.coupon.findFirst({
      where: { coupon_id: id },
    });
    if (!coupon) throw new NotFoundException("优惠券不存在");

    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: { user_id: userId, coupon_id: id },
    });

    const couponDetail = {
      id: coupon.coupon_id,
      coupon_name: coupon.coupon_name,
      coupon_type: coupon.coupon_type === 1 ? "fixed" : "percentage",
      coupon_money: Number(coupon.coupon_money || 0),
      coupon_discount: Number(coupon.coupon_discount || 0),
      min_order_amount: Number(coupon.min_order_amount || 0),
      max_order_amount: Number(coupon.max_order_amount || 0),
      coupon_desc: coupon.coupon_desc,
      start_date: coupon.use_start_date,
      end_date: coupon.use_end_date,
      limit_num: coupon.limit_num,
      already_send_num: await this.databaseService.userCoupon.count({
        where: { coupon_id: id },
      }),
      is_received: !!userCoupon,
      is_used: (userCoupon?.used_time || 0) > 0,
      can_receive: await this.checkCanReceive(userId, id),
    };

    return { coupon: couponDetail };
  }

  // 验证优惠券
  async validateCoupon(
    userId: number,
    validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResponse> {
    const { code, orderAmount } = validateCouponDto;

    const coupon = await this.databaseService.coupon.findFirst({
      where: { coupon_name: code },
    });
    if (!coupon)
      return { isValid: false, discountAmount: 0, message: "优惠券不存在" };

    if (coupon.is_delete !== false || coupon.is_show !== 1) {
      return { isValid: false, discountAmount: 0, message: "优惠券已失效" };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (
      nowSec < (coupon.use_start_date || 0) ||
      nowSec > (coupon.use_end_date || 0)
    ) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "优惠券不在有效期内",
      };
    }

    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        user_id: userId,
        coupon_id: coupon.coupon_id,
        used_time: 0 as any,
      },
    });
    if (!userCoupon)
      return {
        isValid: false,
        discountAmount: 0,
        message: "您没有该优惠券或已使用",
      };

    if (orderAmount < Number(coupon.min_order_amount)) {
      return {
        isValid: false,
        discountAmount: 0,
        message:
          `订单金额未达到最低消费金额 ${coupon.min_order_amount} 元` as any,
      };
    }

    let discountAmount = 0;
    if (coupon.coupon_type === 1) {
      discountAmount = Number(coupon.coupon_money);
    } else if (coupon.coupon_type === 2) {
      discountAmount = orderAmount * (Number(coupon.coupon_discount) / 100);
      if (
        coupon.max_order_amount &&
        discountAmount > Number(coupon.max_order_amount)
      ) {
        discountAmount = Number(coupon.max_order_amount);
      }
    }

    return { isValid: true, discountAmount, message: "优惠券可用" };
  }

  // 使用优惠券
  async useCoupon(
    userId: number,
    useCouponDto: UseCouponDto,
  ): Promise<SuccessResponse> {
    const { code, orderAmount } = useCouponDto;

    const validation = await this.validateCoupon(userId, { code, orderAmount });
    if (!validation.isValid) throw new BadRequestException(validation.message);

    const coupon = await this.databaseService.coupon.findFirst({
      where: { coupon_name: code },
    });
    if (!coupon) throw new BadRequestException("优惠券不存在");

    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        user_id: userId,
        coupon_id: coupon.coupon_id,
        used_time: 0 as any,
      },
    });
    if (!userCoupon) throw new BadRequestException("优惠券不存在或已使用");

    await this.databaseService.userCoupon.update({
      where: { id: userCoupon.id },
      data: { used_time: Math.floor(Date.now() / 1000) as any },
    });

    return {
      message: "优惠券使用成功",
      discountAmount: validation.discountAmount as any,
    } as any;
  }

  // 获取用户优惠券数量统计
  async getCouponCount(userId: number): Promise<{
    available: number;
    used: number;
    expired: number;
    total: number;
  }> {
    const nowSec = Math.floor(Date.now() / 1000);
    const [available, used, expired] = await Promise.all([
      this.databaseService.userCoupon.count({
        where: {
          user_id: userId,
          used_time: 0 as any,
          end_date: { gte: nowSec } as any,
        },
      }),
      this.databaseService.userCoupon.count({
        where: { user_id: userId, used_time: { gt: 0 } as any },
      }),
      this.databaseService.userCoupon.count({
        where: {
          user_id: userId,
          used_time: 0 as any,
          end_date: { lt: nowSec } as any,
        },
      }),
    ]);
    return { available, used, expired, total: available + used + expired };
  }

  // 内部：计算状态
  private getCouponStatus(userCoupon: any): string {
    if ((userCoupon.used_time || 0) > 0) return CouponStatus.USED;
    if (Math.floor(Date.now() / 1000) > (userCoupon.end_date || 0))
      return CouponStatus.EXPIRED;
    return CouponStatus.AVAILABLE;
  }

  // 内部：检查是否可领取
  private async checkCanReceive(
    userId: number,
    couponId: number,
  ): Promise<boolean> {
    const coupon = await this.databaseService.coupon.findFirst({
      where: { coupon_id: couponId },
    });
    if (!coupon || coupon.is_delete !== false || coupon.is_show !== 1)
      return false;

    const nowSec = Math.floor(Date.now() / 1000);
    if (
      nowSec < (coupon.send_start_date || 0) ||
      nowSec > (coupon.send_end_date || 0)
    )
      return false;

    const currentSendCount = await this.databaseService.userCoupon.count({
      where: { coupon_id: couponId },
    });
    if (
      (coupon.limit_num || 0) > 0 &&
      currentSendCount >= (coupon.limit_num || 0)
    )
      return false;

    const existing = await this.databaseService.userCoupon.findFirst({
      where: { user_id: userId, coupon_id: couponId },
    });
    return !existing;
  }
}
