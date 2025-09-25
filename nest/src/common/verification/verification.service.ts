// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  // 验证码管理功能暂时不可用，PHP项目使用简单的配置验证码服务
  // 不需要数据库表，直接调用CaptchaService即可

  async getFilterList(filter: any) {
    // PHP项目没有验证码列表管理功能
    return [];
  }

  async getFilterCount(filter: any) {
    return 0;
  }

  async getDetail(id: number) {
    return null;
  }

  async createVerification(createData: any) {
    // 不需要创建，直接使用CaptchaService
    return true;
  }

  async updateVerification(id: number, updateData: any) {
    return true;
  }

  async deleteVerification(id: number) {
    return true;
  }

  async batchDeleteVerification(ids: number[]) {
    return true;
  }

  async getVerificationStatistics() {
    return {
      total: 0,
      today: 0,
      success: 0,
      fail: 0,
    };
  }
}
