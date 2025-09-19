import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface CreateAddressDto {
  consignee: string;
  mobile: string;
  regionIds: string;
  regionNames: string;
  address: string;
  isDefault?: number;
}

export interface UpdateAddressDto {
  consignee?: string;
  mobile?: string;
  regionIds?: string;
  regionNames?: string;
  address?: string;
  isDefault?: number;
}

@Injectable()
export class AddressService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 获取用户地址列表 - 对齐PHP版本 user/address/list
   */
  async getAddressList(userId: number, query: any = {}) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [addresses, total] = await Promise.all([
      this.prisma.userAddress.findMany({
        where: { userId },
        skip,
        take: limit,
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
      status: 'success',
      data: {
        list: addresses.map(address => this.formatAddressResponse(address)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * 获取地址详情 - 对齐PHP版本 user/address/detail
   */
  async getAddressDetail(userId: number, addressId: number) {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('地址不存在');
    }

    return {
      status: 'success',
      data: this.formatAddressResponse(address),
    };
  }

  /**
   * 创建地址 - 对齐PHP版本 user/address/create
   */
  async createAddress(userId: number, createAddressDto: CreateAddressDto) {
    const { consignee, mobile, regionIds, regionNames, address, isDefault = 0 } = createAddressDto;

    // 如果设置为默认地址，先将其他地址设为非默认
    if (isDefault === 1) {
      await this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: 0 },
      });
    }

    const newAddress = await this.prisma.userAddress.create({
      data: {
        userId,
        consignee,
        mobile,
        regionIds,
        regionNames,
        address,
        isDefault,
      },
    });

    return {
      status: 'success',
      message: '地址添加成功',
      data: this.formatAddressResponse(newAddress),
    };
  }

  /**
   * 更新地址 - 对齐PHP版本 user/address/update
   */
  async updateAddress(userId: number, addressId: number, updateAddressDto: UpdateAddressDto) {
    // 验证地址是否存在且属于该用户
    const existingAddress = await this.prisma.userAddress.findFirst({
      where: {
        addressId,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (updateAddressDto.isDefault === 1) {
      await this.prisma.userAddress.updateMany({
        where: {
          userId,
          addressId: { not: addressId },
        },
        data: { isDefault: 0 },
      });
    }

    const updatedAddress = await this.prisma.userAddress.update({
      where: { addressId },
      data: updateAddressDto,
    });

    return {
      status: 'success',
      message: '地址更新成功',
      data: this.formatAddressResponse(updatedAddress),
    };
  }

  /**
   * 删除地址 - 对齐PHP版本 user/address/delete
   */
  async deleteAddress(userId: number, addressId: number) {
    // 验证地址是否存在且属于该用户
    const address = await this.prisma.userAddress.findFirst({
      where: {
        addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('地址不存在');
    }

    await this.prisma.userAddress.delete({
      where: { addressId },
    });

    return { message: '地址删除成功' };
  }

  /**
   * 设置默认地址 - 对齐PHP版本 user/address/setDefault
   */
  async setDefaultAddress(userId: number, addressId: number) {
    // 验证地址是否存在且属于该用户
    const address = await this.prisma.userAddress.findFirst({
      where: {
        addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('地址不存在');
    }

    // 先将所有地址设为非默认
    await this.prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: 0 },
    });

    // 设置指定地址为默认
    await this.prisma.userAddress.update({
      where: { addressId },
      data: { isDefault: 1 },
    });

    return { message: '默认地址设置成功' };
  }

  /**
   * 获取默认地址 - 对齐PHP版本 user/address/getDefault
   */
  async getDefaultAddress(userId: number) {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        userId,
        isDefault: 1,
      },
    });

    if (!address) {
      // 如果没有默认地址，返回第一个地址
      const firstAddress = await this.prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      return firstAddress ? this.formatAddressResponse(firstAddress) : null;
    }

    return this.formatAddressResponse(address);
  }

  /**
   * 格式化地址响应
   */
  private formatAddressResponse(address: any) {
    return {
      id: address.addressId,
      consignee: address.consignee,
      mobile: address.mobile,
      regionIds: address.regionIds ? JSON.parse(address.regionIds) : [],
      regionNames: address.regionNames ? JSON.parse(address.regionNames) : [],
      address: address.address,
      isDefault: address.isDefault === 1,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}