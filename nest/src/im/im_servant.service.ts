import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImServantService {
  constructor(private prisma: PrismaService) {}

  async modifyStatus(params: { servantId?: number; shopId?: number; status: number }) {
    const { servantId = 0, shopId = 0, status } = params;
    // status: 1=上线 0=下线 (假设约定，可按实际 PHP 逻辑调整)
    // 如果有独立客服表，可更新；当前 schema 中有 im_servant 表
    const now = Math.floor(Date.now() / 1000);
    let record = await this.prisma.im_servant.findFirst({ where: { servant_id: servantId, shop_id: shopId } });
    if (!record) {
      record = await this.prisma.im_servant.create({
        data: {
          servant_id: servantId,
          shop_id: shopId,
          status,
          add_time: now,
          last_update_time: now,
        },
      });
    } else {
      record = await this.prisma.im_servant.update({
        where: { id: record.id },
        data: { status, last_update_time: now },
      });
    }
    return { servantId, shopId, status: record.status };
  }
}
