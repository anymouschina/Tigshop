// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export const BRAND_SHOW_STATUS = {
  0: "隐藏",
  1: "显示",
};

export const BRAND_HOT_STATUS = {
  0: "普通",
  1: "热门",
};

export const BRAND_AUDIT_STATUS = {
  0: "待审核",
  1: "审核通过",
  2: "已拒绝",
};

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.brand.findMany({
        where,
        orderBy,
        include: {
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
            },
          },
        },
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.brand.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
      },
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.brand.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          brand_name: {
            contains: filter.keyword,
          },
        },
        {
          brand_en_name: {
            contains: filter.keyword,
          },
        },
        {
          brand_type: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 首字母筛选
    if (filter.first_word) {
      where.first_word = filter.first_word;
    }

    // 显示状态筛选
    if (filter.is_show !== undefined && filter.is_show !== -1) {
      where.is_show = filter.is_show;
    }

    // 热门状态筛选
    if (filter.brand_is_hot !== undefined && filter.brand_is_hot !== -1) {
      where.brand_is_hot = filter.brand_is_hot;
    }

    // 审核状态筛选
    if (filter.status !== undefined && filter.status !== -1) {
      where.status = filter.status;
    }

    // 店铺筛选
    if (filter.shop_id !== undefined && filter.shop_id > 0) {
      where.shop_id = filter.shop_id;
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
      brand_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.brand.findUnique({
      where: { brand_id: id },
      include: {
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
          },
        },
      },
    });

    if (!result) {
      throw new Error("品牌不存在");
    }

    return {
      ...result,
      show_name: BRAND_SHOW_STATUS[result.is_show],
      hot_name: BRAND_HOT_STATUS[result.brand_is_hot],
      status_name: BRAND_AUDIT_STATUS[result.status],
    };
  }

  async create(data: any): Promise<any> {
    // 验证品牌名称不能为空
    if (!data.brand_name || data.brand_name.trim() === "") {
      throw new Error("品牌名称不能为空");
    }

    // 验证品牌名称长度
    if (data.brand_name.length > 30) {
      throw new Error("品牌名称不能超过30个字符");
    }

    // 检查品牌名称是否重复
    const existingBrand = await this.prisma.brand.findFirst({
      where: {
        brand_name: data.brand_name,
        shop_id: data.shop_id || 0,
      },
    });

    if (existingBrand) {
      throw new Error("品牌名称已存在");
    }

    // 如果没有提供首字母，自动生成
    if (!data.first_word) {
      data.first_word = this.generateFirstWord(data.brand_name);
    }

    // 设置审核状态（管理员直接通过，店铺创建的需要审核）
    const status = data.shop_id === 0 ? 1 : 0;

    const result = await this.prisma.brand.create({
      data: {
        brand_name: data.brand_name,
        first_word: data.first_word,
        brand_type: data.brand_type || "",
        brand_desc: data.brand_desc || "",
        brand_logo: data.brand_logo || "",
        site_url: data.site_url || "",
        brand_is_hot: data.brand_is_hot || 0,
        is_show: data.is_show || 1,
        sort_order: data.sort_order || 50,
        shop_id: data.shop_id || 0,
        brand_en_name: data.brand_en_name || "",
        status,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const brand = await this.prisma.brand.findUnique({
      where: { brand_id: id },
    });

    if (!brand) {
      throw new Error("品牌不存在");
    }

    // 验证品牌名称不能为空
    if (
      data.brand_name !== undefined &&
      (!data.brand_name || data.brand_name.trim() === "")
    ) {
      throw new Error("品牌名称不能为空");
    }

    // 验证品牌名称长度
    if (data.brand_name !== undefined && data.brand_name.length > 30) {
      throw new Error("品牌名称不能超过30个字符");
    }

    // 检查品牌名称是否重复（排除自己）
    if (data.brand_name !== undefined && data.brand_name !== brand.brand_name) {
      const existingBrand = await this.prisma.brand.findFirst({
        where: {
          brand_name: data.brand_name,
          shop_id: brand.shop_id,
          brand_id: { not: id },
        },
      });

      if (existingBrand) {
        throw new Error("品牌名称已存在");
      }
    }

    const updateData: any = {};
    if (data.brand_name !== undefined) updateData.brand_name = data.brand_name;
    if (data.first_word !== undefined) updateData.first_word = data.first_word;
    if (data.brand_type !== undefined) updateData.brand_type = data.brand_type;
    if (data.brand_desc !== undefined) updateData.brand_desc = data.brand_desc;
    if (data.brand_logo !== undefined) updateData.brand_logo = data.brand_logo;
    if (data.site_url !== undefined) updateData.site_url = data.site_url;
    if (data.brand_is_hot !== undefined)
      updateData.brand_is_hot = data.brand_is_hot;
    if (data.is_show !== undefined) updateData.is_show = data.is_show;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.brand_en_name !== undefined)
      updateData.brand_en_name = data.brand_en_name;

    const result = await this.prisma.brand.update({
      where: { brand_id: id },
      data: updateData,
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const brand = await this.prisma.brand.findUnique({
      where: { brand_id: id },
    });

    if (!brand) {
      throw new Error("品牌不存在");
    }

    // 验证字段
    const allowedFields = [
      "brand_name",
      "first_word",
      "brand_is_hot",
      "is_show",
      "sort_order",
      "brand_type",
    ];
    if (!allowedFields.includes(field)) {
      throw new Error("不支持的字段");
    }

    // 特殊字段验证
    if (field === "brand_name") {
      if (!value || value.trim() === "") {
        throw new Error("品牌名称不能为空");
      }
      if (value.length > 30) {
        throw new Error("品牌名称不能超过30个字符");
      }

      // 检查品牌名称是否重复
      const existingBrand = await this.prisma.brand.findFirst({
        where: {
          brand_name: value,
          shop_id: brand.shop_id,
          brand_id: { not: id },
        },
      });

      if (existingBrand) {
        throw new Error("品牌名称已存在");
      }
    }

    if (field === "first_word" && !value) {
      // 如果清空首字母，自动重新生成
      value = this.generateFirstWord(brand.brand_name);
    }

    const result = await this.prisma.brand.update({
      where: { brand_id: id },
      data: {
        [field]: value,
      },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const brand = await this.prisma.brand.findUnique({
      where: { brand_id: id },
    });

    if (!brand) {
      throw new Error("品牌不存在");
    }

    // 检查是否有商品关联
    const hasProducts = await this.prisma.product.count({
      where: { brand_id: id },
    });

    if (hasProducts > 0) {
      throw new Error("有商品关联该品牌，请先更换品牌后再删除");
    }

    const result = await this.prisma.brand.delete({
      where: { brand_id: id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    for (const id of ids) {
      await this.delete(id);
    }

    return true;
  }

  // 搜索品牌
  async searchBrands(word: string = ""): Promise<any> {
    const where: any = {
      is_show: 1,
      status: 1, // 只搜索审核通过的品牌
    };

    if (word) {
      where.OR = [
        {
          brand_name: {
            contains: word,
          },
        },
        {
          brand_en_name: {
            contains: word,
          },
        },
        {
          first_word: {
            contains: word,
          },
        },
      ];
    }

    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { brand_id: "desc" }],
      select: {
        brand_id: true,
        brand_name: true,
        brand_logo: true,
        first_word: true,
      },
    });

    // 获取所有首字母
    const firstWords = await this.prisma.brand.findMany({
      where: {
        is_show: 1,
        status: 1,
        first_word: {
          not: "",
        },
      },
      distinct: ["first_word"],
      orderBy: {
        first_word: "asc",
      },
      select: {
        first_word: true,
      },
    });

    return {
      brand_list: brands,
      firstWord_list: firstWords.map((item) => item.first_word),
    };
  }

  // 获取所有首字母
  async getAllFirstWords(): Promise<string[]> {
    const result = await this.prisma.brand.findMany({
      where: {
        is_show: 1,
        status: 1,
        first_word: {
          not: "",
        },
      },
      distinct: ["first_word"],
      orderBy: {
        first_word: "asc",
      },
      select: {
        first_word: true,
      },
    });

    return result.map((item) => item.first_word);
  }

  // 更新所有品牌的首字母
  async updateAllFirstWords(): Promise<boolean> {
    const brands = await this.prisma.brand.findMany({
      select: {
        brand_id: true,
        brand_name: true,
      },
    });

    for (const brand of brands) {
      const firstWord = this.generateFirstWord(brand.brand_name);
      await this.prisma.brand.update({
        where: { brand_id: brand.brand_id },
        data: { first_word: firstWord },
      });
    }

    return true;
  }

  // 品牌审核
  async auditBrand(
    brandId: number,
    status: number,
    rejectRemark?: string,
  ): Promise<any> {
    const brand = await this.prisma.brand.findUnique({
      where: { brand_id: brandId },
    });

    if (!brand) {
      throw new Error("品牌不存在");
    }

    if (brand.status !== 0) {
      throw new Error("该品牌已经审核过了");
    }

    if (status === 2 && !rejectRemark) {
      throw new Error("请填写拒绝理由");
    }

    const result = await this.prisma.brand.update({
      where: { brand_id: brandId },
      data: {
        status,
        reject_remark: rejectRemark || "",
      },
    });

    return result;
  }

  // 获取待审核品牌列表
  async getAuditList(filter: any): Promise<any> {
    const where: any = {
      status: 0, // 待审核状态
    };

    if (filter.keyword) {
      where.OR = [
        {
          brand_name: {
            contains: filter.keyword,
          },
        },
        {
          brand_en_name: {
            contains: filter.keyword,
          },
        },
      ];
    }

    if (filter.shop_id && filter.shop_id > 0) {
      where.shop_id = filter.shop_id;
    }

    const [records, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: this.buildOrderBy(filter),
        skip: (filter.page - 1) * filter.size,
        take: filter.size,
        include: {
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
            },
          },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      records,
      total,
    };
  }

  // 获取待审核数量
  async getAuditWaitCount(): Promise<number> {
    return this.prisma.brand.count({
      where: {
        status: 0,
      },
    });
  }

  // 获取热门品牌
  async getHotBrands(): Promise<any[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        brand_is_hot: 1,
        is_show: 1,
        status: 1,
      },
      orderBy: [{ sort_order: "asc" }, { brand_id: "desc" }],
      take: 10,
    });

    return brands;
  }

  // 获取所有显示的品牌
  async getAllShowBrands(): Promise<any[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        is_show: 1,
        status: 1,
      },
      orderBy: [{ sort_order: "asc" }, { brand_id: "desc" }],
    });

    return brands;
  }

  // 生成首字母拼音（简化版）
  private generateFirstWord(name: string): string {
    if (!name) return "";

    // 获取第一个字符
    const firstChar = name.charAt(0).toUpperCase();

    // 如果是英文字母，直接返回
    if (/[A-Z]/.test(firstChar)) {
      return firstChar;
    }

    // 简单的中文拼音首字母映射（实际项目中应该使用完整的拼音库）
    const pinyinMap: Record<string, string> = {
      阿: "A",
      艾: "A",
      安: "A",
      八: "B",
      巴: "B",
      白: "B",
      拜: "B",
      班: "B",
      擦: "C",
      才: "C",
      菜: "C",
      参: "C",
      草: "C",
      大: "D",
      达: "D",
      打: "D",
      带: "D",
      代: "D",
      额: "E",
      俄: "E",
      恶: "E",
      恩: "E",
      儿: "E",
      发: "F",
      法: "F",
      帆: "F",
      反: "F",
      方: "F",
      嘎: "G",
      该: "G",
      改: "G",
      盖: "G",
      干: "G",
      哈: "H",
      嗨: "H",
      汗: "H",
      汉: "H",
      航: "H",
      击: "J",
      机: "J",
      鸡: "J",
      积: "J",
      基: "J",
      喀: "K",
      卡: "K",
      开: "K",
      凯: "K",
      看: "K",
      拉: "L",
      啦: "L",
      来: "L",
      兰: "L",
      蓝: "L",
      妈: "M",
      麻: "M",
      马: "M",
      吗: "M",
      买: "M",
      拿: "N",
      哪: "N",
      那: "N",
      纳: "N",
      乃: "N",
      哦: "O",
      欧: "O",
      偶: "O",
      啪: "P",
      怕: "P",
      拍: "P",
      排: "P",
      派: "P",
      七: "Q",
      期: "Q",
      欺: "Q",
      漆: "Q",
      齐: "Q",
      然: "R",
      燃: "R",
      染: "R",
      壤: "R",
      让: "R",
      撒: "S",
      洒: "S",
      萨: "S",
      塞: "S",
      赛: "S",
      他: "T",
      它: "T",
      她: "T",
      塔: "T",
      踏: "T",
      挖: "W",
      哇: "W",
      娃: "W",
      瓦: "W",
      外: "W",
      西: "X",
      希: "X",
      昔: "X",
      析: "X",
      席: "X",
      压: "Y",
      呀: "Y",
      芽: "Y",
      雅: "Y",
      亚: "Y",
      匝: "Z",
      砸: "Z",
      杂: "Z",
      灾: "Z",
      栽: "Z",
    };

    return pinyinMap[firstChar] || "#";
  }
}
