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

  // ===== Admin Compat Raw SQL Methods (shipping_tpl is @@ignore) =====
  private mapCompatRow(row: any) {
    if (!row) return null;
    return {
      shippingTplId: Number(row.shipping_tpl_id || row.tpl_id || 0),
      shipping_tpl_id: Number(row.shipping_tpl_id || row.tpl_id || 0),
      shipping_tpl_name: row.shipping_tpl_name || row.name || "",
      shipping_time: row.shipping_time || "",
      is_free: Number(row.is_free ?? row.is_free_amount ?? 0),
      pricing_type: Number(row.pricing_type ?? 1),
      is_default: Number(row.is_default ?? 0),
      shop_id: Number(row.shop_id ?? 0),
    };
  }

  async findOneCompat(id: number) {
    if (!id) return null;
    const sql = `SELECT shipping_tpl_id, shipping_tpl_name, shipping_time, is_free, pricing_type, is_default, shop_id FROM \`shipping_tpl\` WHERE shipping_tpl_id = ? LIMIT 1`;
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql, id);
    return this.mapCompatRow(rows?.[0]);
  }

  async createCompat(data: any) {
    const name = (data?.name || data?.shipping_tpl_name || data?.Name || "").toString().trim();
    if (!name) {
      throw new BadRequestException("名称不能为空");
    }
    const isDefault = Number(data?.is_default ?? data?.isDefault ?? data?.IsDefault ?? 0) === 1 ? 1 : 0;
    const isFree = Number(data?.is_free ?? data?.isFree ?? 0) === 1 ? 1 : 0;
    const pricingType = Number(data?.pricing_type ?? 1) || 1;
    const shopId = Number(data?.shopId ?? data?.shop_id ?? 0) || 0;
    const shippingTime = (data?.shipping_time || "").toString().trim();

    const insertSql = `INSERT INTO \`shipping_tpl\` (shipping_tpl_name, shipping_time, is_free, pricing_type, is_default, shop_id)
      VALUES (?, ?, ?, ?, ?, ?)`;
    await this.prisma.$executeRawUnsafe(
      insertSql,
      name,
      shippingTime,
      isFree,
      pricingType,
      isDefault,
      shopId,
    );
    const idSql = `SELECT LAST_INSERT_ID() as id`;
    const last: any[] = await this.prisma.$queryRawUnsafe(idSql);
    const newId = Number(last?.[0]?.id || 0);
    return this.findOneCompat(newId);
  }

  async updateCompat(id: number, data: any) {
    if (!id) throw new BadRequestException("ID 无效");
    const current = await this.findOneCompat(id);
    if (!current) throw new NotFoundException("运费模板不存在");

    const fields: string[] = [];
    const params: any[] = [];
    const name = data?.name || data?.shipping_tpl_name || data?.Name;
    if (name !== undefined) {
      fields.push("shipping_tpl_name = ?");
      params.push(String(name).trim());
    }
    if (data?.shipping_time !== undefined) {
      fields.push("shipping_time = ?");
      params.push(String(data.shipping_time).trim());
    }
    if (data?.is_free !== undefined || data?.isFree !== undefined) {
      fields.push("is_free = ?");
      params.push(Number(data?.is_free ?? data?.isFree ?? 0) === 1 ? 1 : 0);
    }
    if (
      data?.pricing_type !== undefined ||
      data?.pricingType !== undefined
    ) {
      fields.push("pricing_type = ?");
      params.push(Number(data?.pricing_type ?? data?.pricingType ?? 1) || 1);
    }
    if (
      data?.is_default !== undefined ||
      data?.isDefault !== undefined ||
      data?.IsDefault !== undefined
    ) {
      fields.push("is_default = ?");
      params.push(
        Number(
          data?.is_default ?? data?.isDefault ?? data?.IsDefault ?? 0,
        ) === 1
          ? 1
          : 0,
      );
    }
    if (data?.shop_id !== undefined || data?.shopId !== undefined) {
      fields.push("shop_id = ?");
      params.push(Number(data?.shop_id ?? data?.shopId ?? 0) || 0);
    }
    if (!fields.length) return this.findOneCompat(id);
    const updateSql = `UPDATE \`shipping_tpl\` SET ${fields.join(", ")} WHERE shipping_tpl_id = ? LIMIT 1`;
    params.push(id);
    await this.prisma.$executeRawUnsafe(updateSql, ...params);
    return this.findOneCompat(id);
  }

  async deleteCompat(id: number) {
    if (!id) return;
    const delSql = `DELETE FROM \`shipping_tpl\` WHERE shipping_tpl_id = ? LIMIT 1`;
    await this.prisma.$executeRawUnsafe(delSql, id);
  }

  async batchDeleteCompat(ids: number[]) {
    if (!ids?.length) return;
    const placeholders = ids.map(() => "?").join(",");
    const sql = `DELETE FROM \`shipping_tpl\` WHERE shipping_tpl_id IN (${placeholders})`;
    await this.prisma.$executeRawUnsafe(sql, ...ids);
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
