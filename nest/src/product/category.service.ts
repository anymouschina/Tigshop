// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export const CATEGORY_SHOW_STATUS = {
  0: "隐藏",
  1: "显示",
};

export const CATEGORY_HOT_STATUS = {
  0: "普通",
  1: "热门",
};

export interface CategoryTree {
  category_id: number;
  category_name: string;
  parent_id: number;
  sort_order: number;
  is_show: number;
  is_hot: number;
  children?: CategoryTree[];
}

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.category.findMany({
        where,
        orderBy,
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.category.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.category.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          category_name: {
            contains: filter.keyword,
          },
        },
        {
          short_name: {
            contains: filter.keyword,
          },
        },
        {
          keywords: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 父分类ID筛选
    if (filter.parent_id !== undefined) {
      where.parent_id = filter.parent_id;
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      return {
        [filter.sort_field]: filter.sort_order,
      };
    }
    return {
      category_id: "asc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.category.findUnique({
      where: { category_id: id },
      include: {
        parent: true,
      },
    });

    if (!result) {
      throw new Error("商品分类不存在");
    }

    return {
      ...result,
      show_name: CATEGORY_SHOW_STATUS[result.is_show],
      hot_name: CATEGORY_HOT_STATUS[result.is_hot],
    };
  }

  async create(data: any): Promise<any> {
    // 验证分类名称不能为空
    if (!data.category_name || data.category_name.trim() === "") {
      throw new Error("分类名称不能为空");
    }

    // 验证分类名称长度
    if (data.category_name.length > 30) {
      throw new Error("分类名称不能超过30个字符");
    }

    // 如果设置了父分类，验证父分类是否存在
    if (data.parent_id && data.parent_id > 0) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { category_id: data.parent_id },
      });

      if (!parentCategory) {
        throw new Error("父分类不存在");
      }
    }

    const result = await this.prisma.category.create({
      data: {
        category_name: data.category_name,
        short_name: data.short_name || "",
        parent_id: data.parent_id || 0,
        category_pic: data.category_pic || "",
        category_ico: data.category_ico || "",
        measure_unit: data.measure_unit || "",
        seo_title: data.seo_title || "",
        search_keywords: data.search_keywords || "",
        keywords: data.keywords || "",
        category_desc: data.category_desc || "",
        is_hot: data.is_hot || 0,
        is_show: data.is_show || 1,
        sort_order: data.sort_order || 50,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const category = await this.prisma.category.findUnique({
      where: { category_id: id },
    });

    if (!category) {
      throw new Error("商品分类不存在");
    }

    // 验证分类名称不能为空
    if (
      data.category_name !== undefined &&
      (!data.category_name || data.category_name.trim() === "")
    ) {
      throw new Error("分类名称不能为空");
    }

    // 验证分类名称长度
    if (data.category_name !== undefined && data.category_name.length > 30) {
      throw new Error("分类名称不能超过30个字符");
    }

    // 如果设置了父分类，验证父分类是否存在
    if (data.parent_id !== undefined && data.parent_id > 0) {
      // 不能将自己设置为父分类
      if (data.parent_id === id) {
        throw new Error("不能将自己设置为父分类");
      }

      // 不能将自己的子分类设置为父分类
      const childrenIds = await this.getChildrenIds(id);
      if (childrenIds.includes(data.parent_id)) {
        throw new Error("不能将子分类设置为父分类");
      }

      const parentCategory = await this.prisma.category.findUnique({
        where: { category_id: data.parent_id },
      });

      if (!parentCategory) {
        throw new Error("父分类不存在");
      }
    }

    const updateData: any = {};
    if (data.category_name !== undefined)
      updateData.category_name = data.category_name;
    if (data.short_name !== undefined) updateData.short_name = data.short_name;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
    if (data.category_pic !== undefined)
      updateData.category_pic = data.category_pic;
    if (data.category_ico !== undefined)
      updateData.category_ico = data.category_ico;
    if (data.measure_unit !== undefined)
      updateData.measure_unit = data.measure_unit;
    if (data.seo_title !== undefined) updateData.seo_title = data.seo_title;
    if (data.search_keywords !== undefined)
      updateData.search_keywords = data.search_keywords;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.category_desc !== undefined)
      updateData.category_desc = data.category_desc;
    if (data.is_hot !== undefined) updateData.is_hot = data.is_hot;
    if (data.is_show !== undefined) updateData.is_show = data.is_show;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const result = await this.prisma.category.update({
      where: { category_id: id },
      data: updateData,
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { category_id: id },
    });

    if (!category) {
      throw new Error("商品分类不存在");
    }

    // 验证字段
    const allowedFields = [
      "category_name",
      "short_name",
      "parent_id",
      "category_pic",
      "category_ico",
      "measure_unit",
      "seo_title",
      "search_keywords",
      "keywords",
      "category_desc",
      "is_hot",
      "is_show",
      "sort_order",
    ];
    if (!allowedFields.includes(field)) {
      throw new Error("不支持的字段");
    }

    // 特殊字段验证
    if (field === "category_name") {
      if (!value || value.trim() === "") {
        throw new Error("分类名称不能为空");
      }
      if (value.length > 30) {
        throw new Error("分类名称不能超过30个字符");
      }
    }

    if (field === "parent_id" && value > 0) {
      // 不能将自己设置为父分类
      if (value === id) {
        throw new Error("不能将自己设置为父分类");
      }

      const parentCategory = await this.prisma.category.findUnique({
        where: { category_id: value },
      });

      if (!parentCategory) {
        throw new Error("父分类不存在");
      }
    }

    const result = await this.prisma.category.update({
      where: { category_id: id },
      data: {
        [field]: value,
      },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { category_id: id },
    });

    if (!category) {
      throw new Error("商品分类不存在");
    }

    // 检查是否有子分类
    const hasChildren = await this.prisma.category.count({
      where: { parent_id: id },
    });

    if (hasChildren > 0) {
      throw new Error("该分类下有子分类，无法删除");
    }

    // 检查该分类下是否有商品
    const hasProducts = await this.prisma.product.count({
      where: { category_id: id },
    });

    if (hasProducts > 0) {
      // 将该分类下的商品转移到未分类(category_id = 0)
      await this.prisma.product.updateMany({
        where: { category_id: id },
        data: { category_id: 0 },
      });
    }

    const result = await this.prisma.category.delete({
      where: { category_id: id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    for (const id of ids) {
      await this.delete(id);
    }

    return true;
  }

  // 获取所有分类（树形结构）
  async getAllCategoryTree(): Promise<CategoryTree[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: [
        { parent_id: "asc" },
        { sort_order: "asc" },
        { category_id: "asc" },
      ],
    });

    return this.buildCategoryTree(categories);
  }

  // 获取指定父分类下的子分类树
  async getCategoryTreeByParent(parentId: number = 0): Promise<CategoryTree[]> {
    const categories = await this.prisma.category.findMany({
      where: { parent_id: parentId },
      orderBy: [{ sort_order: "asc" }, { category_id: "asc" }],
    });

    // 为每个分类获取子分类
    const tree = [];
    for (const category of categories) {
      const children = await this.getCategoryTreeByParent(category.category_id);
      tree.push({
        ...category,
        children,
      });
    }

    return tree;
  }

  // 构建分类树
  private buildCategoryTree(
    categories: any[],
    rootParentId = 0,
  ): CategoryTree[] {
    const tree: CategoryTree[] = [];
    const categoryMap = new Map<number, any>();

    // 构建映射
    categories.forEach((category) => {
      categoryMap.set(category.category_id, { ...category, children: [] });
    });

    // 构建树结构
    categories.forEach((category) => {
      const node = categoryMap.get(category.category_id)!;
      if (category.parent_id === rootParentId) {
        tree.push(node);
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return tree;
  }

  // 获取所有子分类ID
  async getChildrenIds(categoryId: number): Promise<number[]> {
    const childrenIds: number[] = [];

    const getChildrenRecursive = async (parentId: number) => {
      const children = await this.prisma.category.findMany({
        where: { parent_id: parentId },
        select: { category_id: true },
      });

      for (const child of children) {
        childrenIds.push(child.category_id);
        await getChildrenRecursive(child.category_id);
      }
    };

    await getChildrenRecursive(categoryId);
    return childrenIds;
  }

  // 获取父分类名称
  async getParentName(parentId: number): Promise<string> {
    if (parentId === 0) {
      return "顶级分类";
    }

    const parent = await this.prisma.category.findUnique({
      where: { category_id: parentId },
      select: { category_name: true },
    });

    return parent?.category_name || "未知分类";
  }

  // 获取父分类路径
  async getParentPath(categoryId: number): Promise<any[]> {
    const path: any[] = [];
    let currentId = categoryId;

    while (currentId > 0) {
      const category = await this.prisma.category.findUnique({
        where: { category_id: currentId },
        select: { category_id: true, category_name: true, parent_id: true },
      });

      if (!category) {
        break;
      }

      path.unshift(category);
      currentId = category.parent_id;
    }

    return path;
  }

  // 移动商品到其他分类
  async moveCategoryProducts(
    categoryId: number,
    targetCategoryId: number,
  ): Promise<boolean> {
    // 验证源分类存在
    const sourceCategory = await this.prisma.category.findUnique({
      where: { category_id: categoryId },
    });

    if (!sourceCategory) {
      throw new Error("源分类不存在");
    }

    // 验证目标分类存在
    const targetCategory = await this.prisma.category.findUnique({
      where: { category_id: targetCategoryId },
    });

    if (!targetCategory) {
      throw new Error("目标分类不存在");
    }

    // 转移商品
    const result = await this.prisma.product.updateMany({
      where: { category_id: categoryId },
      data: { category_id: targetCategoryId },
    });

    return true;
  }

  // 获取热门分类
  async getHotCategories(): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        is_hot: 1,
        is_show: 1,
      },
      orderBy: [{ sort_order: "asc" }, { category_id: "asc" }],
      take: 10, // 限制返回数量
    });

    return categories;
  }

  // 获取所有显示的分类
  async getAllShowCategories(): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        is_show: 1,
      },
      orderBy: [
        { parent_id: "asc" },
        { sort_order: "asc" },
        { category_id: "asc" },
      ],
    });

    return categories;
  }
}
