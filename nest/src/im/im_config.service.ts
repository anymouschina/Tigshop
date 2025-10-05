import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImConfigService {
  constructor(private prisma: PrismaService) {}

  async getDetail(params: { code: string; shopId?: number }) {
    const { code, shopId = 0 } = params;
    if (!code) return null;
    const row = await this.prisma.im_config.findFirst({
      where: { code, shop_id: shopId },
      orderBy: { id: 'desc' },
    });
    if (!row) return null;
    let parsed: any = row.data;
    try {
      parsed = row.data ? JSON.parse(row.data as any) : null;
    } catch (_) {
      // not JSON, keep as original string
    }
    return { id: row.id, code: row.code, data: parsed, shopId: row.shop_id } as any;
  }

  async save(params: { code: string; shopId?: number; data: any }) {
    const { code, shopId = 0, data } = params;
    if (!code) throw new Error('缺少 code');
    // 统一存 JSON 字符串
    let dataStr: string | null = null;
    if (data !== null && data !== undefined) {
      if (typeof data === 'string') {
        // 如果传入已经是字符串，尝试解析验证是否为 JSON；失败则按原样存
        try { JSON.parse(data); dataStr = data; } catch { dataStr = JSON.stringify({ value: data }); }
      } else {
        dataStr = JSON.stringify(data);
      }
    }
    // 查是否存在
    const exist = await this.prisma.im_config.findFirst({ where: { code, shop_id: shopId }, orderBy: { id: 'desc' } });
    let row;
    if (exist) {
      row = await this.prisma.im_config.update({ where: { id: exist.id }, data: { data: dataStr as any } });
    } else {
      row = await this.prisma.im_config.create({ data: { code, data: dataStr as any, shop_id: shopId } });
    }
    return { id: row.id, code: row.code, shopId: row.shop_id } as any;
  }
}

