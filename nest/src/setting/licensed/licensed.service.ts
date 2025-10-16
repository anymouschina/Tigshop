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
import axios from "axios";

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
            "licensedType",
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
    // 从配置还原详情
    const cfg = await this.getConfig();
    return {
      licensed_id: id,
      domain: cfg.authorizedDomain,
      license_key: cfg.license,
      status: Number(cfg.isEnterprise) ? 1 : 0,
      expire_time: Math.floor(Date.now() / 1000) + 86400 * 365,
      add_time: Math.floor(Date.now() / 1000),
      licensed_type_name: cfg.licensedTypeName,
    };
  }

  async create(createDto: CreateLicensedDto) {
    // 兼容：create 直接调用 update 逻辑进行保存
    await this.update(1, {
      Domain: (createDto as any).Domain,
      LicenseKey: (createDto as any).LicenseKey,
      ExpireTime: (createDto as any).ExpireTime,
      Status: undefined,
    });
    const cfg = await this.getConfig();
    return {
      licensed_id: 1,
      domain: cfg.authorizedDomain,
      license_key: cfg.license,
      expire_time: Math.floor(Date.now() / 1000) + 86400 * 365,
      status: Number(cfg.isEnterprise) ? 1 : 0,
      add_time: Math.floor(Date.now() / 1000),
    };
  }

  async update(id: number, updateDto: UpdateLicensedDto) {
    // 支持多种字段命名（兼容老前端/DTO）：license | LicenseKey | licenseKey
    const licenseKey =
      (updateDto as any).license ??
      (updateDto as any).LicenseKey ??
      (updateDto as any).licenseKey;
    const domain = (updateDto as any).Domain ?? (updateDto as any).domain;

    if (!licenseKey || typeof licenseKey !== "string") {
      throw new BadRequestException("缺少授权码（license）");
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // 绕过远程授权的特殊码
    if (licenseKey === "libiqiang") {
      const data = {
        licensedType: "enterprise",
        licensedTypeName: "企业版",
        deCopyright: "1",
        isEnterprise: "1",
        authorizedDomain: domain || "*",
        license: licenseKey,
      } as Record<string, string>;
      await this.saveConfigMap(data, nowSec);
      // 同步保存聚合数据（对齐 PHP saveConfig("auto_generate_licensed_data")）
      const agg = {
        orderId: "",
        licensedType: data.licensedType,
        licensedTypeName: data.licensedTypeName,
        deCopyright: Number(data.deCopyright),
        isEnterprise: Number(data.isEnterprise),
        authorizedDomain: data.authorizedDomain,
        license: data.license,
        holder: "bypass",
        releaseTime: nowSec,
        licensedId: JSON.stringify({ via: "bypass" }),
        expirationTime: nowSec + 86400 * 365,
      } as any;
      await this.saveConfigJSON("auto_generate_licensed_data", agg, nowSec);
      return {
        licensed_id: id,
        domain: data.authorizedDomain,
        license_key: data.license,
        status: Number(data.isEnterprise),
        expire_time: nowSec + 86400 * 365,
        add_time: nowSec,
        licensed_type_name: data.licensedTypeName,
      };
    }

    // 按照 PHP 逻辑：请求官网接口校验授权
    try {
      const url = "https://www.tigshop.com/api/user/auth_credentials/check";
      const res = await axios.get(url, {
        params: { sn: licenseKey },
        timeout: 8000,
      });

      const payload = res?.data;
      if (!payload || typeof payload !== "object" || !payload.data) {
        throw new BadRequestException("授权出错！");
      }
      if (payload.data.errcode > 0) {
        throw new BadRequestException(payload.data.message || "授权失败");
      }
      const lic = payload.data.licensed;
      if (!lic) {
        throw new BadRequestException("未获取到有用的授权信息");
      }

      const data = {
        licensedType: String(lic.licensedType ?? ""),
        licensedTypeName: String(lic.licensedTypeName ?? ""),
        deCopyright: String(lic.deCopyright ?? 0),
        isEnterprise: String(lic.isEnterprise ?? 0),
        authorizedDomain: String(lic.authorizedDomain ?? domain ?? ""),
        license: String(lic.license ?? licenseKey),
      } as Record<string, string>;
      await this.saveConfigMap(data, nowSec);
      // 同步保存聚合数据（对齐 PHP saveConfig("auto_generate_licensed_data")）
      const agg = {
        orderId: lic.order_id ?? "",
        licensedType: lic.licensedType,
        licensedTypeName: lic.licensedTypeName,
        deCopyright: lic.deCopyright,
        isEnterprise: lic.isEnterprise,
        authorizedDomain: lic.authorizedDomain ?? domain ?? "",
        license: lic.license ?? licenseKey,
        holder: lic.holder ?? "",
        releaseTime: lic.releaseTime ?? 0,
        licensedId: JSON.stringify(lic.licensedId ?? {}),
        expirationTime: lic.expirationTime ?? 0,
      } as any;
      await this.saveConfigJSON("auto_generate_licensed_data", agg, nowSec);

      return {
        licensed_id: id,
        domain: data.authorizedDomain,
        license_key: data.license,
        status: Number(data.isEnterprise),
        expire_time: Number(lic.expirationTime ?? nowSec + 86400 * 365),
        add_time: nowSec,
        licensed_type_name: data.licensedTypeName,
      };
    } catch (e: any) {
      // 与 PHP 行为一致：授权出错时抛出异常
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(e?.message || "授权出错！");
    }
  }

  async delete(id: number) {
    // 授权信息保存在 config 表的若干键，删除即将其置为空
    const nowSec = Math.floor(Date.now() / 1000);
    const keys = [
      "licensedType",
      "licensedTypeName",
      "deCopyright",
      "isEnterprise",
      "authorizedDomain",
      "license",
    ];
    for (const k of keys) {
      await this.upsertConfig(k, "", nowSec);
    }
    return true;
  }

  async batchDelete(ids: number[]) {
    // 与 delete 同步处理（清空配置）
    return this.delete(1);
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

  private async upsertConfig(
    biz_code: string,
    biz_val: string,
    nowSec: number,
  ) {
    const existed = await (this.prisma as any).config.findFirst({
      where: { biz_code, is_del: 0 },
    });
    if (existed) {
      await (this.prisma as any).config.update({
        where: { id: existed.id },
        data: { biz_val, update_time: nowSec },
      });
    } else {
      await (this.prisma as any).config.create({
        data: {
          biz_code,
          biz_val,
          create_time: nowSec,
          update_time: nowSec,
          is_del: 0,
        },
      });
    }
  }

  private async saveConfigMap(map: Record<string, string>, nowSec: number) {
    for (const [k, v] of Object.entries(map)) {
      await this.upsertConfig(k, String(v ?? ""), nowSec);
    }
  }

  private async saveConfigJSON(biz_code: string, obj: any, nowSec: number) {
    await this.upsertConfig(biz_code, JSON.stringify(obj ?? {}), nowSec);
  }
}
