// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ProductGroupCompatService {
  constructor(private prisma: PrismaService) {}

  // 列表与计数
  async getFilterResult(filter: any) {
    const where: any = {};
    if (filter.keyword) {
      where.OR = [
        { product_group_name: { contains: filter.keyword } },
        { product_group_sn: { contains: filter.keyword } },
      ];
    }
    const orderBy: any = {};
    if (filter.sortField && filter.sortOrder) {
      // 仅允许特定字段排序
      const map: any = {
        productGroupName: "product_group_name",
        productGroupSn: "product_group_sn",
        addTime: "add_time",
      };
      const field = map[filter.sortField] || "product_group_id";
      orderBy[field] = filter.sortOrder;
    } else {
      orderBy.product_group_id = "desc";
    }
    const page = Number(filter.page) || 1;
    const size = Number(filter.size) || 15;
    const skip = (page - 1) * size;
    const rows = await this.prisma.product_group.findMany({ where, orderBy, skip, take: size });
    return rows.map((r) => this.mapRow(r));
  }

  async getFilterCount(filter: any) {
    const where: any = {};
    if (filter.keyword) {
      where.OR = [
        { product_group_name: { contains: filter.keyword } },
        { product_group_sn: { contains: filter.keyword } },
      ];
    }
    return this.prisma.product_group.count({ where });
  }

  async getDetail(id: number) {
    const r = await this.prisma.product_group.findUnique({ where: { product_group_id: id } });
    if (!r) throw new NotFoundException("分组不存在");
    return this.mapRow(r, true);
  }

  async create(body: any) {
    const data = this.mapBodyToCreate(body);
    const created = await this.prisma.product_group.create({ data });
    return { productGroupId: created.product_group_id };
  }

  async update(id: number, body: any) {
    const exists = await this.prisma.product_group.findUnique({ where: { product_group_id: id } });
    if (!exists) throw new NotFoundException("分组不存在");
    const data = this.mapBodyToUpdate(body);
    await this.prisma.product_group.update({ where: { product_group_id: id }, data });
    return true;
  }

  async delete(id: number) {
    await this.prisma.product_group.delete({ where: { product_group_id: id } });
    return true;
  }

  async batchDelete(ids: number[]) {
    await this.prisma.product_group.deleteMany({ where: { product_group_id: { in: ids } } });
    return true;
  }

  // 映射: DB -> 前端驼峰
  private mapRow(r: any, includeProducts = false) {
    const productIdsArr = (r.product_ids || "")
      .split(",")
      .map((x: string) => Number(x))
      .filter((x: number) => x > 0);
    return {
      productGroupId: r.product_group_id,
      productGroupName: r.product_group_name || "",
      productGroupSn: r.product_group_sn || "",
      productGroupDescription: r.product_group_description || "",
      productIds: productIdsArr,
      addTime: r.add_time || 0,
    };
  }

  // 映射: 前端驼峰 body -> DB 字段（创建）
  private mapBodyToCreate(b: any) {
    if (!b.productGroupName || String(b.productGroupName).trim() === "") {
      throw new BadRequestException("分组名称不能为空");
    }
    const productIds = Array.isArray(b.productIds) ? b.productIds.map((x) => Number(x)).filter((x) => x > 0) : [];
    const now = Math.floor(Date.now() / 1000);
    return {
      product_group_name: String(b.productGroupName),
      product_group_sn: String(b.productGroupSn || ""),
      product_group_description: String(b.productGroupDescription || ""),
      product_ids: productIds.length ? productIds.join(",") : null,
      add_time: now,
      shop_id: 0,
    };
  }

  // 映射: 前端驼峰 body -> DB 字段（更新）
  private mapBodyToUpdate(b: any) {
    const data: any = {};
    if (b.productGroupName !== undefined) data.product_group_name = String(b.productGroupName);
    if (b.productGroupSn !== undefined) data.product_group_sn = String(b.productGroupSn || "");
    if (b.productGroupDescription !== undefined) data.product_group_description = String(b.productGroupDescription || "");
    if (b.productIds !== undefined) {
      const productIds = Array.isArray(b.productIds) ? b.productIds.map((x) => Number(x)).filter((x) => x > 0) : [];
      data.product_ids = productIds.length ? productIds.join(",") : null;
    }
    return data;
  }
}
