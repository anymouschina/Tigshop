import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { AuthorityGuard } from 'src/auth/guards/authority.guard';
import { Authorities } from 'src/auth/decorators/authority.decorator';
import { PanelService } from 'src/panel/panel.service';

@Controller('adminapi/product/eCardGroup')
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminECardGroupCompatController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly panel: PanelService,
  ) {}

  // 列表
  @Get('list')
  @Authorities('product.ecardgroup.list')
  async list(@Query() query: any, @Request() req: any) {
    const page = Number(query.page || 1);
    const size = Number(query.size || 10);
    const skip = (page - 1) * size;
    const where: any = {};
    // 店铺隔离：限定当前管理员所属店铺
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    if (shopId > 0) where.shop_id = shopId;
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
  async detail(@Query('id') id: string, @Request() req: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const record = await this.prisma.e_card_group.findFirst({ where: { group_id: Number(id), ...(shopId > 0 ? { shop_id: shopId } : {}) } });
    return { code: 0, message: 'success', data: record };
  }

  // 新增
  @Post('create')
  @Authorities('product.ecardgroup.create')
  async create(@Body() body: any, @Request() req: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const data = {
      group_name: body.groupName || body.group_name,
      remark: body.remark || '',
      is_use: Boolean(body.isEnabled ?? body.is_enabled ?? false),
      shop_id: Number(shopId) || 0,
      add_time: Math.floor(Date.now() / 1000),
    } as any;
    const created = await this.prisma.e_card_group.create({ data });
    return { code: 0, message: 'success', data: created };
  }

  // 修改
  @Post('update')
  @Authorities('product.ecardgroup.update')
  async update(@Body() body: any, @Request() req: any) {
    const id = Number(body.id);
    if (!id) return { code: 400, message: 'id required', data: null };

    // 店铺隔离校验
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const whereCheck: any = { group_id: id };
    if (shopId > 0) whereCheck.shop_id = shopId;
    const exists = await this.prisma.e_card_group.findFirst({ where: whereCheck, select: { group_id: true } });
    if (!exists) return { code: 404, message: 'record not found', data: null };

    const data = {
      group_name: body.groupName ?? body.group_name,
      remark: body.remark,
      is_use:
        typeof body.isEnabled !== 'undefined' || typeof body.is_enabled !== 'undefined'
          ? Boolean(body.isEnabled ?? body.is_enabled)
          : undefined,
      up_time: Math.floor(Date.now() / 1000),
    } as any;
    const updated = await this.prisma.e_card_group.update({ where: { group_id: id }, data });
    return { code: 0, message: 'success', data: updated };
  }

  // 单字段更新（兼容 Admin 调用）
  @Post('updateField')
  @Authorities('product.ecardgroup.update')
  async updateField(@Body() body: any, @Request() req: any) {
    const id = Number(body.id || body.group_id);
    const field = String(body.field || '');
    const val = body.val ?? body.value;
    if (!id) return { code: 400, message: 'id required', data: null };

    // 仅允许部分字段被更新
    const fieldMap: Record<string, string> = {
      is_use: 'is_use',
      isUse: 'is_use',
      remark: 'remark',
      group_name: 'group_name',
      groupName: 'group_name',
    };
    const dbField = fieldMap[field];
    if (!dbField) return { code: 400, message: 'unsupported field', data: null };

    // 店铺隔离校验
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const where: any = { group_id: id };
    if (shopId > 0) where.shop_id = shopId;

    // 先检查记录归属
    const exists = await this.prisma.e_card_group.findFirst({ where, select: { group_id: true } });
    if (!exists) return { code: 404, message: 'record not found', data: null };

    // 值规范化
    let normalized = val;
    if (dbField === 'is_use') {
      const v = String(val).toLowerCase();
      normalized = v === '1' || v === 'true' || v === 'yes' || v === 'on' || val === 1 || val === true;
    }

    await this.prisma.e_card_group.update({ where: { group_id: id }, data: { [dbField]: normalized, up_time: Math.floor(Date.now() / 1000) } });
    return { code: 0, message: 'success', data: true };
  }

  // 删除
  @Post('del')
  @Authorities('product.ecardgroup.delete')
  async del(@Body('id') id: number, @Request() req: any) {
    const groupId = Number(id);
    if (!groupId) return { code: 400, message: 'id required', data: null };
    const shopId = await this.panel.getUserShopId(req.user?.userId);

    if (shopId > 0) {
      const result = await this.prisma.e_card_group.deleteMany({ where: { group_id: groupId, shop_id: shopId } });
      if (result.count === 0) return { code: 404, message: 'record not found', data: null };
    } else {
      // 超级管理员（无店铺限制）
      await this.prisma.e_card_group.delete({ where: { group_id: groupId } });
    }
    return { code: 0, message: 'success', data: true };
  }

  // 批量启用/停用/删除（兼容常见 Admin 批处理）
  @Post('batch')
  @Authorities('product.ecardgroup.batch')
  async batch(@Body() body: any, @Request() req: any) {
    const ids: number[] = (body.ids || []).map((x) => Number(x));
    const act: string = body.act || body.action;
    if (!ids.length) return { code: 0, message: 'success', data: true };
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const whereBase: any = { group_id: { in: ids } };
    if (shopId > 0) whereBase.shop_id = shopId;
    if (act === 'delete') {
      await this.prisma.e_card_group.deleteMany({ where: whereBase });
      return { code: 0, message: 'success', data: true };
    }
    if (act === 'enable' || act === 'disable') {
      await this.prisma.e_card_group.updateMany({ where: whereBase, data: { is_use: act === 'enable', up_time: Math.floor(Date.now() / 1000) } });
      return { code: 0, message: 'success', data: true };
    }
    return { code: 0, message: 'success', data: true };
  }
}
