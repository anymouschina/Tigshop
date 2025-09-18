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
import { AddressService, CreateAddressDto, UpdateAddressDto } from './address.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('User Address Management')
@Controller('user/address')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * 获取地址列表 - 对齐PHP版本 user/address/list
   */
  @Get('list')
  @ApiOperation({ summary: '获取地址列表' })
  async getAddressList(@Request() req, @Query() query: any = {}) {
    return this.addressService.getAddressList(req.user.userId, query);
  }

  /**
   * 获取地址详情 - 对齐PHP版本 user/address/detail
   */
  @Get('detail')
  @ApiOperation({ summary: '获取地址详情' })
  async getAddressDetail(@Request() req, @Query() query: { id: number }) {
    return this.addressService.getAddressDetail(req.user.userId, Number(query.id));
  }

  /**
   * 添加地址 - 对齐PHP版本 user/address/create
   */
  @Post('create')
  @ApiOperation({ summary: '添加地址' })
  async createAddress(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressService.createAddress(req.user.userId, createAddressDto);
  }

  /**
   * 更新地址 - 对齐PHP版本 user/address/update
   */
  @Post('update')
  @ApiOperation({ summary: '更新地址' })
  async updateAddress(
    @Request() req,
    @Body() data: { id: number; [key: string]: any },
  ) {
    const { id, ...updateData } = data;
    return this.addressService.updateAddress(req.user.userId, Number(id), updateData as UpdateAddressDto);
  }

  /**
   * 删除地址 - 对齐PHP版本 user/address/del
   */
  @Delete('del')
  @ApiOperation({ summary: '删除地址' })
  async deleteAddress(@Request() req, @Query() query: { id: number }) {
    return this.addressService.deleteAddress(req.user.userId, Number(query.id));
  }

  /**
   * 设置默认地址 - 对齐PHP版本 user/address/setSelected
   */
  @Post('setSelected')
  @ApiOperation({ summary: '设置默认地址' })
  async setDefaultAddress(
    @Request() req,
    @Body() data: { id: number },
  ) {
    return this.addressService.setDefaultAddress(req.user.userId, Number(data.id));
  }

  /**
   * 获取默认地址 - 新增功能
   */
  @Get('getDefault')
  @ApiOperation({ summary: '获取默认地址' })
  async getDefaultAddress(@Request() req) {
    return this.addressService.getDefaultAddress(req.user.userId);
  }
}