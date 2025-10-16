// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ShopProductCategoryService {
  constructor(public prisma: PrismaService) {}

  private buildWhere(filter: any) {
    const where: any = {};
    if (filter.keyword) {
      where.category_name = { contains: filter.keyword };
    }
    if (filter.parent_id !== undefined) {
      where.parent_id = filter.parent_id;
    }
    if (filter.is_show !== undefined && filter.is_show !== -1) {
      where.is_show = Number(filter.is_show);
    }
    if (filter.shop_id !== undefined && filter.shop_id !== null) {
      // 允许 0 作为有效店铺（公共或主平台店铺）
      where.shop_id = Number(filter.shop_id);
    }
    return where;
  }

  async list(filter: any) {
    const where = this.buildWhere(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;
    const [records, total] = await Promise.all([
      this.prisma.shop_product_category.findMany({
        where,
        skip,
        take,
        orderBy: [{ sort_order: "asc" }, { category_id: "asc" }],
      }),
      this.prisma.shop_product_category.count({ where }),
    ]);
    return { records, total };
  }

  async getAll(shopId?: number) {
    const where: any = {};
    if (shopId !== undefined && shopId !== null) where.shop_id = Number(shopId);
    const rows = await this.prisma.shop_product_category.findMany({
      where,
      orderBy: [{ parent_id: "asc" }, { sort_order: "asc" }, { category_id: "asc" }],
    });
    // build tree
    const map = new Map<number, any>();
    rows.forEach((r) => map.set(r.category_id, { ...r, children: [] }));
    const tree: any[] = [];
    rows.forEach((r) => {
      const node = map.get(r.category_id);
      if (r.parent_id === 0) tree.push(node);
      else {
        const p = map.get(r.parent_id);
        if (p) p.children.push(node);
      }
    });
    return tree;
  }

  async create(data: any) {
    const result = await this.prisma.shop_product_category.create({
      data: {
        category_name: data.category_name,
        shop_id: data.shop_id || 0,
        parent_id: data.parent_id || 0,
        sort_order: data.sort_order ?? 50,
        is_show: data.is_show ?? 1,
        add_time: Math.floor(Date.now() / 1000),
      },
    });
    return result;
  }

  async updateField(id: number, field: string, val: any) {
    const allowed = ["category_name", "sort_order", "is_show", "parent_id"];
    if (!allowed.includes(field)) throw new Error("不支持的字段");
    await this.prisma.shop_product_category.update({
      where: { category_id: id },
      data: { [field]: val },
    });
    return true;
  }

  async delete(id: number) {
    // 如果有子类，阻止删除
    const child = await this.prisma.shop_product_category.count({ where: { parent_id: id } });
    if (child > 0) throw new Error("该分类下有子分类，无法删除");
    // 商品关联转移到 0
    await this.prisma.product.updateMany({ where: { shop_category_id: id }, data: { shop_category_id: 0 } });
    await this.prisma.shop_product_category.delete({ where: { category_id: id } });
    return true;
  }

  async moveCat(id: number, targetId: number) {
    // 将商品从 id 转移到 targetId
    await this.prisma.product.updateMany({ where: { shop_category_id: id }, data: { shop_category_id: targetId } });
    return true;
  }

  async findById(id: number) {
    if (!id) return null;
    return this.prisma.shop_product_category.findUnique({ where: { category_id: id } });
  }

  async countChildren(id: number) {
    return this.prisma.shop_product_category.count({ where: { parent_id: id } });
  }

  async listByShopAndParent(shopId: number, parentId: number) {
    return this.prisma.shop_product_category.findMany({
      where: { shop_id: Number(shopId), parent_id: Number(parentId) },
      orderBy: [{ sort_order: 'asc' }, { category_id: 'asc' }],
    });
  }
}
