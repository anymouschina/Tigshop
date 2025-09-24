// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * 初始化配置设置 - 基于PHP实现
   * 创建所有必要的配置项，确保系统功能全部开启
   */
  async initConfigSettings(): Promise<void> {
    const defaultConfigs = [
      // 主题设置
      { biz_code: 'themeId', biz_val: '1', comment: '主题ID' },
      { biz_code: 'themeStyle', biz_val: 'default', comment: '主题风格' },

      // 商店基本信息
      { biz_code: 'shopName', biz_val: 'Tigshop商城', comment: '商店名称' },
      { biz_code: 'shopTitle', biz_val: 'Tigshop商城 - 您的购物首选', comment: '商店标题' },
      { biz_code: 'shopTitleSuffix', biz_val: '- Tigshop商城', comment: '商店标题后缀' },
      { biz_code: 'shopLogo', biz_val: '/uploads/logo.png', comment: '商店Logo' },
      { biz_code: 'shopKeywords', biz_val: '商城,购物,电商', comment: '商店关键词' },
      { biz_code: 'shopDesc', biz_val: '专业的电商平台，为您提供优质的购物体验', comment: '商店描述' },

      // 货币设置
      { biz_code: 'dollarSign', biz_val: '¥', comment: '货币符号' },
      { biz_code: 'dollarSignCn', biz_val: '元', comment: '中文货币符号' },

      // 网站图标和跳转
      { biz_code: 'icoImg', biz_val: '/uploads/favicon.ico', comment: '网站图标' },
      { biz_code: 'autoRedirect', biz_val: '1', comment: '自动跳转设置' },

      // 微信设置
      { biz_code: 'openWechatOauth', biz_val: '1', comment: '开启微信OAuth登录' },
      { biz_code: 'openWechatRegister', biz_val: '1', comment: '开启微信注册' },
      { biz_code: 'wechatRegisterBindPhone', biz_val: '1', comment: '微信注册绑定手机号' },

      // 第三方登录
      { biz_code: 'googleLoginOn', biz_val: '1', comment: '开启Google登录' },
      { biz_code: 'facebookLoginOn', biz_val: '1', comment: '开启Facebook登录' },
      { biz_code: 'openEmailRegister', biz_val: '1', comment: '开启邮箱注册' },

      // 域名设置
      { biz_code: 'personApplyEnabled', biz_val: '1', comment: '个人申请开启' },
      { biz_code: 'h5Domain', biz_val: '', comment: 'H5域名' },
      { biz_code: 'pcDomain', biz_val: '', comment: 'PC域名' },
      { biz_code: 'adminDomain', biz_val: '', comment: '管理域名' },

      // 客服设置
      { biz_code: 'kefuType', biz_val: '1', comment: '客服类型' },
      { biz_code: 'kefuPhone', biz_val: '400-123-4567', comment: '客服电话' },
      { biz_code: 'kefuTime', biz_val: '周一至周日 9:00-18:00', comment: '客服时间' },

      // 备案信息
      { biz_code: 'shopIcpNo', biz_val: '', comment: 'ICP备案号' },
      { biz_code: 'shopIcpNoUrl', biz_val: 'https://beian.miit.gov.cn', comment: 'ICP备案查询链接' },
      { biz_code: 'shop110No', biz_val: '', comment: '公安备案号' },
      { biz_code: 'shop110Link', biz_val: 'https://beian.mps.gov.cn/#/query/webSearch', comment: '公安备案查询链接' },
      { biz_code: 'shopCompany', biz_val: '江西佰商科技有限公司', comment: '公司名称' },
      { biz_code: 'companyAddress', biz_val: '江西省南昌市', comment: '公司地址' },

      // 企业设置
      { biz_code: 'isEnterprise', biz_val: '1', comment: '是否企业版' },
      { biz_code: 'companyDataType', biz_val: '2', comment: '公司数据类型' },
      { biz_code: 'companyDataTips', biz_val: '请填写真实信息', comment: '公司数据提示' },
      { biz_code: 'isIdentity', biz_val: '1', comment: '是否实名认证' },
      { biz_code: 'isEnquiry', biz_val: '1', comment: '是否开启询价' },

      // 版权信息
      { biz_code: 'deCopyright', biz_val: '1', comment: '默认版权信息' },
      { biz_code: 'poweredByStatus', biz_val: '1', comment: '版权信息状态' },
      { biz_code: 'poweredBy', biz_val: 'Powered by Tigshop', comment: '版权信息' },
      { biz_code: 'poweredByLogo', biz_val: '/uploads/powered-by.png', comment: '版权Logo' },
      { biz_code: 'defaultTechSupport', biz_val: 'Tigshop技术支持', comment: '默认技术支持' },

      // 分类装饰设置
      { biz_code: 'productCategoryDecorateType', biz_val: '1', comment: '商品分类装饰类型' },
      { biz_code: 'defaultHeaderStyle', biz_val: 'modern', comment: '默认头部样式' },
      { biz_code: 'lightShopLogo', biz_val: '/uploads/light-logo.png', comment: '浅色主题Logo' },

      // 发票设置
      { biz_code: 'canInvoice', biz_val: '1', comment: '是否可以开具发票' },
      { biz_code: 'invoiceAdded', biz_val: '1', comment: '发票附加设置' },

      // 默认设置
      { biz_code: 'defaultShopName', biz_val: '默认店铺', comment: '默认店铺名称' },
      { biz_code: 'isOpenMobileAreaCode', biz_val: '1', comment: '是否开启手机区号' },

      // 商品显示设置
      { biz_code: 'showSelledCount', biz_val: '1', comment: '显示已售数量' },
      { biz_code: 'showMarketprice', biz_val: '1', comment: '显示市场价' },

      // 功能开关
      { biz_code: 'useSurplus', biz_val: '1', comment: '使用余额' },
      { biz_code: 'usePoints', biz_val: '1', comment: '使用积分' },
      { biz_code: 'useCoupon', biz_val: '1', comment: '使用优惠券' },
      { biz_code: 'closeOrder', biz_val: '0', comment: '关闭订单' },
      { biz_code: 'shopRegClosed', biz_val: '0', comment: '关闭注册' },

      // 积分设置
      { biz_code: 'integralName', biz_val: '积分', comment: '积分名称' },

      // 用户等级设置
      { biz_code: 'growUpSetting', biz_val: JSON.stringify({
        level1: { name: '普通会员', points: 0, discount: 100 },
        level2: { name: '银卡会员', points: 1000, discount: 95 },
        level3: { name: '金卡会员', points: 5000, discount: 90 },
        level4: { name: '钻石会员', points: 20000, discount: 85 }
      }), comment: '成长等级设置' },

      // 装饰页面配置
      { biz_code: 'decoratePageConfig', biz_val: JSON.stringify({
        pcIndex: { style: 'modern', modules: ['banner', 'category', 'product'] },
        mobileIndex: { style: 'simple', modules: ['search', 'banner', 'product'] }
      }), comment: '装饰页面配置' },

      // 售后服务配置
      { biz_code: 'afteSalesService', biz_val: JSON.stringify({
        phone: '400-123-4567',
        time: '周一至周日 9:00-18:00',
        email: 'service@tigshop.com',
        address: '江西省南昌市'
      }), comment: '售后服务配置' },

      // 版本信息
      { biz_code: 'versionType', biz_val: 'professional', comment: '版本类型' },
      { biz_code: 'version', biz_val: '1.0.0', comment: '系统版本' }
    ];

    for (const config of defaultConfigs) {
      try {
        // 检查配置是否已存在
        const existing = await this.prisma.config.findFirst({
          where: { biz_code: config.biz_code }
        });

        if (!existing) {
          // 创建配置项
          await this.prisma.config.create({
            data: {
              biz_code: config.biz_code,
              biz_val: config.biz_val,
              create_time: new Date(),
              update_time: new Date()
            }
          });
          console.log(`创建配置项: ${config.biz_code} - ${config.comment}`);
        } else {
          // 更新配置项（如果需要）
          await this.prisma.config.update({
            where: { id: existing.id },
            data: {
              biz_val: config.biz_val,
              update_time: new Date()
            }
          });
          console.log(`更新配置项: ${config.biz_code} - ${config.comment}`);
        }
      } catch (error) {
        console.error(`处理配置项 ${config.biz_code} 时出错:`, error);
      }
    }

    console.log('配置设置初始化完成');
  }

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
