import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { AuthorityGuard } from 'src/auth/guards/authority.guard';
import { Authorities } from 'src/auth/decorators/authority.decorator';

@Controller('adminapi/product/eCardGroup')
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminECardGroupCompatController {
  constructor(private readonly prisma: PrismaService) {}

  // 列表
  @Get('list')
  @Authorities('product.ecardgroup.list')
  async list(@Query() query: any) {
    const page = Number(query.page || 1);
    const size = Number(query.size || 10);
    const skip = (page - 1) * size;
    const where: any = {};
    if (query.keyword) {
      where.group_name = { contains: String(query.keyword) };
    }
    const [records, total] = await Promise.all([
      this.prisma.e_card_group.findMany({ where, orderBy: { group_id: 'desc' }, skip, take: size }),
      this.prisma.e_card_group.count({ where }),
    ]);
    return { code: 0, message: 'success', data: { records, total } };
  }

  // 详情
  @Get('detail')
  @Authorities('product.ecardgroup.detail')
  async detail(@Query('id') id: string) {
  const record = await this.prisma.e_card_group.findUnique({ where: { group_id: Number(id) } });
    return { code: 0, message: 'success', data: record };
  }

  // 新增
  @Post('create')
  @Authorities('product.ecardgroup.create')
  async create(@Body() body: any) {
    const data = {
      group_name: body.groupName || body.group_name,
      remark: body.remark || '',
      is_use: Boolean(body.isEnabled ?? body.is_enabled ?? false),
    } as any;
    const created = await this.prisma.e_card_group.create({ data });
    return { code: 0, message: 'success', data: created };
  }

  // 修改
  @Post('update')
  @Authorities('product.ecardgroup.update')
  async update(@Body() body: any) {
    const id = Number(body.id);
    const data = {
      group_name: body.groupName ?? body.group_name,
      remark: body.remark,
      is_use: typeof body.isEnabled !== 'undefined' || typeof body.is_enabled !== 'undefined' ? Boolean(body.isEnabled ?? body.is_enabled) : undefined,
    } as any;
    const updated = await this.prisma.e_card_group.update({ where: { group_id: id }, data });
    return { code: 0, message: 'success', data: updated };
  }

  // 删除
  @Post('del')
  @Authorities('product.ecardgroup.delete')
  async del(@Body('id') id: number) {
    await this.prisma.e_card_group.delete({ where: { group_id: Number(id) } });
    return { code: 0, message: 'success', data: true };
  }

  // 批量启用/停用/删除（兼容常见 Admin 批处理）
  @Post('batch')
  @Authorities('product.ecardgroup.batch')
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => Number(x));
    const act: string = body.act || body.action;
    if (!ids.length) return { code: 0, message: 'success', data: true };
    if (act === 'delete') {
      await this.prisma.e_card_group.deleteMany({ where: { group_id: { in: ids } } });
      return { code: 0, message: 'success', data: true };
    }
    if (act === 'enable' || act === 'disable') {
      await this.prisma.e_card_group.updateMany({ where: { group_id: { in: ids } }, data: { is_use: act === 'enable' } });
      return { code: 0, message: 'success', data: true };
    }
    return { code: 0, message: 'success', data: true };
  }
}
