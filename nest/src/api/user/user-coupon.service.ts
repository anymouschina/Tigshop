// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CouponQueryDto, ReceiveCouponDto } from "./dto/user-coupon.dto";

@Injectable()
export class UserCouponService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCouponList(userId: number, queryDto: CouponQueryDto) {
    const {
      page = 1,
      size = 10,
      status = "all",
      coupon_type,
      keyword,
      sort_field = "add_time",
      sort_order = "desc",
    } = queryDto;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };

    // 状态过滤
    const now = new Date();
    if (status === "unused") {
      where.status = 0;
      where.use_end_time = { gte: now };
    } else if (status === "used") {
      where.status = 1;
    } else if (status === "expired") {
      where.OR = [{ status: 0, use_end_time: { lt: now } }, { status: 2 }];
    }

    // 优惠券类型过滤
    if (coupon_type !== "all") {
      where.coupon = {
        coupon_type: coupon_type,
      };
    }

    // 关键词搜索
    if (keyword) {
      where.coupon = {
        ...where.coupon,
        coupon_name: { contains: keyword },
      };
    }

    const [userCoupons, total] = await Promise.all([
      this.prisma.user_coupon.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          [sort_field]: sort_order,
        },
        select: {
          id: true,
          coupon_id: true,
          status: true,
          use_time: true,
          add_time: true,
          use_start_time: true,
          use_end_time: true,
          coupon: {
            select: {
              coupon_name: true,
              coupon_type: true,
              coupon_amount: true,
              min_amount: true,
              description: true,
              use_scope: true,
              use_scope_value: true,
            },
          },
        },
      }),
      this.prisma.user_coupon.count({ where }),
    ]);

    return {
      list: userCoupons,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getAvailableCouponList(
    userId: number,
    productId?: number,
    categoryId?: number,
  ) {
    const now = new Date();

    const where: any = {
      user_id: userId,
      status: 0,
      use_end_time: { gte: now },
    };

    // 如果指定了商品或分类，检查使用范围
    if (productId || categoryId) {
      where.coupon = {
        OR: [
          { use_scope: "all" }, // 全场通用
          { use_scope: "category", use_scope_value: categoryId?.toString() }, // 指定分类
          { use_scope: "product", use_scope_value: productId?.toString() }, // 指定商品
        ],
      };
    }

    const userCoupons = await this.prisma.user_coupon.findMany({
      where,
      orderBy: { add_time: "desc" },
      select: {
        id: true,
        coupon_id: true,
        use_start_time: true,
        use_end_time: true,
        coupon: {
          select: {
            coupon_name: true,
            coupon_type: true,
            coupon_amount: true,
            min_amount: true,
            description: true,
            use_scope: true,
            use_scope_value: true,
          },
        },
      },
    });

    return userCoupons;
  }

  async receiveCoupon(userId: number, receiveDto: ReceiveCouponDto) {
    const { coupon_id } = receiveDto;

    // 检查优惠券是否存在且可领取
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        coupon_id,
        status: 1, // 启用状态
        is_show: 1, // 显示状态
        start_time: { lte: new Date() },
        end_time: { gte: new Date() },
      },
    });

    if (!coupon) {
      throw new NotFoundException("优惠券不存在或已过期");
    }

    // 检查是否已领取
    const existingUserCoupon = await this.prisma.user_coupon.findFirst({
      where: {
        user_id: userId,
        coupon_id,
        status: { in: [0, 1] }, // 未使用或已使用
      },
    });

    if (existingUserCoupon) {
      throw new ConflictException("您已领取过此优惠券");
    }

    // 检查领取限制
    if (coupon.limit_count > 0) {
      const receivedCount = await this.prisma.user_coupon.count({
        where: {
          coupon_id,
          status: { in: [0, 1] },
        },
      });

      if (receivedCount >= coupon.limit_count) {
        throw new ConflictException("优惠券已领取完毕");
      }
    }

    // 检查用户领取限制
    if (coupon.user_limit_count > 0) {
      const userReceivedCount = await this.prisma.user_coupon.count({
        where: {
          user_id: userId,
          coupon_id,
          status: { in: [0, 1] },
        },
      });

      if (userReceivedCount >= coupon.user_limit_count) {
        throw new ConflictException(
          `您已领取${userReceivedCount}张，达到领取上限`,
        );
      }
    }

    // 创建用户优惠券
    const userCoupon = await this.prisma.user_coupon.create({
      data: {
        user_id: userId,
        coupon_id,
        status: 0, // 未使用
        use_start_time: coupon.use_start_time,
        use_end_time: coupon.use_end_time,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return { coupon_id: userCoupon.id };
  }

  async getCouponDetail(userId: number, userCouponId: number) {
    const userCoupon = await this.prisma.user_coupon.findFirst({
      where: {
        id: userCouponId,
        user_id: userId,
      },
      select: {
        id: true,
        coupon_id: true,
        status: true,
        use_time: true,
        add_time: true,
        use_start_time: true,
        use_end_time: true,
        coupon: {
          select: {
            coupon_name: true,
            coupon_type: true,
            coupon_amount: true,
            min_amount: true,
            description: true,
            use_scope: true,
            use_scope_value: true,
            start_time: true,
            end_time: true,
          },
        },
      },
    });

    if (!userCoupon) {
      throw new NotFoundException("优惠券不存在");
    }

    return userCoupon;
  }

  async useCoupon(userId: number, userCouponId: number, orderId: number) {
    const userCoupon = await this.prisma.user_coupon.findFirst({
      where: {
        id: userCouponId,
        user_id: userId,
        status: 0,
        use_end_time: { gte: new Date() },
      },
    });

    if (!userCoupon) {
      throw new NotFoundException("优惠券不可用");
    }

    // 检查订单是否属于用户
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: orderId,
        user_id: userId,
        order_status: { in: [0, 1, 2] }, // 待付款、待发货、待收货
      },
    });

    if (!order) {
      throw new BadRequestException("订单不可用");
    }

    // 检查订单金额是否满足使用条件
    const coupon = await this.prisma.coupon.findUnique({
      where: { coupon_id: userCoupon.coupon_id },
    });

    if (!coupon) {
      throw new NotFoundException("优惠券信息不存在");
    }

    if (order.order_amount < coupon.min_amount) {
      throw new BadRequestException(
        `订单金额未达到最低使用金额${coupon.min_amount}元`,
      );
    }

    // 使用优惠券
    await this.prisma.user_coupon.update({
      where: { id: userCouponId },
      data: {
        status: 1,
        use_time: Math.floor(Date.now() / 1000),
        order_id: orderId,
      },
    });

    return { success: true };
  }

  async getAvailableCoupons(userId: number) {
    const now = new Date();

    // 获取可领取的优惠券列表
    const availableCoupons = await this.prisma.coupon.findMany({
      where: {
        status: 1,
        is_show: 1,
        start_time: { lte: now },
        end_time: { gte: now },
      },
      select: {
        coupon_id: true,
        coupon_name: true,
        coupon_type: true,
        coupon_amount: true,
        min_amount: true,
        description: true,
        use_scope: true,
        limit_count: true,
        user_limit_count: true,
        received_count: true,
        start_time: true,
        end_time: true,
      },
    });

    // 为每个优惠券添加用户已领取数量
    const couponsWithUserCount = await Promise.all(
      availableCoupons.map(async (coupon) => {
        const userReceivedCount = await this.prisma.user_coupon.count({
          where: {
            user_id: userId,
            coupon_id: coupon.coupon_id,
            status: { in: [0, 1] },
          },
        });

        return {
          ...coupon,
          user_received_count: userReceivedCount,
          can_receive:
            coupon.limit_count === 0 ||
            coupon.received_count < coupon.limit_count,
          can_user_receive:
            coupon.user_limit_count === 0 ||
            userReceivedCount < coupon.user_limit_count,
        };
      }),
    );

    return couponsWithUserCount.filter(
      (coupon) => coupon.can_receive && coupon.can_user_receive,
    );
  }

  async getUserCouponStatistics(userId: number) {
    const [totalCount, unusedCount, usedCount, expiredCount] =
      await Promise.all([
        this.prisma.user_coupon.count({ where: { user_id: userId } }),
        this.prisma.user_coupon.count({
          where: {
            user_id: userId,
            status: 0,
            use_end_time: { gte: new Date() },
          },
        }),
        this.prisma.user_coupon.count({
          where: {
            user_id: userId,
            status: 1,
          },
        }),
        this.prisma.user_coupon.count({
          where: {
            user_id: userId,
            OR: [
              { status: 0, use_end_time: { lt: new Date() } },
              { status: 2 },
            ],
          },
        }),
      ]);

    return {
      total_count: totalCount,
      unused_count: unusedCount,
      used_count: usedCount,
      expired_count: expiredCount,
    };
  }

  async calculateCouponDiscount(
    userId: number,
    couponId: number,
    orderAmount: number,
  ) {
    const userCoupon = await this.prisma.user_coupon.findFirst({
      where: {
        user_id: userId,
        coupon_id: couponId,
        status: 0,
        use_end_time: { gte: new Date() },
      },
      include: {
        coupon: true,
      },
    });

    if (!userCoupon) {
      throw new NotFoundException("优惠券不可用");
    }

    const coupon = userCoupon.coupon;

    // 检查订单金额
    if (orderAmount < coupon.min_amount) {
      throw new BadRequestException(
        `订单金额未达到最低使用金额${coupon.min_amount}元`,
      );
    }

    // 计算折扣金额
    let discountAmount = 0;
    if (coupon.coupon_type === "fixed") {
      discountAmount = coupon.coupon_amount;
    } else if (coupon.coupon_type === "percentage") {
      discountAmount = Math.floor(orderAmount * (coupon.coupon_amount / 100));
      // 限制最大折扣金额
      if (coupon.max_amount && discountAmount > coupon.max_amount) {
        discountAmount = coupon.max_amount;
      }
    }

    return {
      discount_amount: discountAmount,
      final_amount: orderAmount - discountAmount,
      coupon_name: coupon.coupon_name,
    };
  }
}
