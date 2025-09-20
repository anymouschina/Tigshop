// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.config.findMany({
        where,
        orderBy,
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.config.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.config.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          biz_code: {
            contains: filter.keyword,
          },
        },
        {
          biz_val: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 业务代码筛选
    if (filter.biz_code) {
      where.biz_code = {
        contains: filter.biz_code,
      };
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
      id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.config.findUnique({
      where: { id },
    });

    if (!result) {
      throw new Error("配置项不存在");
    }

    return result;
  }

  async create(data: any): Promise<any> {
    // 验证业务代码不能为空
    if (!data.biz_code || data.biz_code.trim() === "") {
      throw new Error("配置代码不能为空");
    }

    // 验证配置值不能为空
    if (data.biz_val === undefined || data.biz_val === null) {
      throw new Error("配置值不能为空");
    }

    // 检查业务代码是否已存在
    const existingConfig = await this.prisma.config.findFirst({
      where: {
        biz_code: data.biz_code,
      },
    });

    if (existingConfig) {
      throw new Error("配置代码已存在");
    }

    const result = await this.prisma.config.create({
      data: {
        biz_code: data.biz_code,
        biz_val: String(data.biz_val),
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const config = await this.prisma.config.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("配置项不存在");
    }

    // 验证业务代码不能为空
    if (
      data.biz_code !== undefined &&
      (!data.biz_code || data.biz_code.trim() === "")
    ) {
      throw new Error("配置代码不能为空");
    }

    // 验证配置值不能为空
    if (
      data.biz_val !== undefined &&
      (data.biz_val === undefined || data.biz_val === null)
    ) {
      throw new Error("配置值不能为空");
    }

    // 检查业务代码是否已存在（排除当前配置）
    if (data.biz_code && data.biz_code !== config.biz_code) {
      const existingConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: data.biz_code,
          id: { not: id },
        },
      });

      if (existingConfig) {
        throw new Error("配置代码已存在");
      }
    }

    const updateData: any = {
      update_time: new Date(),
    };
    if (data.biz_code !== undefined) updateData.biz_code = data.biz_code;
    if (data.biz_val !== undefined) updateData.biz_val = String(data.biz_val);

    const result = await this.prisma.config.update({
      where: { id },
      data: updateData,
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const config = await this.prisma.config.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("配置项不存在");
    }

    // 验证字段
    const allowedFields = ["biz_code", "biz_val"];
    if (!allowedFields.includes(field)) {
      throw new Error("不支持的字段");
    }

    // 如果更新业务代码，检查是否已存在
    if (field === "biz_code" && value !== config.biz_code) {
      const existingConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: value,
          id: { not: id },
        },
      });

      if (existingConfig) {
        throw new Error("配置代码已存在");
      }
    }

    const result = await this.prisma.config.update({
      where: { id },
      data: {
        [field]: field === "biz_val" ? String(value) : value,
        update_time: new Date(),
      },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const config = await this.prisma.config.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("配置项不存在");
    }

    const result = await this.prisma.config.delete({
      where: { id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.config.deleteMany({
      where: { id: { in: ids } },
    });

    return true;
  }

  async batchUpdate(data: any): Promise<boolean> {
    const updatePromises = data.configs.map(async (config: any) => {
      const existingConfig = await this.prisma.config.findUnique({
        where: { id: config.id },
      });

      if (!existingConfig) {
        throw new Error(`配置项ID ${config.id} 不存在`);
      }

      return this.prisma.config.update({
        where: { id: config.id },
        data: {
          biz_val: String(config.biz_val),
          update_time: new Date(),
        },
      });
    });

    await Promise.all(updatePromises);
    return true;
  }

  // 根据业务代码获取配置值
  async getConfigByCode(bizCode: string): Promise<any> {
    const result = await this.prisma.config.findFirst({
      where: {
        biz_code: bizCode,
      },
    });

    return result?.biz_val;
  }

  // 批量获取配置值
  async getConfigsByCodes(bizCodes: string[]): Promise<Record<string, any>> {
    const results = await this.prisma.config.findMany({
      where: {
        biz_code: { in: bizCodes },
      },
    });

    const configMap: Record<string, any> = {};
    results.forEach((config) => {
      configMap[config.biz_code] = config.biz_val;
    });

    return configMap;
  }

  // 获取所有配置
  async getAllConfigs(): Promise<Record<string, any>> {
    const results = await this.prisma.config.findMany({
      orderBy: {
        id: "desc",
      },
    });

    const configMap: Record<string, any> = {};
    results.forEach((config) => {
      configMap[config.biz_code] = config.biz_val;
    });

    return configMap;
  }

  // 获取配置分组
  async getConfigsByGroup(): Promise<Record<string, any[]>> {
    const results = await this.prisma.config.findMany({
      orderBy: {
        id: "desc",
      },
    });

    const groupedConfigs: Record<string, any[]> = {};

    results.forEach((config) => {
      // 根据业务代码前缀进行分组
      const prefix = config.biz_code.split("_")[0];
      if (!groupedConfigs[prefix]) {
        groupedConfigs[prefix] = [];
      }
      groupedConfigs[prefix].push(config);
    });

    return groupedConfigs;
  }

  // 解析JSON配置值
  async getJsonConfig(bizCode: string): Promise<any> {
    const configValue = await this.getConfigByCode(bizCode);
    if (!configValue) {
      return null;
    }

    try {
      return JSON.parse(configValue);
    } catch (error) {
      throw new Error(`配置项 ${bizCode} 的值不是有效的JSON格式`);
    }
  }

  // 设置JSON配置值
  async setJsonConfig(bizCode: string, value: any): Promise<void> {
    const jsonString = JSON.stringify(value);

    const existingConfig = await this.prisma.config.findFirst({
      where: { biz_code },
    });

    if (existingConfig) {
      await this.prisma.config.update({
        where: { id: existingConfig.id },
        data: {
          biz_val: jsonString,
          update_time: new Date(),
        },
      });
    } else {
      await this.prisma.config.create({
        data: {
          biz_code,
          biz_val: jsonString,
          create_time: new Date(),
          update_time: new Date(),
        },
      });
    }
  }

  // 获取数值配置值
  async getNumberConfig(
    bizCode: string,
    defaultValue?: number,
  ): Promise<number> {
    const configValue = await this.getConfigByCode(bizCode);
    if (!configValue) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`配置项 ${bizCode} 不存在`);
    }

    const numValue = Number(configValue);
    if (isNaN(numValue)) {
      throw new Error(`配置项 ${bizCode} 的值不是有效的数字`);
    }

    return numValue;
  }

  // 获取布尔配置值
  async getBooleanConfig(
    bizCode: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    const configValue = await this.getConfigByCode(bizCode);
    if (!configValue) {
      return defaultValue;
    }

    return (
      configValue === "true" || configValue === "1" || configValue === "yes"
    );
  }
}
