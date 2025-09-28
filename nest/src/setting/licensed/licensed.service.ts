// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateLicensedDto,
  UpdateLicensedDto,
  LicensedQueryDto,
  LicensedStatus,
  LicensedConfigDto,
} from "./dto/licensed.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class LicensedService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    // 从config表中读取授权相关配置
    const configItems = await this.prisma.config.findMany({
      where: {
        biz_code: {
          in: [
            "licensedTypeName",
            "deCopyright",
            "isEnterprise",
            "authorizedDomain",
            "license",
          ],
        },
        is_del: 0,
      },
    });

    // 将配置项转换为对象
    const configObj: any = {};
    configItems.forEach((item) => {
      try {
        configObj[item.biz_code] = JSON.parse(item.biz_val || "{}");
      } catch {
        configObj[item.biz_code] = item.biz_val || "0";
      }
    });

    // 返回PHP格式的配置对象
    return {
      license: configObj.license || "0",
      licensedType: configObj.licensedType || "0",
      licensedTypeName: configObj.licensedTypeName || "0",
      isEnterprise: configObj.isEnterprise || 0,
      deCopyright: configObj.deCopyright || 0,
      authorizedDomain: configObj.authorizedDomain || "0",
    };
  }

  async findAll(queryDto: LicensedQueryDto) {
    // 保持兼容性，返回分页结构
    const config = await this.getConfig();

    const licensedData = {
      licensed_id: 1,
      domain: config.authorizedDomain,
      license_key: config.license,
      status: config.isEnterprise,
      expire_time: Math.floor(Date.now() / 1000) + 86400 * 365,
      add_time: Math.floor(Date.now() / 1000),
      licensed_type_name: config.licensedTypeName,
      de_copyright: config.deCopyright,
      is_enterprise: config.isEnterprise,
    };

    return {
      records: [licensedData],
      total: 1,
      page: 1,
      size: 15,
      totalPages: 1,
    };
  }

  async findById(id: number) {
    // 模拟返回数据
    return {
      licensed_id: id,
      domain: "localhost",
      license_key: "demo-license-key",
      status: 1,
      expire_time: Math.floor(Date.now() / 1000) + 86400 * 365,
      add_time: Math.floor(Date.now() / 1000),
    };
  }

  async create(createDto: CreateLicensedDto) {
    // 实际应该保存到config表中，这里返回模拟数据
    return {
      licensed_id: 1,
      domain: createDto.domain,
      license_key: createDto.licenseKey,
      expire_time: Math.floor(new Date(createDto.expireTime).getTime() / 1000),
      status: createDto.status,
      add_time: Math.floor(Date.now() / 1000),
    };
  }

  async update(id: number, updateDto: UpdateLicensedDto) {
    // 实际应该更新config表，这里返回模拟数据
    const updateData: any = {};
    if (updateDto.domain !== undefined) {
      updateData.domain = updateDto.domain;
    }
    if (updateDto.licenseKey !== undefined) {
      updateData.license_key = updateDto.licenseKey;
    }
    if (updateDto.expireTime !== undefined) {
      updateData.expire_time = Math.floor(
        new Date(updateDto.expireTime).getTime() / 1000,
      );
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return {
      licensed_id: id,
      ...updateData,
      add_time: Math.floor(Date.now() / 1000),
    };
  }

  async delete(id: number) {
    // 实际应该从config表中删除，这里返回成功
    return true;
  }

  async batchDelete(ids: number[]) {
    // 实际应该从config表中批量删除，这里返回成功
    return true;
  }

  async getStatusConfig(): Promise<LicensedConfigDto> {
    return {
      statusConfig: {
        [LicensedStatus.INVALID]: "无效",
        [LicensedStatus.VALID]: "有效",
        [LicensedStatus.EXPIRED]: "已过期",
      },
    };
  }
}
