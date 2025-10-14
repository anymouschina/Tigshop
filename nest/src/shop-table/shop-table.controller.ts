// @ts-nocheck
import { Body, Controller, Get, Param, Post, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ShopTableService } from './shop-table.service';
import { CreateShopTableDto, UpdateShopTableDto } from './dto/shop-table.dto';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { AuthorityGuard } from 'src/auth/guards/authority.guard';
import { Authorities } from 'src/auth/decorators/authority.decorator';

// 命名遵循现有 admin 兼容风格：路径前缀 adminapi/...  & 类名 *CompatController
@Controller('adminapi/shopTable')
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminShopTableCompatController {
  constructor(private readonly service: ShopTableService) {}

  // POST /adminapi/shopTable/create
  @Post('create')
  @Authorities('shopTableManage')
  async create(@Body() dto: CreateShopTableDto) {
    const data = await this.service.create(dto);
    return { code: 0, message: 'success', data };
  }

  // GET /adminapi/shopTable/list?shopId=1
  @Get('list')
  @Authorities('shopTableManage')
  async list(@Query('shopId') shopId: number) {
    const data = await this.service.list(Number(shopId));
    return { code: 0, message: 'success', data: { records: data } };
  }

  // PUT /adminapi/shopTable/update/123
  @Put('update/:id')
  @Authorities('shopTableManage')
  async update(@Param('id') id: number, @Body() dto: UpdateShopTableDto) {
    const data = await this.service.update(Number(id), dto);
    return { code: 0, message: 'success', data };
  }

  // DELETE /adminapi/shopTable/delete/123
  @Delete('delete/:id')
  @Authorities('shopTableManage')
  async remove(@Param('id') id: number) {
    const data = await this.service.remove(Number(id));
    return { code: 0, message: 'success', data };
  }
}
