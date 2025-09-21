// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import {
  CreateCouponDto,
  UpdateCouponDto,
  UseCouponDto,
  GetUserCouponsDto,
  ValidateCouponDto,
  CouponType,
  CouponStatus,
} from "./dto/coupon.dto";

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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 映射更新DTO到优惠券字段
   */
  private mapUpdateDtoToCoupon(updateDto: UpdateCouponDto): any {
    const mapped: any = {};

    if (updateDto.name !== undefined) mapped.couponName = updateDto.name;
    if (updateDto.type !== undefined)
      mapped.couponType = updateDto.type === CouponType.FIXED ? 1 : 2;
    if (updateDto.value !== undefined) {
      if (updateDto.type === CouponType.FIXED) {
        mapped.couponMoney = new Decimal(updateDto.value);
      } else {
        mapped.couponDiscount = new Decimal(updateDto.value);
      }
    }
    if (updateDto.minAmount !== undefined)
      mapped.minOrderAmount = new Decimal(updateDto.minAmount);
    if (updateDto.maxDiscount !== undefined)
      mapped.maxOrderAmount = new Decimal(updateDto.maxDiscount);
    if (updateDto.quantity !== undefined) mapped.limitNum = updateDto.quantity;
    if (updateDto.description !== undefined)
      mapped.couponDesc = updateDto.description;
    if (updateDto.startTime !== undefined) {
      mapped.useStartDate = new Date(updateDto.startTime);
      mapped.sendStartDate = new Date(updateDto.startTime);
    }
    if (updateDto.endTime !== undefined) {
      mapped.useEndDate = new Date(updateDto.endTime);
      mapped.sendEndDate = new Date(updateDto.endTime);
    }
    if (updateDto.status !== undefined) {
      mapped.isDelete = updateDto.status === CouponStatus.ACTIVE ? 0 : 1;
    }

    return mapped;
  }

  /**
   * 创建优惠券 - 对齐PHP版本 coupon/create
   */
  async createCoupon(
    createCouponDto: CreateCouponDto,
  ): Promise<CouponResponse> {
    const {
      name,
      code,
      type,
      value,
      minAmount,
      maxDiscount,
      quantity,
      description,
      startTime,
      endTime,
    } = createCouponDto;

    // 检查优惠券代码是否已存在 - 使用新的字段名
    const existingCoupon = await this.prisma.coupon.findFirst({
      where: { couponName: name },
    });

    if (existingCoupon) {
      throw new BadRequestException("优惠券名称已存在");
    }

    // 验证时间范围
    if (new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException("结束时间必须晚于开始时间");
    }

    // 验证百分比类型的最大折扣
    if (type === CouponType.PERCENTAGE && maxDiscount && maxDiscount > value) {
      throw new BadRequestException("百分比类型的最大折扣不能大于折扣值");
    }

    // 创建优惠券 - 使用新的字段名
    const coupon = await this.prisma.coupon.create({
      data: {
        couponName: name,
        couponType: type === CouponType.FIXED ? 1 : 2,
        couponMoney:
          type === CouponType.FIXED ? new Decimal(value) : new Decimal(0),
        couponDiscount:
          type === CouponType.PERCENTAGE ? new Decimal(value) : new Decimal(0),
        minOrderAmount: new Decimal(minAmount),
        maxOrderAmount: maxDiscount ? new Decimal(maxDiscount) : new Decimal(0),
        limitNum: quantity,
        couponDesc: description || "",
        useStartDate: new Date(startTime),
        useEndDate: new Date(endTime),
        sendStartDate: new Date(startTime),
        sendEndDate: new Date(endTime),
      },
    });

    return this.formatCouponResponse(coupon);
  }

  /**
   * 获取优惠券列表 - 对齐PHP版本 coupon/list
   */
  async getCouponList(query: any = {}) {
    const { page = 1, size = 10, status, type } = query;
    const skip = (page - 1) * size;

    const whereClause: any = {};
    // 使用新的字段名
    if (status) whereClause.isDelete = status === "ACTIVE" ? 0 : 1;
    if (type) whereClause.couponType = type === CouponType.FIXED ? 1 : 2;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [{ addTime: "desc" }, { couponId: "desc" }],
      }),
      this.prisma.coupon.count({
        where: whereClause,
      }),
    ]);

    return {
      list: coupons.map((coupon) => this.formatCouponResponse(coupon)),
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
    // 使用新的字段名和逻辑
    if (status === "USED") {
      whereClause.usedTime = { not: null };
    } else if (status === "EXPIRED") {
      whereClause.endDate = { lt: new Date() };
    } else {
      whereClause.usedTime = null;
      whereClause.endDate = { gte: new Date() };
    }

    const [userCoupons, total] = await Promise.all([
      this.prisma.userCoupon.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          coupon: true,
        },
      }),
      this.prisma.userCoupon.count({
        where: whereClause,
      }),
    ]);

    return {
      list: userCoupons.map((uc) => this.formatUserCouponResponse(uc)),
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
      throw new NotFoundException("优惠券不存在");
    }

    return this.formatCouponResponse(coupon);
  }

  /**
   * 更新优惠券 - 对齐PHP版本 coupon/update
   */
  async updateCoupon(
    couponId: number,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponResponse> {
    // 检查优惠券是否存在
    const existingCoupon = await this.prisma.coupon.findFirst({
      where: { couponId: couponId },
    });

    if (!existingCoupon) {
      throw new NotFoundException("优惠券不存在");
    }

    // 如果修改了名称，检查是否与其他优惠券冲突
    if (
      updateCouponDto.name &&
      updateCouponDto.name !== existingCoupon.couponName
    ) {
      const nameConflict = await this.prisma.coupon.findFirst({
        where: {
          couponName: updateCouponDto.name,
          couponId: { not: couponId },
        },
      });

      if (nameConflict) {
        throw new BadRequestException("优惠券名称已存在");
      }
    }

    // 更新优惠券 - 使用映射方法
    const updatedCoupon = await this.prisma.coupon.update({
      where: { couponId: couponId },
      data: this.mapUpdateDtoToCoupon(updateCouponDto),
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
      throw new NotFoundException("优惠券不存在");
    }

    // 检查是否已有用户使用
    const usedCount = await this.prisma.userCoupon.count({
      where: {
        couponId,
        usedTime: { not: null },
      },
    });

    if (usedCount > 0) {
      throw new BadRequestException("该优惠券已有用户使用，不能删除");
    }

    // 删除优惠券
    await this.prisma.coupon.delete({
      where: { couponId: couponId },
    });

    return { message: "优惠券删除成功" };
  }

  /**
   * 领取优惠券 - 对齐PHP版本 coupon/receive
   */
  async receiveCoupon(userId: number, couponId: number) {
    // 检查优惠券是否存在且可领取
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        couponId: couponId,
        isDelete: 0,
      },
    });

    if (!coupon) {
      throw new NotFoundException("优惠券不存在或已失效");
    }

    // 检查优惠券是否在有效期内
    const now = new Date();
    if (
      now < new Date(coupon.useStartDate) ||
      now > new Date(coupon.useEndDate)
    ) {
      throw new BadRequestException("优惠券不在有效期内");
    }

    // 检查优惠券是否还有库存
    const currentSendCount = await this.prisma.userCoupon.count({
      where: { couponId },
    });
    if (currentSendCount >= coupon.limitNum) {
      throw new BadRequestException("优惠券已领完");
    }

    // 检查用户是否已领取过该优惠券
    const existingUserCoupon = await this.prisma.userCoupon.findFirst({
      where: {
        userId,
        couponId,
      },
    });

    if (existingUserCoupon) {
      throw new BadRequestException("您已领取过该优惠券");
    }

    // 领取优惠券 - 使用新的字段名
    const userCoupon = await this.prisma.userCoupon.create({
      data: {
        userId,
        couponId,
        couponSn: `CPN${Date.now()}`,
        startDate: coupon.useStartDate,
        endDate: coupon.useEndDate,
      },
    });

    return { message: "优惠券领取成功" };
  }

  /**
   * 验证优惠券 - 对齐PHP版本 coupon/validate
   */
  async validateCoupon(
    userId: number,
    validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResponse> {
    const { code, orderAmount } = validateCouponDto;

    // 查找优惠券 - 通过优惠券名称查找
    const coupon = await this.prisma.coupon.findFirst({
      where: { couponName: code },
    });

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "优惠券不存在",
      };
    }

    // 检查优惠券状态
    if (coupon.isDelete !== 0) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "优惠券已失效",
      };
    }

    // 检查优惠券有效期
    const now = new Date();
    if (
      now < new Date(coupon.useStartDate) ||
      now > new Date(coupon.useEndDate)
    ) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "优惠券不在有效期内",
      };
    }

    // 检查是否还有库存
    const currentSendCount = await this.prisma.userCoupon.count({
      where: { couponId: coupon.couponId },
    });
    if (currentSendCount >= coupon.limitNum) {
      return {
        isValid: false,
        discountAmount: 0,
        message: "优惠券已领完",
      };
    }

    // 检查用户是否拥有该优惠券
    const userCoupon = await this.prisma.userCoupon.findFirst({
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
        message: "您没有该优惠券或已使用",
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
    if (coupon.couponType === 1) {
      // FIXED
      discountAmount = Number(coupon.couponMoney);
    } else if (coupon.couponType === 2) {
      // PERCENTAGE
      discountAmount = orderAmount * (Number(coupon.couponDiscount) / 100);
      // 应用最大折扣限制
      if (
        coupon.maxOrderAmount &&
        discountAmount > Number(coupon.maxOrderAmount)
      ) {
        discountAmount = Number(coupon.maxOrderAmount);
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
      message: "优惠券可用",
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
      throw new BadRequestException("优惠券验证失败");
    }

    // 标记优惠券为已使用 - 使用新的字段名
    await this.prisma.userCoupon.updateMany({
      where: {
        userId,
        couponId: validation.coupon.id,
        usedTime: null,
      },
      data: {
        usedTime: new Date(),
      },
    });

    return {
      discountAmount: validation.discountAmount,
      message: "优惠券使用成功",
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
        usedTime: null,
      },
      include: {
        coupon: true,
      },
    });

    // 过滤出当前可用的优惠券
    const availableCoupons = [];
    const now = new Date();

    for (const userCoupon of userCoupons) {
      const coupon = userCoupon.coupon;

      // 检查优惠券状态和有效期
      if (coupon.isDelete !== 0) continue;
      if (
        now < new Date(coupon.useStartDate) ||
        now > new Date(coupon.useEndDate)
      )
        continue;
      if (orderAmount < Number(coupon.minOrderAmount)) continue;

      // 计算折扣金额
      let discountAmount = 0;
      if (coupon.couponType === 1) {
        // FIXED
        discountAmount = Number(coupon.couponMoney);
      } else if (coupon.couponType === 2) {
        // PERCENTAGE
        discountAmount = orderAmount * (Number(coupon.couponDiscount) / 100);
        if (
          coupon.maxOrderAmount &&
          discountAmount > Number(coupon.maxOrderAmount)
        ) {
          discountAmount = Number(coupon.maxOrderAmount);
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
      code: coupon.couponName, // 使用优惠券名称作为代码
      type: coupon.couponType === 1 ? CouponType.FIXED : CouponType.PERCENTAGE,
      value: Number(coupon.couponMoney || coupon.couponDiscount),
      minAmount: Number(coupon.minOrderAmount),
      maxDiscount: coupon.maxOrderAmount
        ? Number(coupon.maxOrderAmount)
        : undefined,
      quantity: coupon.limitNum,
      usedQuantity: 0, // 暂时设为0，因为新结构中没有直接的已使用数量字段
      description: coupon.couponDesc,
      startTime: coupon.useStartDate,
      endTime: coupon.useEndDate,
      status:
        coupon.isDelete === 0 ? CouponStatus.ACTIVE : CouponStatus.INACTIVE,
    };
  }

  /**
   * 格式化用户优惠券响应
   */
  private formatUserCouponResponse(userCoupon: any): UserCouponResponse {
    const coupon = userCoupon.coupon;
    return {
      id: userCoupon.id,
      couponId: userCoupon.couponId,
      couponName: coupon.couponName,
      code: coupon.couponName, // 使用优惠券名称作为代码
      type: coupon.couponType === 1 ? CouponType.FIXED : CouponType.PERCENTAGE,
      value: Number(coupon.couponMoney || coupon.couponDiscount),
      minAmount: Number(coupon.minOrderAmount),
      maxDiscount: coupon.maxOrderAmount
        ? Number(coupon.maxOrderAmount)
        : undefined,
      description: coupon.couponDesc,
      startTime: userCoupon.startDate,
      endTime: userCoupon.endDate,
      status: userCoupon.usedTime ? CouponStatus.USED : CouponStatus.ACTIVE,
      isUsed: userCoupon.usedTime !== null,
      usedTime: userCoupon.usedTime,
    };
  }
}
