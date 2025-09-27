// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TipsManageService {
  private readonly logger = new Logger(TipsManageService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * 获取系统状态提示 - 还原PHP原始功能
   * 返回系统各种状态检查结果，格式为 [{code: "xxx", status: true/false}]
   */
  async getSystemStatusTips() {
    try {
      const tips = [];

      // 1. 检查域名绑定状态
      const domainBindStatus = await this.checkDomainBinding();
      tips.push(domainBindStatus);

      // 2. 检查密码安全强度
      const passwordStatus = await this.checkPasswordSecurity();
      tips.push(passwordStatus);

      return tips;
    } catch (error) {
      this.logger.error('获取系统状态提示失败:', error);
      return [];
    }
  }

  /**
   * 检查密码安全强度
   */
  private async checkPasswordSecurity() {
    try {
      // 检查是否有管理员使用默认密码
      const adminsWithDefaultPassword = await this.prisma.admin_user.count({
        where: {
          password: '21232f297a57a5a743894a0e4a801fc3' // admin的md5
        }
      });

      return {
        code: 'passwordTooSimple',
        status: adminsWithDefaultPassword > 0 // 有默认密码则为true，表示需要提醒
      };
    } catch (error) {
      this.logger.error('检查密码安全失败:', error);
      return {
        code: 'passwordTooSimple',
        status: false
      };
    }
  }

  /**
   * 检查域名绑定状态
   */
  private async checkDomainBinding() {
    try {
      // 检查是否有配置域名绑定
      const domainConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: 'domain_binding'
        }
      });

      return {
        code: 'domainBind',
        status: !!(domainConfig && domainConfig.value) // 已配置域名绑定则为true
      };
    } catch (error) {
      this.logger.error('检查域名绑定失败:', error);
      return {
        code: 'domainBind',
        status: false
      };
    }
  }
}
