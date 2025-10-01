// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateShippingTplDto,
  UpdateShippingTplDto,
  ShippingTplQueryDto,
  ShippingTplStatus,
  ShippingTplConfigDto,
} from "./dto/shippingTpl.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ShippingTplService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: ShippingTplQueryDto) {
    const { keyword, page = 1, size = 15, sortField = "tpl_id", sortOrder = "desc" } = queryDto;
    const offset = Math.max(0, (page - 1) * size);

    // Prisma schema marks shipping_tpl as @@ignore (no delegate). Use raw SQL safely.
    const allowedSortMap: Record<string, string> = {
      tpl_id: "shipping_tpl_id",
      id: "shipping_tpl_id",
      name: "shipping_tpl_name",
      shipping_tpl_name: "shipping_tpl_name",
      is_default: "is_default",
      pricing_type: "pricing_type",
      is_free: "is_free",
    };
    const orderCol = allowedSortMap[String(sortField).toLowerCase()] || "shipping_tpl_id";
    const orderDir = String(sortOrder).toLowerCase() === "asc" ? "ASC" : "DESC";

    const whereSql = keyword ? "WHERE `shipping_tpl_name` LIKE ?" : "";
    const whereParams: any[] = keyword ? [`%${keyword}%`] : [];

    const listSql = `SELECT shipping_tpl_id, shipping_tpl_name, shipping_time, is_free, pricing_type, is_default, shop_id
      FROM \`shipping_tpl\`
      ${whereSql}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ? OFFSET ?`;

    const countSql = `SELECT COUNT(*) as total FROM \`shipping_tpl\` ${whereSql}`;

    const [records, countRows]: [any[], any[]] = await Promise.all([
      this.prisma.$queryRawUnsafe(listSql, ...whereParams, Number(size), Number(offset)),
      this.prisma.$queryRawUnsafe(countSql, ...whereParams),
    ]);

    const total = Number((countRows?.[0]?.total) || 0);
    return { records, total, page, size, totalPages: Math.ceil(total / size) };
  }

  // 兼容 admin 端简单列表调用
  async getList(params: { page?: number; size?: number; keyword?: string }) {
    const { page = 1, size = 100, keyword = "" } = params || {};
    const result = await this.findAll({ page, size, keyword } as any);
    return { records: result.records, total: result.total };
  }

  async findById(id: number) {
    const item = await this.prisma.shipping_tpl.findUnique({
      where: { tpl_id: id },
    });

    if (!item) {
      throw new NotFoundException("运费模板不存在");
    }

    return item;
  }

  async create(createDto: CreateShippingTplDto) {
    const item = await this.prisma.shipping_tpl.create({
      data: {
        name: createDto.name,
        is_default: createDto.isDefault,
        free_amount: createDto.freeAmount,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateShippingTplDto) {
    const item = await this.prisma.shipping_tpl.findUnique({
      where: { tpl_id: id },
    });

    if (!item) {
      throw new NotFoundException("运费模板不存在");
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.isDefault !== undefined) {
      updateData.is_default = updateDto.isDefault;
    }
    if (updateDto.freeAmount !== undefined) {
      updateData.free_amount = updateDto.freeAmount;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.shipping_tpl.update({
      where: { tpl_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.shipping_tpl.findUnique({
      where: { tpl_id: id },
    });

    if (!item) {
      throw new NotFoundException("运费模板不存在");
    }

    await this.prisma.shipping_tpl.delete({
      where: { tpl_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.shipping_tpl.deleteMany({
      where: { tpl_id: { in: ids } },
    });
  }

  async getConfig(): Promise<ShippingTplConfigDto> {
    return {
      statusConfig: {
        [ShippingTplStatus.DISABLED]: "禁用",
        [ShippingTplStatus.ENABLED]: "启用",
      },
    };
  }
}
