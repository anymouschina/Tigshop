// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressQueryDto,
  SetSelectedDto,
} from "./dto/user-address.dto";

@Injectable()
export class UserAddressService {
  constructor(private prisma: PrismaService) {}

  async getAddressList(userId: number, query: AddressQueryDto) {
    const { page = 1, size = 20 } = query;
    const skip = (page - 1) * size;

    const [addresses, total] = await Promise.all([
      this.prisma.user_address.findMany({
        where: { user_id: userId, is_delete: 0 },
        orderBy: { is_default: "desc" },
        skip,
        take: size,
      }),
      this.prisma.user_address.count({
        where: { user_id: userId, is_delete: 0 },
      }),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records: addresses,
        total,
        page,
        size,
      },
    };
  }

  async getAddressDetail(userId: number, addressId: number) {
    const address = await this.prisma.user_address.findFirst({
      where: {
        address_id: addressId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!address) {
      throw new NotFoundException("地址不存在");
    }

    return {
      code: 200,
      message: "获取成功",
      data: address,
    };
  }

  async createAddress(userId: number, createDto: CreateAddressDto) {
    // 验证省市区数据
    await this.validateRegion(
      createDto.province_id,
      createDto.city_id,
      createDto.district_id,
    );

    // 如果设置为默认地址，先将其他地址设为非默认
    if (createDto.is_default === 1) {
      await this.prisma.user_address.updateMany({
        where: { user_id: userId },
        data: { is_default: 0 },
      });
    }

    const address = await this.prisma.user_address.create({
      data: {
        user_id: userId,
        name: createDto.name,
        mobile: createDto.mobile,
        province_id: createDto.province_id,
        city_id: createDto.city_id,
        district_id: createDto.district_id,
        address: createDto.address,
        is_default: createDto.is_default || 0,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "添加成功",
      data: address,
    };
  }

  async updateAddress(userId: number, updateDto: UpdateAddressDto) {
    // 验证地址是否存在
    const existingAddress = await this.prisma.user_address.findFirst({
      where: {
        address_id: updateDto.address_id,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException("地址不存在");
    }

    // 验证省市区数据
    if (updateDto.province_id || updateDto.city_id || updateDto.district_id) {
      await this.validateRegion(
        updateDto.province_id || existingAddress.province_id,
        updateDto.city_id || existingAddress.city_id,
        updateDto.district_id || existingAddress.district_id,
      );
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (updateDto.is_default === 1) {
      await this.prisma.user_address.updateMany({
        where: { user_id: userId },
        data: { is_default: 0 },
      });
    }

    const address = await this.prisma.user_address.update({
      where: { address_id: updateDto.address_id },
      data: {
        name: updateDto.name,
        mobile: updateDto.mobile,
        province_id: updateDto.province_id,
        city_id: updateDto.city_id,
        district_id: updateDto.district_id,
        address: updateDto.address,
        is_default: updateDto.is_default,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "更新成功",
      data: address,
    };
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await this.prisma.user_address.findFirst({
      where: {
        address_id: addressId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!address) {
      throw new NotFoundException("地址不存在");
    }

    // 检查是否是默认地址
    if (address.is_default === 1) {
      throw new BadRequestException("不能删除默认地址");
    }

    // 检查是否有未完成的订单使用该地址
    const orderCount = await this.prisma.order.count({
      where: {
        user_id: userId,
        address_id: addressId,
        order_status: { in: [1, 2, 3] }, // 待付款、待发货、待收货
      },
    });

    if (orderCount > 0) {
      throw new BadRequestException("该地址有未完成的订单，不能删除");
    }

    await this.prisma.user_address.update({
      where: { address_id: addressId },
      data: {
        is_delete: 1,
        delete_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "删除成功",
      data: null,
    };
  }

  async setSelectedAddress(userId: number, addressId: number) {
    const address = await this.prisma.user_address.findFirst({
      where: {
        address_id: addressId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!address) {
      throw new NotFoundException("地址不存在");
    }

    await this.prisma.$transaction(async (prisma) => {
      // 将其他地址设为非默认
      await prisma.user_address.updateMany({
        where: { user_id: userId },
        data: { is_default: 0 },
      });

      // 设置当前地址为默认
      await prisma.user_address.update({
        where: { address_id: addressId },
        data: { is_default: 1 },
      });
    });

    return {
      code: 200,
      message: "设置成功",
      data: null,
    };
  }

  async getDefaultAddress(userId: number) {
    const address = await this.prisma.user_address.findFirst({
      where: {
        user_id: userId,
        is_default: 1,
        is_delete: 0,
      },
    });

    if (!address) {
      // 如果没有默认地址，返回最新添加的地址
      const latestAddress = await this.prisma.user_address.findFirst({
        where: {
          user_id: userId,
          is_delete: 0,
        },
        orderBy: { add_time: "desc" },
      });

      if (latestAddress) {
        return {
          code: 200,
          message: "获取成功",
          data: latestAddress,
        };
      }

      return {
        code: 200,
        message: "暂无收货地址",
        data: null,
      };
    }

    return {
      code: 200,
      message: "获取成功",
      data: address,
    };
  }

  async getAddressStatistics(userId: number) {
    const [total, defaultCount] = await Promise.all([
      this.prisma.user_address.count({
        where: { user_id: userId, is_delete: 0 },
      }),
      this.prisma.user_address.count({
        where: { user_id: userId, is_default: 1, is_delete: 0 },
      }),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        total,
        default_count: defaultCount,
      },
    };
  }

  async setPrimaryAddress(userId: number, addressId: number) {
    // 设置主要收货地址（用于B2B场景）
    const address = await this.prisma.user_address.findFirst({
      where: {
        address_id: addressId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!address) {
      throw new NotFoundException("地址不存在");
    }

    await this.prisma.user_address.updateMany({
      where: { user_id: userId },
      data: { is_primary: 0 },
    });

    await this.prisma.user_address.update({
      where: { address_id: addressId },
      data: { is_primary: 1 },
    });

    return {
      code: 200,
      message: "设置成功",
      data: null,
    };
  }

  async getRegionData(parentId: number = 0) {
    const regions = await this.prisma.region.findMany({
      where: { parent_id: parentId },
      orderBy: { sort_order: "asc" },
      select: {
        region_id: true,
        region_name: true,
        region_type: true,
        parent_id: true,
      },
    });

    return {
      code: 200,
      message: "获取成功",
      data: regions,
    };
  }

  // 私有方法
  private async validateRegion(
    provinceId: number,
    cityId: number,
    districtId?: number,
  ) {
    // 验证省份
    const province = await this.prisma.region.findFirst({
      where: { region_id: provinceId, region_type: 1 },
    });

    if (!province) {
      throw new BadRequestException("省份信息不正确");
    }

    // 验证城市
    const city = await this.prisma.region.findFirst({
      where: { region_id: cityId, parent_id: provinceId, region_type: 2 },
    });

    if (!city) {
      throw new BadRequestException("城市信息不正确");
    }

    // 验证区县（如果提供）
    if (districtId) {
      const district = await this.prisma.region.findFirst({
        where: { region_id: districtId, parent_id: cityId, region_type: 3 },
      });

      if (!district) {
        throw new BadRequestException("区县信息不正确");
      }
    }
  }
}
