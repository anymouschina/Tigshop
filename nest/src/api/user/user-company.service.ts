// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CompanyApplyDto,
  CompanyAuditDto,
  CompanyQueryDto,
} from "./dto/user-company.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserCompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async applyCompany(userId: number, applyDto: CompanyApplyDto) {
    // Check if user already has a pending application
    const existingApplication = await this.prisma.user_company.findFirst({
      where: {
        user_id: userId,
        status: 1, // STATUS_WAIT
      },
    });

    if (existingApplication) {
      throw new BadRequestException("您已有待审核的企业认证申请");
    }

    const { type, company_data } = applyDto;

    // Create company application
    const application = await this.prisma.user_company.create({
      data: {
        user_id: userId,
        type: type,
        company_name: company_data.company_name || "",
        contact_name: company_data.corporate_name || "",
        contact_mobile: company_data.contact_phone || "",
        company_data: company_data as any,
        status: 1, // STATUS_WAIT
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // TODO: Send SMS notification if enabled
    const smsEnabled = this.configService.get<string>("smsNote", "0");
    if (smsEnabled === "1") {
      // SMS service would be called here
    }

    return {
      id: application.id,
      status: application.status,
    };
  }

  async getCompanyDetail(id: number, userId: number) {
    const company = await this.prisma.user_company.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            mobile: true,
            is_company_auth: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("企业认证信息不存在");
    }

    // Check if user owns this application
    if (company.user_id !== userId) {
      throw new NotFoundException("企业认证信息不存在");
    }

    // Process address data
    const companyData = company.company_data as any;
    if (
      companyData.license_addr_province &&
      Array.isArray(companyData.license_addr_province)
    ) {
      const regions = await this.prisma.region.findMany({
        where: {
          region_id: {
            in: companyData.license_addr_province,
          },
        },
      });

      const regionMap = regions.reduce((acc, region) => {
        acc[region.region_id] = region.region_name;
        return acc;
      }, {});

      companyData.license_addr_province_name = companyData.license_addr_province
        .map((regionId: number) => regionMap[regionId] || "")
        .join("");
    }

    return {
      id: company.id,
      user_id: company.user_id,
      type: company.type,
      type_text: this.getTypeText(company.type),
      company_name: company.company_name,
      contact_name: company.contact_name,
      contact_mobile: company.contact_mobile,
      company_data: companyData,
      status: company.status,
      status_text: this.getStatusText(company.status),
      audit_remark: company.audit_remark,
      audit_time: company.audit_time,
      add_time: company.add_time,
      user: company.user,
    };
  }

  async getUserApplication(userId: number) {
    const application = await this.prisma.user_company.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
      select: {
        id: true,
        user_id: true,
        status: true,
        type: true,
      },
    });

    if (!application) {
      return null;
    }

    return {
      id: application.id,
      user_id: application.user_id,
      status: application.status,
      status_text: this.getStatusText(application.status),
      type: application.type,
      type_text: this.getTypeText(application.type),
    };
  }

  async getCompanyList(queryDto: CompanyQueryDto) {
    const { page = 1, size = 10, type, status, username } = queryDto;
    const skip = (page - 1) * size;

    const where: any = {};

    if (type !== undefined) {
      where.type = type;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (username) {
      where.user = {
        username: {
          contains: username,
        },
      };
    }

    const [companies, total] = await Promise.all([
      this.prisma.user_company.findMany({
        where,
        skip,
        take: size,
        orderBy: { id: "desc" },
        include: {
          user: {
            select: {
              username: true,
              is_company_auth: true,
            },
          },
        },
      }),
      this.prisma.user_company.count({ where }),
    ]);

    const processedCompanies = companies.map((company) => ({
      id: company.id,
      user_id: company.user_id,
      type: company.type,
      type_text: this.getTypeText(company.type),
      company_name: company.company_name,
      contact_name: company.contact_name,
      contact_mobile: company.contact_mobile,
      status: company.status,
      status_text: this.getStatusText(company.status),
      audit_remark: company.audit_remark,
      audit_time: company.audit_time,
      add_time: company.add_time,
      user: company.user,
    }));

    return {
      list: processedCompanies,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async auditCompany(id: number, auditDto: CompanyAuditDto) {
    const company = await this.prisma.user_company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException("企业认证信息不存在");
    }

    if (company.status !== 1) {
      // STATUS_WAIT
      throw new BadRequestException("状态参数错误");
    }

    if (auditDto.status === 3 && !auditDto.audit_remark) {
      // STATUS_REFUSE
      throw new BadRequestException("请填写审核备注");
    }

    const updateData: any = {
      status: auditDto.status,
      audit_remark: auditDto.audit_remark || null,
    };

    if (auditDto.status === 2) {
      // STATUS_PASS
      updateData.audit_time = Math.floor(Date.now() / 1000);
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // Update company application
        const updatedCompany = await prisma.user_company.update({
          where: { id },
          data: updateData,
        });

        // If approved, update user company auth status
        if (auditDto.status === 2) {
          await prisma.user.update({
            where: { user_id: company.user_id },
            data: { is_company_auth: 1 },
          });
        }

        return updatedCompany;
      });

      return {
        id: result.id,
        status: result.status,
        status_text: this.getStatusText(result.status),
        audit_time: result.audit_time,
      };
    } catch (error) {
      throw new BadRequestException("操作失败");
    }
  }

  async deleteCompany(id: number) {
    const company = await this.prisma.user_company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException("企业认证信息不存在");
    }

    if (company.status !== 3) {
      // STATUS_REFUSE
      throw new BadRequestException("审核未通过的才可删除");
    }

    await this.prisma.user_company.delete({
      where: { id },
    });

    return { success: true };
  }

  private getTypeText(type: number): string {
    const typeMap = {
      1: "个人",
      2: "企业",
    };
    return typeMap[type] || "";
  }

  private getStatusText(status: number): string {
    const statusMap = {
      1: "待审核",
      2: "审核通过",
      3: "审核未通过",
    };
    return statusMap[status] || "";
  }
}
