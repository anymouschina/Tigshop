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
}

