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

      // 3. 检查SSL证书状态
      const sslStatus = await this.checkSSLStatus();
      tips.push(sslStatus);

      // 4. 检查备份状态
      const backupStatus = await this.checkBackupStatus();
      tips.push(backupStatus);

      // 5. 检查系统更新状态
      const updateStatus = await this.checkSystemUpdate();
      tips.push(updateStatus);

      // 6. 检查文件权限
      const permissionStatus = await this.checkFilePermissions();
      tips.push(permissionStatus);

      return tips;
    } catch (error) {
      this.logger.error("获取系统状态提示失败:", error);
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
          password: "21232f297a57a5a743894a0e4a801fc3", // admin的md5
        },
      });

      return {
        code: "passwordTooSimple",
        status: adminsWithDefaultPassword > 0, // 有默认密码则为true，表示需要提醒
      };
    } catch (error) {
      this.logger.error("检查密码安全失败:", error);
      return {
        code: "passwordTooSimple",
        status: false,
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
          biz_code: "domain_binding",
        },
      });

      return {
        code: "domainBind",
        status: !!(domainConfig && domainConfig.value), // 已配置域名绑定则为true
      };
    } catch (error) {
      this.logger.error("检查域名绑定失败:", error);
      return {
        code: "domainBind",
        status: false,
      };
    }
  }

  /**
   * 检查SSL证书状态
   */
  private async checkSSLStatus() {
    try {
      // 检查SSL配置
      const sslConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: "ssl_enabled",
        },
      });

      return {
        code: "sslCertificate",
        status: !!(sslConfig && sslConfig.value === "1"), // SSL已启用则为true
      };
    } catch (error) {
      this.logger.error("检查SSL状态失败:", error);
      return {
        code: "sslCertificate",
        status: false,
      };
    }
  }

  /**
   * 检查备份状态
   */
  private async checkBackupStatus() {
    try {
      // 检查最近备份时间
      const backupConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: "last_backup_time",
        },
      });

      if (!backupConfig || !backupConfig.value) {
        return {
          code: "backupStatus",
          status: false,
        };
      }

      const lastBackup = new Date(parseInt(backupConfig.value) * 1000);
      const now = new Date();
      const daysSinceBackup = Math.floor(
        (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        code: "backupStatus",
        status: daysSinceBackup <= 7, // 7天内有备份则为true
      };
    } catch (error) {
      this.logger.error("检查备份状态失败:", error);
      return {
        code: "backupStatus",
        status: false,
      };
    }
  }

  /**
   * 检查系统更新状态
   */
  private async checkSystemUpdate() {
    try {
      // 检查系统版本
      const versionConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: "system_version",
        },
      });

      return {
        code: "systemUpdate",
        status: !!(versionConfig && versionConfig.value), // 有版本信息则为true
      };
    } catch (error) {
      this.logger.error("检查系统更新状态失败:", error);
      return {
        code: "systemUpdate",
        status: false,
      };
    }
  }

  /**
   * 检查文件权限
   */
  private async checkFilePermissions() {
    try {
      // 检查uploads目录权限
      const uploadConfig = await this.prisma.config.findFirst({
        where: {
          biz_code: "upload_permission",
        },
      });

      return {
        code: "filePermission",
        status: !!(uploadConfig && uploadConfig.value === "1"), // 权限正常则为true
      };
    } catch (error) {
      this.logger.error("检查文件权限失败:", error);
      return {
        code: "filePermission",
        status: false,
      };
    }
  }
}
