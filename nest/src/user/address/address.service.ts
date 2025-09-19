import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressListDto,
  AddressDetailDto,
  SetDefaultAddressDto,
  DeleteAddressDto,
  AddressListResponse,
  AddressResponse,
  SuccessResponse,
} from './dto/address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 获取用户地址列表 - 对齐PHP版本 user/address/list
   */
  async getUserAddressList(userId: number, addressListDto: AddressListDto): Promise<AddressListResponse> {
    const { page = 1, size = 15 } = addressListDto;
    const skip = (page - 1) * size;

    const [addresses, total] = await Promise.all([
      this.databaseService.userAddress.findMany({
        where: { userId },
        skip,
        take: size,
        orderBy: { isDefault: 'desc' },
      }),
      this.databaseService.userAddress.count({
        where: { userId },
      }),
    ]);

    return {
      records: addresses.map(address => this.formatAddressResponse(address)),
      total,
    };
  }

  /**
   * 获取地址详情 - 对齐PHP版本 user/address/detail
   */
  async getAddressDetail(userId: number, addressDetailDto: AddressDetailDto): Promise<AddressResponse> {
    const { id } = addressDetailDto;

    const address = await this.databaseService.userAddress.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('地址不存在');
    }

    return {
      address: this.formatAddressResponse(address),
    };
  }

  /**
   * 创建用户地址 - 对齐PHP版本 user/address/create
   */
  async createAddress(userId: number, createAddressDto: CreateAddressDto): Promise<SuccessResponse> {
    const {
      consignee,
      mobile,
      telephone,
      region_ids,
      region_names,
      address,
      postcode,
      email,
      address_tag,
      is_default = 0,
    } = createAddressDto;

    // 验证地区ID和名称数量是否匹配
    if (region_ids.length !== region_names.length) {
      throw new BadRequestException('地区ID和名称数量不匹配');
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (is_default === 1) {
      await this.databaseService.userAddress.updateMany({
        where: { userId },
        data: { isDefault: 0 },
      });
    }

    // 创建地址
    const newAddress = await this.databaseService.userAddress.create({
      data: {
        userId,
        consignee,
        mobile,
        telephone,
        regionIds: region_ids.join(','),
        regionNames: region_names.join(','),
        address,
        postcode,
        email,
        addressTag: address_tag,
        isDefault: is_default,
      },
    });

    return {
      message: '收货地址添加成功',
      address_id: newAddress.id,
    };
  }

  /**
   * 更新用户地址 - 对齐PHP版本 user/address/update
   */
  async updateAddress(userId: number, updateAddressDto: UpdateAddressDto): Promise<SuccessResponse> {
    const {
      id,
      consignee,
      mobile,
      telephone,
      region_ids,
      region_names,
      address,
      postcode,
      email,
      address_tag,
      is_default = 0,
    } = updateAddressDto;

    // 验证地址是否存在
    const existingAddress = await this.databaseService.userAddress.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 验证地区ID和名称数量是否匹配
    if (region_ids.length !== region_names.length) {
      throw new BadRequestException('地区ID和名称数量不匹配');
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (is_default === 1 && existingAddress.isDefault !== 1) {
      await this.databaseService.userAddress.updateMany({
        where: { userId },
        data: { isDefault: 0 },
      });
    }

    // 更新地址
    const updatedAddress = await this.databaseService.userAddress.update({
      where: { id },
      data: {
        consignee,
        mobile,
        telephone,
        regionIds: region_ids.join(','),
        regionNames: region_names.join(','),
        address,
        postcode,
        email,
        addressTag: address_tag,
        isDefault: is_default,
      },
    });

    return {
      message: '收货地址更新成功',
      address_id: updatedAddress.id,
    };
  }

  /**
   * 删除用户地址 - 对齐PHP版本 user/address/delete
   */
  async deleteAddress(userId: number, deleteAddressDto: DeleteAddressDto): Promise<SuccessResponse> {
    const { id } = deleteAddressDto;

    // 验证地址是否存在
    const existingAddress = await this.databaseService.userAddress.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 删除地址
    await this.databaseService.userAddress.delete({
      where: { id },
    });

    return {
      message: '删除成功',
    };
  }

  /**
   * 设置默认地址 - 对齐PHP版本 user/address/setSelected
   */
  async setDefaultAddress(userId: number, setDefaultAddressDto: SetDefaultAddressDto): Promise<SuccessResponse> {
    const { id } = setDefaultAddressDto;

    // 验证地址是否存在
    const existingAddress = await this.databaseService.userAddress.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException('地址不存在');
    }

    // 如果已经是默认地址，直接返回
    if (existingAddress.isDefault === 1) {
      return {
        message: '设置成功',
      };
    }

    // 先将其他地址设为非默认
    await this.databaseService.userAddress.updateMany({
      where: { userId },
      data: { isDefault: 0 },
    });

    // 设置指定地址为默认
    await this.databaseService.userAddress.update({
      where: { id },
      data: { isDefault: 1 },
    });

    return {
      message: '设置成功',
    };
  }

  /**
   * 获取用户默认地址
   */
  async getDefaultAddress(userId: number): Promise<AddressResponse | null> {
    const defaultAddress = await this.databaseService.userAddress.findFirst({
      where: {
        userId,
        isDefault: 1,
      },
    });

    if (!defaultAddress) {
      // 如果没有默认地址，返回第一个地址
      const firstAddress = await this.databaseService.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      return firstAddress ? {
        address: this.formatAddressResponse(firstAddress),
      } : null;
    }

    return {
      address: this.formatAddressResponse(defaultAddress),
    };
  }

  /**
   * 获取地址数量
   */
  async getAddressCount(userId: number): Promise<number> {
    return this.databaseService.userAddress.count({
      where: { userId },
    });
  }

  /**
   * 批量删除地址
   */
  async batchDeleteAddresses(userId: number, addressIds: number[]): Promise<SuccessResponse> {
    // 验证地址是否存在
    const existingAddresses = await this.databaseService.userAddress.findMany({
      where: {
        id: { in: addressIds },
        userId,
      },
    });

    if (existingAddresses.length !== addressIds.length) {
      throw new NotFoundException('部分地址不存在');
    }

    // 删除地址
    await this.databaseService.userAddress.deleteMany({
      where: {
        id: { in: addressIds },
        userId,
      },
    });

    return {
      message: '批量删除成功',
    };
  }

  /**
   * 格式化地址响应
   */
  private formatAddressResponse(address: any) {
    return {
      id: address.id,
      consignee: address.consignee,
      mobile: address.mobile,
      telephone: address.telephone,
      region_ids: address.regionIds ? address.regionIds.split(',').map(id => parseInt(id)) : [],
      region_names: address.regionNames ? address.regionNames.split(',') : [],
      address: address.address,
      postcode: address.postcode,
      email: address.email,
      address_tag: address.addressTag,
      is_default: address.isDefault === 1,
      created_at: address.createdAt,
      updated_at: address.updatedAt,
    };
  }
}