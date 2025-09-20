// @ts-nocheck
import { Controller, Get, Post, Body, Query, Request, UseGuards, Delete, Put, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserAddressService } from './user-address.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressQueryDto,
  SetSelectedDto,
} from './dto/user-address.dto';

@ApiTags('用户端收货地址')
@Controller('api/user/address')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Get('list')
  @ApiOperation({ summary: '获取收货地址列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async list(@Request() req, @Query() query: AddressQueryDto) {
    const userId = req.user.userId;
    return this.userAddressService.getAddressList(userId, query);
  }

  @Get('detail')
  @ApiOperation({ summary: '获取收货地址详情' })
  @ApiQuery({ name: 'address_id', required: true, description: '地址ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async detail(@Request() req, @Query() query: { address_id: number }) {
    const userId = req.user.userId;
    const addressId = query.address_id;
    return this.userAddressService.getAddressDetail(userId, addressId);
  }

  @Post('create')
  @ApiOperation({ summary: '添加收货地址' })
  @ApiResponse({ status: 200, description: '添加成功' })
  async create(@Request() req, @Body() createDto: CreateAddressDto) {
    const userId = req.user.userId;
    return this.userAddressService.createAddress(userId, createDto);
  }

  @Post('update')
  @ApiOperation({ summary: '更新收货地址' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Request() req, @Body() updateDto: UpdateAddressDto) {
    const userId = req.user.userId;
    return this.userAddressService.updateAddress(userId, updateDto);
  }

  @Post('del')
  @ApiOperation({ summary: '删除收货地址' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(@Request() req, @Body() body: { address_id: number }) {
    const userId = req.user.userId;
    const addressId = body.address_id;
    return this.userAddressService.deleteAddress(userId, addressId);
  }

  @Post('setSelected')
  @ApiOperation({ summary: '设置默认地址' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setSelected(@Request() req, @Body() body: SetSelectedDto) {
    const userId = req.user.userId;
    return this.userAddressService.setSelectedAddress(userId, body.address_id);
  }

  @Get('default')
  @ApiOperation({ summary: '获取默认收货地址' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDefault(@Request() req) {
    const userId = req.user.userId;
    return this.userAddressService.getDefaultAddress(userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取地址统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async statistics(@Request() req) {
    const userId = req.user.userId;
    return this.userAddressService.getAddressStatistics(userId);
  }

  @Post('setPrimary')
  @ApiOperation({ summary: '设置主要收货地址' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setPrimary(@Request() req, @Body() body: { address_id: number }) {
    const userId = req.user.userId;
    const addressId = body.address_id;
    return this.userAddressService.setPrimaryAddress(userId, addressId);
  }

  @Get('region')
  @ApiOperation({ summary: '获取地区数据' })
  @ApiQuery({ name: 'parent_id', required: false, description: '父级地区ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRegion(@Query() query: { parent_id?: number }) {
    const parentId = query.parent_id || 0;
    return this.userAddressService.getRegionData(parentId);
  }
}
