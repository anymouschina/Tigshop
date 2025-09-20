import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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

@ApiTags('User Address Management')
@Controller('api/user/address')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * 获取地址列表 - 对齐PHP版本 user/address/list
   */
  @Get('list')
  @ApiOperation({ summary: '获取地址列表' })
  async getAddressList(@Request() req, @Query() addressListDto: AddressListDto): Promise<AddressListResponse> {
    return this.addressService.getUserAddressList(req.user.userId, addressListDto);
  }

  /**
   * 获取地址详情 - 对齐PHP版本 user/address/detail
   */
  @Get('detail')
  @ApiOperation({ summary: '获取地址详情' })
  async getAddressDetail(@Request() req, @Query() addressDetailDto: AddressDetailDto): Promise<AddressResponse> {
    return this.addressService.getAddressDetail(req.user.userId, addressDetailDto);
  }

  /**
   * 添加地址 - 对齐PHP版本 user/address/create
   */
  @Post('create')
  @ApiOperation({ summary: '添加地址' })
  async createAddress(@Request() req, @Body() createAddressDto: CreateAddressDto): Promise<SuccessResponse> {
    return this.addressService.createAddress(req.user.userId, createAddressDto);
  }

  /**
   * 更新地址 - 对齐PHP版本 user/address/update
   */
  @Post('update')
  @ApiOperation({ summary: '更新地址' })
  async updateAddress(@Request() req, @Body() updateAddressDto: UpdateAddressDto): Promise<SuccessResponse> {
    return this.addressService.updateAddress(req.user.userId, updateAddressDto);
  }

  /**
   * 删除地址 - 对齐PHP版本 user/address/delete
   */
  @Post('del')
  @ApiOperation({ summary: '删除地址' })
  async deleteAddress(@Request() req, @Body() deleteAddressDto: DeleteAddressDto): Promise<SuccessResponse> {
    return this.addressService.deleteAddress(req.user.userId, deleteAddressDto);
  }

  /**
   * 设置默认地址 - 对齐PHP版本 user/address/setSelected
   */
  @Post('setSelected')
  @ApiOperation({ summary: '设置默认地址' })
  async setDefaultAddress(@Request() req, @Body() setDefaultAddressDto: SetDefaultAddressDto): Promise<SuccessResponse> {
    return this.addressService.setDefaultAddress(req.user.userId, setDefaultAddressDto);
  }

  /**
   * 获取默认地址 - 新增功能
   */
  @Get('getDefault')
  @ApiOperation({ summary: '获取默认地址' })
  async getDefaultAddress(@Request() req): Promise<AddressResponse | null> {
    return this.addressService.getDefaultAddress(req.user.userId);
  }

  /**
   * 批量删除地址 - 新增功能
   */
  @Post('batchDelete')
  @ApiOperation({ summary: '批量删除地址' })
  async batchDeleteAddresses(@Request() req, @Body() body: { addressIds: number[] }): Promise<SuccessResponse> {
    return this.addressService.batchDeleteAddresses(req.user.userId, body.addressIds);
  }

  /**
   * 获取地址数量 - 新增功能
   */
  @Get('count')
  @ApiOperation({ summary: '获取地址数量' })
  async getAddressCount(@Request() req): Promise<{ count: number }> {
    const count = await this.addressService.getAddressCount(req.user.userId);
    return { count };
  }
}
