import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  UseCouponDto,
  GetUserCouponsDto,
  ValidateCouponDto,
  CouponType,
  CouponStatus
} from './dto/coupon.dto';

export interface CouponResponse {
  id: number;
  name: string;
  code: string;
  type: CouponType;
  value: number;
  minAmount: number;
  maxDiscount?: number;
  quantity: number;
  usedQuantity: number;
  description?: string;
  startTime: string;
  endTime: string;
  status: CouponStatus;
}

export interface UserCouponResponse {
  id: number;
  couponId: number;
  couponName: string;
  code: string;
  type: CouponType;
  value: number;
  minAmount: number;
  maxDiscount?: number;
  description?: string;
  startTime: string;
  endTime: string;
  status: CouponStatus;
  isUsed: boolean;
  usedTime?: string;
}

export interface CouponValidationResponse {
  isValid: boolean;
  coupon?: CouponResponse;
  discountAmount: number;
  message: string;
}

@Injectable()
export class CouponService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 映射更新DTO到优惠券字段
   */
  private mapUpdateDtoToCoupon(updateDto: UpdateCouponDto): any {
    const mapped: any = {};

    if (updateDto.name !== undefined) mapped.couponName = updateDto.name;
    if (updateDto.code !== undefined) mapped.couponCode = updateDto.code;
    if (updateDto.type !== undefined) mapped.couponType = updateDto.type === CouponType.FIXED ? 1 : 2;
    if (updateDto.value !== undefined) {
      if (updateDto.type === CouponType.FIXED) {
        mapped.discountAmount = updateDto.value;
      } else {
        mapped.discountRate = updateDto.value;
      }
    }
    if (updateDto.minAmount !== undefined) mapped.minAmount = updateDto.minAmount;
    if (updateDto.quantity !== undefined) mapped.totalNum = updateDto.quantity;
    if (updateDto.description !== undefined) mapped.description = updateDto.description;
    if (updateDto.startTime !== undefined) mapped.startTime = updateDto.startTime;
    if (updateDto.endTime !== undefined) mapped.endTime = updateDto.endTime;
    if (updateDto.status !== undefined) mapped.isEnable = updateDto.status;

    return mapped;
  }

  /**
   * 创建优惠券 - 对齐PHP版本 coupon/create
   */
  async createCoupon(createCouponDto: CreateCouponDto): Promise<CouponResponse> {
    const { name, code, type, value, minAmount, maxDiscount, quantity, description, startTime, endTime } = createCouponDto;

    // 检查优惠券代码是否已存在
    const existingCoupon = await this.prisma.coupon.findFirst({
      where: { couponCode: code }
    });

    if (existingCoupon) {
      throw new BadRequestException('优惠券代码已存在');
    }

    // 验证时间范围
    if (new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    // 验证百分比类型的最大折扣
    if (type === CouponType.PERCENTAGE && maxDiscount && maxDiscount > value) {
      throw new BadRequestException('百分比类型的最大折扣不能大于折扣值');
    }

    // 创建优惠券
    const coupon = await this.prisma.$queryRaw`
      INSERT INTO "Coupon" (couponName, couponCode, couponType, discountAmount, "minAmount", discountRate, totalNum, "usedNum", isEnable, "startTime", "endTime", "createdAt", "updatedAt")
      VALUES (${name}, ${code}, ${type === CouponType.FIXED ? 1 : 2}, ${type === CouponType.FIXED ? value : null}, ${minAmount}, ${type === CouponType.PERCENTAGE ? value : null}, ${quantity}, 0, true, ${startTime}, ${endTime}, NOW(), NOW())
      RETURNING *
    ` as any[];

    return this.formatCouponResponse(coupon[0]);
  }

  /**
   * 获取优惠券列表 - 对齐PHP版本 coupon/list
   */
  async getCouponList(query: any = {}) {
    const { page = 1, size = 10, status, type } = query;
    const skip = (page - 1) * size;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [
          { createdAt: 'desc' },
          { couponId: 'desc' }
        ],
      }),
      this.prisma.coupon.count({
        where: whereClause,
      }),
    ]);

    return {
      list: coupons.map(coupon => this.formatCouponResponse(coupon)),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取用户优惠券列表 - 对齐PHP版本 coupon/user/list
   */
  async getUserCoupons(userId: number, query: GetUserCouponsDto) {
    const { page = 1, size = 10, status } = query;
    const skip = (page - 1) * size;

    const whereClause: any = { userId };
    if (status) whereClause.status = status;

    const [userCoupons, total] = await Promise.all([
      this.prisma.userCoupon.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [
          { createdAt: 'desc' },
          { userCouponId: 'desc' }
        ],
        include: {
          Coupon: true,
        },
      }),
      this.prisma.userCoupon.count({
        where: whereClause,
      }),
    ]);

    return {
      list: userCoupons.map(uc => this.formatUserCouponResponse(uc)),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取优惠券详情 - 对齐PHP版本 coupon/detail
   */
  async getCouponDetail(couponId: number): Promise<CouponResponse> {
    const coupon = await this.prisma.coupon.findFirst({
      where: { couponId: couponId },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    return this.formatCouponResponse(coupon);
  }

  /**
   * 更新优惠券 - 对齐PHP版本 coupon/update
   */
  async updateCoupon(couponId: number, updateCouponDto: UpdateCouponDto): Promise<CouponResponse> {
    // 检查优惠券是否存在
    const existingCoupon = await this.prisma.coupon.findFirst({
      where: { couponId: couponId },
    });

    if (!existingCoupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 如果修改了代码，检查是否与其他优惠券冲突
    if (updateCouponDto.code && updateCouponDto.code !== existingCoupon.couponCode) {
      const codeConflict = await this.prisma.coupon.findFirst({
        where: {
          couponCode: updateCouponDto.code,
          couponId: { not: couponId }
        },
      });

      if (codeConflict) {
        throw new BadRequestException('优惠券代码已存在');
      }
    }

    // 更新优惠券
    const updatedCoupon = await this.prisma.coupon.update({
      where: { couponId: couponId },
      data: updateCouponDto,
    });

    return this.formatCouponResponse(updatedCoupon);
  }

  /**
   * 删除优惠券 - 对齐PHP版本 coupon/delete
   */
  async deleteCoupon(couponId: number) {
    // 检查优惠券是否存在
    const coupon = await this.prisma.coupon.findFirst({
      where: { couponId: couponId },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 检查是否已有用户使用
    const usedCount = await this.prisma.userCoupon.count({
      where: {
        couponId,
        status: 1
      },
    });

    if (usedCount > 0) {
      throw new BadRequestException('该优惠券已有用户使用，不能删除');
    }

    // 删除优惠券
    await this.prisma.coupon.delete({
      where: { couponId: couponId },
    });

    return { message: '优惠券删除成功' };
  }

  /**
   * 领取优惠券 - 对齐PHP版本 coupon/receive
   */
  async receiveCoupon(userId: number, couponId: number) {
    // 检查优惠券是否存在且可领取
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        id: couponId,
        status: 'ACTIVE'
      },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在或已失效');
    }

    // 检查优惠券是否在有效期内
    const now = new Date();
    if (now < new Date(coupon.startTime) || now > new Date(coupon.endTime)) {
      throw new BadRequestException('优惠券不在有效期内');
    }

    // 检查优惠券是否还有库存
    if (coupon.usedQuantity >= coupon.quantity) {
      throw new BadRequestException('优惠券已领完');
    }

    // 检查用户是否已领取过该优惠券
    const existingUserCoupon = await this.prisma.userCoupon.findFirst({
      where: {
        userId,
        couponId,
      },
    });

    if (existingUserCoupon) {
      throw new BadRequestException('您已领取过该优惠券');
    }

    // 领取优惠券
    const userCoupon = await this.prisma.$queryRaw`
      INSERT INTO "UserCoupon" ("userId", "couponId", status, "isUsed", "createdAt", "updatedAt")
      VALUES (${userId}, ${couponId}, 'ACTIVE', false, NOW(), NOW())
      RETURNING *
    ` as any[];

    // 更新优惠券已领取数量
    await this.prisma.coupon.update({
      where: { couponId: couponId },
      data: {
        usedQuantity: {
          increment: 1,
        },
      },
    });

    return { message: '优惠券领取成功' };
  }

  /**
   * 验证优惠券 - 对齐PHP版本 coupon/validate
   */
  async validateCoupon(userId: number, validateCouponDto: ValidateCouponDto): Promise<CouponValidationResponse> {
    const { code, orderAmount } = validateCouponDto;

    // 查找优惠券
    const coupon = await this.prisma.coupon.findFirst({
      where: { code },
    });

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券不存在',
      };
    }

    // 检查优惠券状态
    if (coupon.status !== 'ACTIVE') {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券已失效',
      };
    }

    // 检查优惠券有效期
    const now = new Date();
    if (now < new Date(coupon.startTime) || now > new Date(coupon.endTime)) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券不在有效期内',
      };
    }

    // 检查是否还有库存
    if (coupon.usedQuantity >= coupon.quantity) {
      return {
        isValid: false,
        discountAmount: 0,
        message: '优惠券已领完',
      };
    }

    // 检查用户是否拥有该优惠券
    const userCoupon = await this.prisma.userCoupon.findFirst({
      where: {
        userId,
        couponId: coupon.id,
        status: 'ACTIVE',
        status: 0,
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
    if (orderAmount < coupon.minAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `订单金额未达到最低消费金额 ${coupon.minAmount} 元`,
      };
    }

    // 计算折扣金额
    let discountAmount = 0;
    if (coupon.type === CouponType.FIXED) {
      discountAmount = coupon.value;
    } else if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = orderAmount * (coupon.value / 100);
      // 应用最大折扣限制
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    // 确保折扣金额不超过订单金额
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return {
      isValid: true,
      coupon: this.formatCouponResponse(coupon),
      discountAmount,
      message: '优惠券可用',
    };
  }

  /**
   * 使用优惠券 - 对齐PHP版本 coupon/use
   */
  async useCoupon(userId: number, useCouponDto: UseCouponDto) {
    const { code, orderAmount } = useCouponDto;

    // 验证优惠券
    const validation = await this.validateCoupon(userId, { code, orderAmount });

    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    if (!validation.coupon) {
      throw new BadRequestException('优惠券验证失败');
    }

    // 标记优惠券为已使用
    await this.prisma.userCoupon.updateMany({
      where: {
        userId,
        couponId: validation.coupon.id,
        status: 0,
      },
      data: {
        status: 1,
        usedTime: new Date().toISOString(),
        status: 'USED',
      },
    });

    return {
      discountAmount: validation.discountAmount,
      message: '优惠券使用成功',
    };
  }

  /**
   * 获取可用的优惠券列表 - 对齐PHP版本 coupon/available
   */
  async getAvailableCoupons(userId: number, orderAmount: number) {
    // 查找用户拥有的未使用优惠券
    const userCoupons = await this.prisma.userCoupon.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        status: 0,
      },
      include: {
        coupon: true,
      },
    });

    // 过滤出当前可用的优惠券
    const availableCoupons = [];
    const now = new Date();

    for (const userCoupon of userCoupons) {
      const coupon = userCoupon.Coupon;

      // 检查优惠券状态和有效期
      if (coupon.status !== 'ACTIVE') continue;
      if (now < new Date(coupon.startTime) || now > new Date(coupon.endTime)) continue;
      if (coupon.usedQuantity >= coupon.quantity) continue;
      if (orderAmount < coupon.minAmount) continue;

      // 计算折扣金额
      let discountAmount = 0;
      if (coupon.type === CouponType.FIXED) {
        discountAmount = coupon.value;
      } else if (coupon.type === CouponType.PERCENTAGE) {
        discountAmount = orderAmount * (coupon.value / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      }

      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }

      availableCoupons.push({
        ...this.formatCouponResponse(coupon),
        discountAmount,
      });
    }

    return {
      list: availableCoupons,
      total: availableCoupons.length,
    };
  }

  /**
   * 格式化优惠券响应
   */
  private formatCouponResponse(coupon: any): CouponResponse {
    return {
      id: coupon.couponId,
      name: coupon.couponName,
      code: coupon.couponCode,
      type: coupon.couponType === 1 ? CouponType.FIXED : CouponType.PERCENTAGE,
      value: Number(coupon.discountAmount || coupon.discountRate),
      minAmount: Number(coupon.minAmount),
      maxDiscount: coupon.discountRate ? Number(coupon.discountRate) : undefined,
      quantity: coupon.totalNum,
      usedQuantity: coupon.usedNum,
      description: coupon.description,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      status: coupon.isEnable ? CouponStatus.ACTIVE : CouponStatus.INACTIVE,
    };
  }

  /**
   * 格式化用户优惠券响应
   */
  private formatUserCouponResponse(userCoupon: any): UserCouponResponse {
    const coupon = userCoupon.Coupon;
    return {
      id: userCoupon.userCouponId,
      couponId: userCoupon.couponId,
      couponName: coupon.couponName,
      code: coupon.couponCode,
      type: coupon.couponType === 1 ? CouponType.FIXED : CouponType.PERCENTAGE,
      value: Number(coupon.discountAmount || coupon.discountRate),
      minAmount: Number(coupon.minAmount),
      maxDiscount: coupon.discountRate ? Number(coupon.discountRate) : undefined,
      description: coupon.description,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      status: userCoupon.status === 1 ? CouponStatus.ACTIVE : CouponStatus.USED,
      isUsed: userCoupon.status !== 0,
      usedTime: userCoupon.usedTime,
    };
  }
}