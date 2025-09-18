import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface CreateAddressDto {
  name: string;
  mobile: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  name?: string;
  mobile?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  isDefault?: boolean;
}

@Injectable()
export class AddressService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 获取用户地址列表 - 对齐PHP版本 user/address/list
   */
  async getAddressList(userId: number, query: any = {}) {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const [addresses, total] = await Promise.all([
      this.prisma.userAddress.findMany({
        where: { userId },
        skip,
        take: size,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.userAddress.count({
        where: { userId },
      }),
    ]);

    return {
      list: addresses,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取地址详情 - 对齐PHP版本 user/address/detail
   */
  async getAddressDetail(userId: number, addressId: number) {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('地址不存在');
    }

    return address;
  }

  /**
   * 添加地址 - 对齐PHP版本 user/address/create
   */
  async createAddress(userId: number, createAddressDto: CreateAddressDto) {
    const { name, mobile, province, city, district, address, isDefault } = createAddressDto;

    // 验证手机号格式
    if (!this.validateMobile(mobile)) {
      throw new BadRequestException('手机号格式不正确');
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // 创建新地址 (使用raw SQL避免Prisma XOR类型问题)
    const newAddress = await this.prisma.$queryRaw`
      INSERT INTO "UserAddress" ("userId", "name", "mobile", "province", "city", "district", "address", "isDefault", "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${mobile}, ${province}, ${city}, ${district}, ${address}, ${isDefault || false}, NOW(), NOW())
      RETURNING *
    `;

    return newAddress;
  }

  /**
   * 更新地址 - 对齐PHP版本 user/address/update
   */
  async updateAddress(userId: number, addressId: number, updateAddressDto: UpdateAddressDto) {
    // 检查地址是否存在且属于当前用户
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 如果更新手机号，验证格式
    if (updateAddressDto.mobile && !this.validateMobile(updateAddressDto.mobile)) {
      throw new BadRequestException('手机号格式不正确');
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (updateAddressDto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: {
          userId,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
    }

    // 更新地址
    const updatedAddress = await this.prisma.userAddress.update({
      where: { id: addressId },
      data: updateAddressDto,
    });

    return updatedAddress;
  }

  /**
   * 删除地址 - 对齐PHP版本 user/address/del
   */
  async deleteAddress(userId: number, addressId: number) {
    // 检查地址是否存在且属于当前用户
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 删除地址
    await this.prisma.userAddress.delete({
      where: { id: addressId },
    });

    return { message: '地址删除成功' };
  }

  /**
   * 设置默认地址 - 对齐PHP版本 user/address/setSelected
   */
  async setDefaultAddress(userId: number, addressId: number) {
    // 检查地址是否存在且属于当前用户
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 开启事务更新默认地址
    await this.prisma.$transaction(async (tx) => {
      // 将所有地址设为非默认
      await tx.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      // 将指定地址设为默认
      await tx.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return { message: '默认地址设置成功' };
  }

  /**
   * 获取默认地址
   */
  async getDefaultAddress(userId: number) {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    return address;
  }

  /**
   * 验证手机号格式
   */
  private validateMobile(mobile: string): boolean {
    const mobileRegex = /^1[3-9]\d{9}$/;
    return mobileRegex.test(mobile);
  }
}