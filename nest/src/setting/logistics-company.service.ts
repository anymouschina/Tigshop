// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export const LOGISTICS_SHOW_STATUS = {
  0: "隐藏",
  1: "显示",
};

@Injectable()
export class LogisticsCompanyService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.logistics_company.findMany({
        where,
        orderBy,
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.logistics_company.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.logistics_company.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          logistics_name: {
            contains: filter.keyword,
          },
        },
        {
          logistics_code: {
            contains: filter.keyword,
          },
        },
        {
          logistics_desc: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 物流公司ID筛选
    if (filter.logistics_id && filter.logistics_id > 0) {
      where.logistics_id = filter.logistics_id;
    }

    // 店铺隔离：如果传入 shop_id（>0）则按店铺过滤；否则平台可看到全部
    if (filter.shop_id && Number(filter.shop_id) > 0) {
      where.shop_id = Number(filter.shop_id);
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      // 仅允许白名单字段排序，避免潜在注入/错误字段
      const allowed = new Set([
        "logistics_id",
        "sort_order",
        "is_show",
        "logistics_code",
        "logistics_name",
        "shop_id",
      ]);
      const sortField = allowed.has(filter.sort_field)
        ? filter.sort_field
        : "logistics_id";
      const sortOrder = ["asc", "desc"].includes(String(filter.sort_order))
        ? filter.sort_order
        : "desc";
      return {
        [sortField]: sortOrder,
      };
    }
    return {
      logistics_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.logistics_company.findUnique({
      where: { logistics_id: id },
    });

    if (!result) {
      throw new Error("物流公司不存在");
    }

    return {
      ...result,
      show_name: LOGISTICS_SHOW_STATUS[result.is_show],
    };
  }

  async create(data: any): Promise<any> {
    // 验证物流公司名称不能为空
    if (!data.logistics_name || data.logistics_name.trim() === "") {
      throw new Error("物流公司名称不能为空");
    }

    // 验证物流公司代码不能为空
    if (!data.logistics_code || data.logistics_code.trim() === "") {
      throw new Error("物流公司代码不能为空");
    }

    const result = await this.prisma.logistics_company.create({
      data: {
        logistics_name: data.logistics_name,
        logistics_code: data.logistics_code,
        logistics_desc: data.logistics_desc || "",
        is_show: data.is_show ?? 1,
        sort_order: data.sort_order || 50,
        customer_name: data.customer_name || "",
        customer_pwd: data.customer_pwd || "",
        month_code: data.month_code || "",
        send_site: data.send_site || "",
        send_staff: data.send_staff || "",
        // schema 中为 String?，转为字符串存储
        exp_type:
          data.exp_type !== undefined && data.exp_type !== null
            ? String(data.exp_type)
            : "",
        shop_id: data.shop_id || 1,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const logisticsCompany = await this.prisma.logistics_company.findUnique({
      where: { logistics_id: id },
    });

    if (!logisticsCompany) {
      throw new Error("物流公司不存在");
    }

    // 验证物流公司名称不能为空
    if (
      data.logistics_name !== undefined &&
      (!data.logistics_name || data.logistics_name.trim() === "")
    ) {
      throw new Error("物流公司名称不能为空");
    }

    // 验证物流公司代码不能为空
    if (
      data.logistics_code !== undefined &&
      (!data.logistics_code || data.logistics_code.trim() === "")
    ) {
      throw new Error("物流公司代码不能为空");
    }

    const updateData: any = {};
    if (data.logistics_name !== undefined)
      updateData.logistics_name = data.logistics_name;
    if (data.logistics_code !== undefined)
      updateData.logistics_code = data.logistics_code;
    if (data.logistics_desc !== undefined)
      updateData.logistics_desc = data.logistics_desc;
    if (data.is_show !== undefined) updateData.is_show = data.is_show;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.customer_name !== undefined)
      updateData.customer_name = data.customer_name;
    if (data.customer_pwd !== undefined)
      updateData.customer_pwd = data.customer_pwd;
    if (data.month_code !== undefined) updateData.month_code = data.month_code;
    if (data.send_site !== undefined) updateData.send_site = data.send_site;
    if (data.send_staff !== undefined) updateData.send_staff = data.send_staff;
    if (data.exp_type !== undefined) updateData.exp_type = data.exp_type;
    if (data.shop_id !== undefined) updateData.shop_id = data.shop_id;

    const result = await this.prisma.logistics_company.update({
      where: { logistics_id: id },
      data: updateData,
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const logisticsCompany = await this.prisma.logistics_company.findUnique({
      where: { logistics_id: id },
    });

    if (!logisticsCompany) {
      throw new Error("物流公司不存在");
    }

    // 验证字段
    const allowedFields = [
      "logistics_name",
      "sort_order",
      "is_show",
      "logistics_code",
      "logistics_desc",
    ];
    if (!allowedFields.includes(field)) {
      throw new Error("不支持的字段");
    }

    const result = await this.prisma.logistics_company.update({
      where: { logistics_id: id },
      data: {
        [field]: value,
      },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const logisticsCompany = await this.prisma.logistics_company.findUnique({
      where: { logistics_id: id },
    });

    if (!logisticsCompany) {
      throw new Error("物流公司不存在");
    }

    const result = await this.prisma.logistics_company.delete({
      where: { logistics_id: id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.logistics_company.deleteMany({
      where: { logistics_id: { in: ids } },
    });

    return true;
  }

  // 获取所有可用的物流公司
  async getAllAvailableCompanies(): Promise<any[]> {
    const results = await this.prisma.logistics_company.findMany({
      where: {
        is_show: 1,
      },
      orderBy: {
        sort_order: "asc",
      },
      select: {
        logistics_id: true,
        logistics_name: true,
        logistics_code: true,
      },
    });

    return results;
  }

  // 根据物流代码获取物流公司信息
  async getCompanyByCode(code: string): Promise<any> {
    const result = await this.prisma.logistics_company.findFirst({
      where: {
        logistics_code: code,
        is_show: 1,
      },
    });

    return result;
  }
}
