import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AddressService } from "./address.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { resolveRequestUserId } from "src/common/utils/request-user.util";
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
} from "./dto/address.dto";

@ApiTags("User Address Management")
@Controller("api/user/address")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /**
   * 获取地址列表 - 对齐PHP版本 user/address/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取地址列表" })
  async getAddressList(
    @Request() req,
    @Query() addressListDto: AddressListDto,
  ): Promise<AddressListResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.getUserAddressList(userId, addressListDto);
  }

  /**
   * 获取地址详情 - 对齐PHP版本 user/address/detail
   */
  @Get("detail")
  @ApiOperation({ summary: "获取地址详情" })
  async getAddressDetail(
    @Request() req,
    @Query() addressDetailDto: AddressDetailDto,
  ): Promise<AddressResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.getAddressDetail(userId, addressDetailDto);
  }

  /**
   * 添加地址 - 对齐PHP版本 user/address/create
   */
  @Post("create")
  @ApiOperation({ summary: "添加地址" })
  async createAddress(
    @Request() req,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<SuccessResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.createAddress(userId, createAddressDto);
  }

  /**
   * 更新地址 - 对齐PHP版本 user/address/update
   */
  @Post("update")
  @ApiOperation({ summary: "更新地址" })
  async updateAddress(
    @Request() req,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<SuccessResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.updateAddress(userId, updateAddressDto);
  }

  /**
   * 删除地址 - 对齐PHP版本 user/address/delete
   */
  @Post("del")
  @ApiOperation({ summary: "删除地址" })
  async deleteAddress(
    @Request() req,
    @Body() deleteAddressDto: DeleteAddressDto,
  ): Promise<SuccessResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.deleteAddress(userId, deleteAddressDto);
  }

  /**
   * 设置默认地址 - 对齐PHP版本 user/address/setSelected
   */
  @Post("setSelected")
  @ApiOperation({ summary: "设置默认地址" })
  async setDefaultAddress(
    @Request() req,
    @Body() setDefaultAddressDto: SetDefaultAddressDto,
  ): Promise<SuccessResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.setDefaultAddress(userId, setDefaultAddressDto);
  }

  /**
   * 获取默认地址 - 新增功能
   */
  @Get("getDefault")
  @ApiOperation({ summary: "获取默认地址" })
  async getDefaultAddress(@Request() req): Promise<AddressResponse | null> {
    const userId = resolveRequestUserId(req);
    return this.addressService.getDefaultAddress(userId);
  }

  /**
   * 批量删除地址 - 新增功能
   */
  @Post("batchDelete")
  @ApiOperation({ summary: "批量删除地址" })
  async batchDeleteAddresses(
    @Request() req,
    @Body() body: { addressIds: number[] },
  ): Promise<SuccessResponse> {
    const userId = resolveRequestUserId(req);
    return this.addressService.batchDeleteAddresses(userId, body.addressIds);
  }

  /**
   * 获取地址数量 - 新增功能
   */
  @Get("count")
  @ApiOperation({ summary: "获取地址数量" })
  async getAddressCount(@Request() req): Promise<{ count: number }> {
    const userId = resolveRequestUserId(req);
    const count = await this.addressService.getAddressCount(userId);
    return { count };
  }
}
