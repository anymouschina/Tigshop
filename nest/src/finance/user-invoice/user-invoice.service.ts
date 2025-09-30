// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateUserInvoiceDto,
  UpdateUserInvoiceDto,
  UserInvoiceQueryDto,
  UserInvoiceStatus,
  TitleType,
  UserInvoiceConfigDto,
} from "./dto/user-invoice.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UserInvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户发票列表
   * @param queryDto 查询参数
   * @returns 发票列表和总数
   */
  async findAll(queryDto: UserInvoiceQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "invoice_id",
      sortOrder = "desc",
      userId,
    } = queryDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: any = {};

    if (keyword) {
      // 按照实际表结构可搜索的字段：公司名称/税号/开户行
      where.OR = [
        { company_name: { contains: keyword } },
        { company_code: { contains: keyword } },
        { company_bank: { contains: keyword } },
      ];
    }

    // admin 列表默认排除 0（普票），与 PHP 端行为一致
    if (status !== undefined) {
      where.status = status;
    } else {
      where.NOT = { status: 0 };
    }

    if (userId) {
      where.user_id = userId;
    }

    // 构建排序
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    // 查询数据（不使用 include，手动补全 user 信息）
    const [rawRecords, total] = await Promise.all([
      this.prisma.user_invoice.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.user_invoice.count({ where }),
    ]);

    // 批量查询用户信息并补充
    const userIds = Array.from(
      new Set(rawRecords.map((r: any) => r.user_id).filter(Boolean)),
    );
    let userMap: Record<number, any> = {};
    if (userIds.length) {
      const users = await this.prisma.user.findMany({
        where: { user_id: { in: userIds } },
        select: {
          user_id: true,
          username: true,
          email: true,
          mobile: true,
        },
      });
      userMap = users.reduce((acc: any, u: any) => {
        acc[u.user_id] = u;
        return acc;
      }, {} as Record<number, any>);
    }

    const records = rawRecords.map((r: any) => ({
      ...r,
      user: userMap[r.user_id] || null,
    }));

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 根据ID获取用户发票详情
   * @param id 发票ID
   * @returns 发票详情
   */
  async findById(id: number) {
    const invoice = await this.prisma.user_invoice.findUnique({
      where: { invoice_id: id },
    });

    if (!invoice) {
      throw new NotFoundException("用户发票不存在");
    }

    // 手动补充用户信息
    const user = await this.prisma.user.findUnique({
      where: { user_id: invoice.user_id },
      select: {
        user_id: true,
        username: true,
        email: true,
        mobile: true,
      },
    });

    return { ...invoice, user: user || null };
  }

  /**
   * 创建用户发票申请
   * @param createDto 创建数据
   * @returns 创建的发票信息
   */
  async create(createDto: CreateUserInvoiceDto) {
    // 检查用户是否已有发票信息
    const existingInvoice = await this.prisma.user_invoice.findFirst({
      where: {
        user_id: createDto.userId,
        status: UserInvoiceStatus.APPROVED,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException("用户已有有效的发票信息");
    }

    // 企业发票必须提供纳税人识别号
    if (createDto.titleType === TitleType.COMPANY && !createDto.taxNumber) {
      throw new BadRequestException("企业发票必须提供纳税人识别号");
    }

    // 映射到实际表结构字段
    const invoice = await this.prisma.user_invoice.create({
      data: {
        user_id: createDto.userId,
        title_type: createDto.titleType,
        company_name: createDto.title,
        company_code: createDto.taxNumber || "",
        company_address: createDto.registerAddress || "",
        company_phone: createDto.registerPhone || "",
        company_bank: createDto.bankName || "",
        company_account: createDto.bankAccount || "",
        status: createDto.status || UserInvoiceStatus.PENDING,
        apply_reply: createDto.applyRemark || "",
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 补充用户信息以保持兼容
    const user = await this.prisma.user.findUnique({
      where: { user_id: invoice.user_id },
      select: { user_id: true, username: true, email: true, mobile: true },
    });
    return { ...invoice, user: user || null };
  }

  /**
   * 更新用户发票申请
   * @param id 发票ID
   * @param updateDto 更新数据
   * @returns 更新后的发票信息
   */
  async update(id: number, updateDto: UpdateUserInvoiceDto) {
    const invoice = await this.prisma.user_invoice.findUnique({
      where: { invoice_id: id },
    });

    if (!invoice) {
      throw new NotFoundException("用户发票不存在");
    }

    // 拒绝必须填写原因
    if (
      updateDto.status === UserInvoiceStatus.REJECTED &&
      !updateDto.applyReply
    ) {
      throw new BadRequestException("请填写未通过原因");
    }

    // 企业发票必须提供纳税人识别号
    if (updateDto.titleType === TitleType.COMPANY && !updateDto.taxNumber) {
      throw new BadRequestException("企业发票必须提供纳税人识别号");
    }

    const updateData: any = {
      status: updateDto.status,
      apply_reply: updateDto.applyReply || "",
    };

    if (updateDto.titleType !== undefined) {
      updateData.title_type = updateDto.titleType;
    }
    if (updateDto.title !== undefined) {
      updateData.company_name = updateDto.title;
    }
    if (updateDto.taxNumber !== undefined) {
      updateData.company_code = updateDto.taxNumber;
    }
    if (updateDto.registerAddress !== undefined) {
      updateData.company_address = updateDto.registerAddress;
    }
    if (updateDto.registerPhone !== undefined) {
      updateData.company_phone = updateDto.registerPhone;
    }
    if (updateDto.bankName !== undefined) {
      updateData.company_bank = updateDto.bankName;
    }
    if (updateDto.bankAccount !== undefined) {
      updateData.company_account = updateDto.bankAccount;
    }
    if (updateDto.applyRemark !== undefined) {
      // 原 PHP 的 apply_remark 行为与本表结构不一致，这里延用到 apply_reply 字段
      updateData.apply_reply = updateDto.applyRemark;
    }

    const updatedInvoice = await this.prisma.user_invoice.update({
      where: { invoice_id: id },
      data: updateData,
    });

    const user = await this.prisma.user.findUnique({
      where: { user_id: updatedInvoice.user_id },
      select: { user_id: true, username: true, email: true, mobile: true },
    });

    return { ...updatedInvoice, user: user || null };
  }

  /**
   * 删除用户发票
   * @param id 发票ID
   */
  async delete(id: number) {
    const invoice = await this.prisma.user_invoice.findUnique({
      where: { invoice_id: id },
    });

    if (!invoice) {
      throw new NotFoundException("用户发票不存在");
    }

    await this.prisma.user_invoice.delete({
      where: { invoice_id: id },
    });
  }

  /**
   * 批量删除用户发票
   * @param ids 发票ID数组
   */
  async batchDelete(ids: number[]) {
    await this.prisma.user_invoice.deleteMany({
      where: { invoice_id: { in: ids } },
    });
  }

  /**
   * 获取配置信息
   * @returns 配置信息
   */
  async getConfig(): Promise<UserInvoiceConfigDto> {
    return {
      statusConfig: {
        [UserInvoiceStatus.PENDING]: "待审核",
        [UserInvoiceStatus.APPROVED]: "已通过",
        [UserInvoiceStatus.REJECTED]: "已拒绝",
      },
      titleTypeConfig: {
        [TitleType.PERSONAL]: "个人",
        [TitleType.COMPANY]: "企业",
      },
    };
  }

  /**
   * 获取用户的发票信息
   * @param userId 用户ID
   * @returns 用户的发票信息
   */
  async getUserInvoice(userId: number) {
    const invoice = await this.prisma.user_invoice.findFirst({
      where: {
        user_id: userId,
        status: UserInvoiceStatus.APPROVED,
      },
    });

    return invoice;
  }

  /**
   * 获取用户发票申请历史
   * @param userId 用户ID
   * @param queryDto 查询参数
   * @returns 用户发票申请历史
   */
  async getUserInvoiceHistory(userId: number, queryDto: UserInvoiceQueryDto) {
    const modifiedQuery = { ...queryDto, userId };
    return this.findAll(modifiedQuery);
  }
}
