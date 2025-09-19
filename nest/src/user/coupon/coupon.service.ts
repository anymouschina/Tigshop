import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
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
} from './dto/coupon.dto';

@Injectable()
export class UserCouponService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 获取用户优惠券列表 - 对齐PHP版本 user/coupon/list
   */
  async getUserCouponList(userId: number, userCouponListDto: UserCouponListDto): Promise<CouponListResponse> {
    const {
      page = 1,
      size = 15,
      sort_field = 'start_date',
      sort_order = 'asc',
      status,
    } = userCouponListDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {
      userId,
    };

    // 根据状态筛选
    if (status === CouponStatus.USED) {
      where.usedTime = { not: null };
    } else if (status === CouponStatus.EXPIRED) {
      where.endDate = { lt: new Date() };
    } else {
      where.usedTime = null;
      where.endDate = { gte: new Date() };
    }

    const [userCoupons, total] = await Promise.all([
      this.databaseService.userCoupon.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          [sort_field]: sort_order,
        },
        include: {
          coupon: true,
        },
      }),
      this.databaseService.userCoupon.count({
        where,
      }),
    ]);

    // 格式化优惠券信息
    const formattedCoupons = userCoupons.map((userCoupon) => {
      const coupon = userCoupon.coupon;
      return {
        id: userCoupon.id,
        coupon_id: userCoupon.couponId,
        coupon_name: coupon.couponName,
        coupon_sn: userCoupon.couponSn,
        coupon_type: coupon.couponType === 1 ? 'fixed' : 'percentage',
        coupon_money: coupon.couponMoney ? Number(coupon.couponMoney) : 0,
        coupon_discount: coupon.couponDiscount ? Number(coupon.couponDiscount) : 0,
        min_order_amount: Number(coupon.minOrderAmount),
        max_order_amount: coupon.maxOrderAmount ? Number(coupon.maxOrderAmount) : 0,
        coupon_desc: coupon.couponDesc,
        start_date: userCoupon.startDate,
        end_date: userCoupon.endDate,
        used_time: userCoupon.usedTime,
        add_time: userCoupon.createdAt,
        is_used: userCoupon.usedTime !== null,
        status: this.getCouponStatus(userCoupon),
      };
    });

    return {
      records: formattedCoupons,
      total,
    };
  }

  /**
   * 获取可领取的优惠券列表 - 对齐PHP版本 user/coupon/getList
   */
  async getAvailableCouponList(availableCouponListDto: AvailableCouponListDto): Promise<CouponListResponse> {
    const {
      page = 1,
      size = 15,
      sort_field = 'add_time',
      sort_order = 'desc',
      shop_id = -1,
    } = availableCouponListDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {
      isDelete: 0, // 显示的优惠券
      isShow: 1, // 显示状态
    };

    // 有效日期筛选
    const now = new Date();
    where.useStartDate = { lte: now };
    where.useEndDate = { gte: now };
    where.sendStartDate = { lte: now };
    where.sendEndDate = { gte: now };

    // 店铺筛选
    if (shop_id !== -1) {
      where.shopId = shop_id;
    }

    const [coupons, total] = await Promise.all([
      this.databaseService.coupon.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          [sort_field]: sort_order,
        },
      }),
      this.databaseService.coupon.count({
        where,
      }),
    ]);

    // 格式化优惠券信息
    const formattedCoupons = coupons.map((coupon) => ({
      id: coupon.couponId,
      coupon_name: coupon.couponName,
      coupon_type: coupon.couponType === 1 ? 'fixed' : 'percentage',
      coupon_money: coupon.couponMoney ? Number(coupon.couponMoney) : 0,
      coupon_discount: coupon.couponDiscount ? Number(coupon.couponDiscount) : 0,
      min_order_amount: Number(coupon.minOrderAmount),
      max_order_amount: coupon.maxOrderAmount ? Number(coupon.maxOrderAmount) : 0,
      coupon_desc: coupon.couponDesc,
      start_date: coupon.useStartDate,
      end_date: coupon.useEndDate,
      limit_num: coupon.limitNum,
      already_send_num: 0, // 需要查询实际领取数量
      can_receive: true, // 需要根据用户领取情况判断
      add_time: coupon.addTime,
    }));

    return {
      records: formattedCoupons,
      total,
    };
  }

  /**
   * 领取优惠券 - 对齐PHP版本 user/coupon/claim
   */
  async claimCoupon(userId: number, claimCouponDto: ClaimCouponDto): Promise<SuccessResponse> {
    const { coupon_id } = claimCouponDto;

    // 检查优惠券是否存在且可领取
    const coupon = await this.databaseService.coupon.findFirst({
      where: {
        couponId: coupon_id,
        isDelete: 0,
        isShow: 1,
      },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在或已失效');
    }

    // 检查优惠券是否在有效期内
    const now = new Date();
    if (now < new Date(coupon.sendStartDate) || now > new Date(coupon.sendEndDate)) {
      throw new BadRequestException('优惠券不在领取有效期内');
    }

    // 检查优惠券是否还有库存
    const currentSendCount = await this.databaseService.userCoupon.count({
      where: { couponId: coupon_id },
    });
    if (currentSendCount >= coupon.limitNum) {
      throw new BadRequestException('优惠券已领完');
    }

    // 检查用户是否已领取过该优惠券
    const existingUserCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        userId,
        couponId: coupon_id,
      },
    });

    if (existingUserCoupon) {
      throw new ConflictException('您已领取过该优惠券');
    }

    // 领取优惠券
    const userCoupon = await this.databaseService.userCoupon.create({
      data: {
        userId,
        couponId: coupon_id,
        couponSn: `CPN${Date.now()}`,
        startDate: coupon.useStartDate,
        endDate: coupon.useEndDate,
      },
    });

    return {
      message: '优惠券领取成功',
      coupon_id: userCoupon.id,
    };
  }

  /**
   * 删除用户优惠券 - 对齐PHP版本 user/coupon/del
   */
  async deleteUserCoupon(userId: number, deleteCouponDto: DeleteCouponDto): Promise<SuccessResponse> {
    const { id } = deleteCouponDto;

    // 验证用户优惠券是否存在
    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!userCoupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 删除用户优惠券
    await this.databaseService.userCoupon.delete({
      where: { id },
    });

    return {
      message: '删除成功',
    };
  }

  /**
   * 获取优惠券详情 - 对齐PHP版本 user/coupon/detail
   */
  async getCouponDetail(userId: number, couponDetailDto: CouponDetailDto): Promise<CouponResponse> {
    const { id } = couponDetailDto;

    // 获取优惠券详情
    const coupon = await this.databaseService.coupon.findFirst({
      where: { couponId: id },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 检查用户是否已领取该优惠券
    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        userId,
        couponId: id,
      },
    });

    const couponDetail = {
      id: coupon.couponId,
      coupon_name: coupon.couponName,
      coupon_type: coupon.couponType === 1 ? 'fixed' : 'percentage',
      coupon_money: coupon.couponMoney ? Number(coupon.couponMoney) : 0,
      coupon_discount: coupon.couponDiscount ? Number(coupon.couponDiscount) : 0,
      min_order_amount: Number(coupon.minOrderAmount),
      max_order_amount: coupon.maxOrderAmount ? Number(coupon.maxOrderAmount) : 0,
      coupon_desc: coupon.couponDesc,
      start_date: coupon.useStartDate,
      end_date: coupon.useEndDate,
      limit_num: coupon.limitNum,
      already_send_num: await this.databaseService.userCoupon.count({
        where: { couponId: id },
      }),
      is_received: !!userCoupon,
      is_used: userCoupon?.usedTime !== null,
      can_receive: await this.checkCanReceive(userId, id),
    };

    return {
      coupon: couponDetail,
    };
  }

  /**
   * 验证优惠券 - 对齐PHP版本 user/coupon/validate
   */
  async validateCoupon(userId: number, validateCouponDto: ValidateCouponDto): Promise<CouponValidationResponse> {
    const { code, orderAmount } = validateCouponDto;

    // 查找优惠券
    const coupon = await this.databaseService.coupon.findFirst({
      where: { couponName: code },
    });

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券不存在',
      };
    }

    // 检查优惠券状态
    if (coupon.isDelete !== 0 || coupon.isShow !== 1) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券已失效',
      };
    }

    // 检查优惠券有效期
    const now = new Date();
    if (now < new Date(coupon.useStartDate) || now > new Date(coupon.useEndDate)) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券不在有效期内',
      };
    }

    // 检查用户是否拥有该优惠券
    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        userId,
        couponId: coupon.couponId,
        usedTime: null,
      },
    });

    if (!userCoupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '您没有该优惠券或已使用',
      };
    }

    // 检查最低消费金额
    if (orderAmount < Number(coupon.minOrderAmount)) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `订单金额未达到最低消费金额 ${coupon.minOrderAmount} 元`,
      };
    }

    // 计算折扣金额
    let discountAmount = 0;
    if (coupon.couponType === 1) { // FIXED
      discountAmount = Number(coupon.couponMoney);
    } else if (coupon.couponType === 2) { // PERCENTAGE
      discountAmount = orderAmount * (Number(coupon.couponDiscount) / 100);
      // 应用最大折扣限制
      if (coupon.maxOrderAmount && discountAmount > Number(coupon.maxOrderAmount)) {
        discountAmount = Number(coupon.maxOrderAmount);
      }
    }

    // 确保折扣金额不超过订单金额
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return {
      isValid: true,
      discountAmount,
      message: '优惠券可用',
    };
  }

  /**
   * 使用优惠券 - 对齐PHP版本 user/coupon/use
   */
  async useCoupon(userId: number, useCouponDto: UseCouponDto): Promise<SuccessResponse> {
    const { code, orderAmount } = useCouponDto;

    // 验证优惠券
    const validation = await this.validateCoupon(userId, { code, orderAmount });

    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    // 查找用户优惠券并标记为已使用
    const userCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        userId,
        coupon: {
          couponName: code,
        },
        usedTime: null,
      },
      include: {
        coupon: true,
      },
    });

    if (!userCoupon) {
      throw new BadRequestException('优惠券不存在或已使用');
    }

    // 标记优惠券为已使用
    await this.databaseService.userCoupon.update({
      where: { id: userCoupon.id },
      data: {
        usedTime: new Date(),
      },
    });

    return {
      message: '优惠券使用成功',
      discountAmount: validation.discountAmount,
    };
  }

  /**
   * 获取用户优惠券数量统计
   */
  async getCouponCount(userId: number): Promise<{
    available: number;
    used: number;
    expired: number;
    total: number;
  }> {
    const [available, used, expired] = await Promise.all([
      this.databaseService.userCoupon.count({
        where: {
          userId,
          usedTime: null,
          endDate: { gte: new Date() },
        },
      }),
      this.databaseService.userCoupon.count({
        where: {
          userId,
          usedTime: { not: null },
        },
      }),
      this.databaseService.userCoupon.count({
        where: {
          userId,
          usedTime: null,
          endDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      available,
      used,
      expired,
      total: available + used + expired,
    };
  }

  /**
   * 获取优惠券状态
   */
  private getCouponStatus(userCoupon: any): string {
    if (userCoupon.usedTime) {
      return CouponStatus.USED;
    }
    if (new Date() > new Date(userCoupon.endDate)) {
      return CouponStatus.EXPIRED;
    }
    return CouponStatus.AVAILABLE;
  }

  /**
   * 检查用户是否可以领取优惠券
   */
  private async checkCanReceive(userId: number, couponId: number): Promise<boolean> {
    const coupon = await this.databaseService.coupon.findFirst({
      where: { couponId: couponId },
    });

    if (!coupon || coupon.isDelete !== 0 || coupon.isShow !== 1) {
      return false;
    }

    const now = new Date();
    if (now < new Date(coupon.sendStartDate) || now > new Date(coupon.sendEndDate)) {
      return false;
    }

    const currentSendCount = await this.databaseService.userCoupon.count({
      where: { couponId },
    });
    if (currentSendCount >= coupon.limitNum) {
      return false;
    }

    const existingUserCoupon = await this.databaseService.userCoupon.findFirst({
      where: {
        userId,
        couponId,
      },
    });

    return !existingUserCoupon;
  }
}