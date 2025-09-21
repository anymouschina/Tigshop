// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateUserCompanyDto,
  UpdateUserCompanyDto,
  AuditUserCompanyDto,
} from "./dto/user-company.dto";

@Injectable()
export class UserCompanyService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(
    filter: any,
    includes: string[] = [],
    appends: string[] = [],
  ) {
    const { page, size, sort_field, sort_order, ...where } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const include = {};
    if (includes.includes("user")) {
      include["user"] = true;
    }

    const records = await this.prisma.userCompany.findMany({
      where,
      include,
      skip,
      take: size,
      orderBy,
    });

    // 添加附加字段
    const recordsWithAppends = records.map((record) => {
      const result = { ...record };

      if (appends.includes("status_text")) {
        result["status_text"] = this.getStatusText(record.status);
      }
      if (appends.includes("type_text")) {
        result["type_text"] = this.getTypeText(record.type);
      }

      return result;
    });

    return recordsWithAppends;
  }

  async getFilterCount(filter: any): Promise<number> {
    const { page, size, sort_field, sort_order, ...where } = filter;
    return this.prisma.userCompany.count({ where });
  }

  async getDetail(id: number) {
    const item = await this.prisma.userCompany.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!item) {
      throw new Error("企业认证不存在");
    }

    return {
      ...item,
      status_text: this.getStatusText(item.status),
      type_text: this.getTypeText(item.type),
    };
  }

  async audit(id: number, auditData: AuditUserCompanyDto) {
    return this.prisma.userCompany.update({
      where: { id },
      data: {
        status: auditData.status,
        audit_remark: auditData.audit_remark,
        audit_time: new Date(),
      },
    });
  }

  async del(id: number) {
    return this.prisma.userCompany.delete({
      where: { id },
    });
  }

  async create(createDto: CreateUserCompanyDto) {
    return this.prisma.userCompany.create({
      data: {
        user_id: createDto.user_id,
        company_name: createDto.company_name,
        company_type: createDto.company_type,
        business_license: createDto.business_license,
        legal_person: createDto.legal_person,
        contact_person: createDto.contact_person,
        contact_phone: createDto.contact_phone,
        contact_email: createDto.contact_email,
        business_address: createDto.business_address,
        business_scope: createDto.business_scope,
        status: 0, // 待审核
        create_time: new Date(),
      },
    });
  }

  async update(id: number, updateDto: UpdateUserCompanyDto) {
    return this.prisma.userCompany.update({
      where: { id },
      data: {
        ...updateDto,
        update_time: new Date(),
      },
    });
  }

  private getStatusText(status: number): string {
    const statusMap = {
      0: "待审核",
      1: "已通过",
      2: "已拒绝",
    };
    return statusMap[status] || "未知";
  }

  private getTypeText(type: number): string {
    const typeMap = {
      0: "企业",
      1: "个体工商户",
      2: "其他",
    };
    return typeMap[type] || "未知";
  }
}
