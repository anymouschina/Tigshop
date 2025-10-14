// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopTableDto, UpdateShopTableDto } from './dto/shop-table.dto';

@Injectable()
export class ShopTableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShopTableDto) {
    const exists = await this.prisma.shop_table.findFirst({ where: { shop_id: dto.shopId, table_no: dto.tableNo } });
    if (exists) throw new BadRequestException('桌号已存在');
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.shop_table.create({
      data: {
        shop_id: dto.shopId,
        table_no: dto.tableNo,
        qr_code_key: dto.qrCodeKey || null,
        capacity: dto.capacity || null,
        area: dto.area || null,
        add_time: now,
        update_time: now,
      },
    });
  }

  async list(shopId: number) {
    return this.prisma.shop_table.findMany({ where: { shop_id: shopId }, orderBy: { sort: 'asc' } });
  }

  async update(id: number, dto: UpdateShopTableDto) {
    const row = await this.prisma.shop_table.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('桌位不存在');
    const dup = await this.prisma.shop_table.findFirst({ where: { shop_id: dto.shopId, table_no: dto.tableNo, NOT: { id } } });
    if (dup) throw new BadRequestException('桌号重复');
    const now = Math.floor(Date.now() / 1000);
    return this.prisma.shop_table.update({
      where: { id },
      data: {
        shop_id: dto.shopId,
        table_no: dto.tableNo,
        qr_code_key: dto.qrCodeKey || null,
        capacity: dto.capacity || null,
        area: dto.area || null,
        update_time: now,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.shop_table.delete({ where: { id } });
    return { id };
  }

  async findByQr(code: string) {
    return this.prisma.shop_table.findFirst({ where: { qr_code_key: code } });
  }
}
