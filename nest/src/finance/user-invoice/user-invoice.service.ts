// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import {
  CreateUserInvoiceDto,
  UpdateUserInvoiceDto,
  UserInvoiceQueryDto,
  UserInvoiceStatus,
  TitleType,
  UserInvoiceConfigDto,
} from "./dto/user-invoice.dto";

@Injectable()
export class UserInvoiceService {
  constructor(private readonly prisma: DatabaseService) {}

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
      where.OR = [
        { title: { contains: keyword } },
        { tax_number: { contains: keyword } },
        { bank_name: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (userId) {
      where.user_id = userId;
    }

    // 构建排序
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    // 查询数据
    const [records, total] = await Promise.all([
      this.prisma.user_invoice.findMany({
        where,
        skip,
        take: size,
        orderBy,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              mobile: true,
            },
          },
        },
      }),
      this.prisma.user_invoice.count({ where }),
    ]);

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
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException("用户发票不存在");
    }

    return invoice;
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

    const invoice = await this.prisma.user_invoice.create({
      data: {
        user_id: createDto.userId,
        title_type: createDto.titleType,
        title: createDto.title,
        tax_number: createDto.taxNumber || "",
        register_address: createDto.registerAddress || "",
        register_phone: createDto.registerPhone || "",
        bank_name: createDto.bankName || "",
        bank_account: createDto.bankAccount || "",
        status: createDto.status || UserInvoiceStatus.PENDING,
        apply_remark: createDto.applyRemark || "",
        add_time: Math.floor(Date.now() / 1000),
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    return invoice;
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
      updateData.title = updateDto.title;
    }
    if (updateDto.taxNumber !== undefined) {
      updateData.tax_number = updateDto.taxNumber;
    }
    if (updateDto.registerAddress !== undefined) {
      updateData.register_address = updateDto.registerAddress;
    }
    if (updateDto.registerPhone !== undefined) {
      updateData.register_phone = updateDto.registerPhone;
    }
    if (updateDto.bankName !== undefined) {
      updateData.bank_name = updateDto.bankName;
    }
    if (updateDto.bankAccount !== undefined) {
      updateData.bank_account = updateDto.bankAccount;
    }
    if (updateDto.applyRemark !== undefined) {
      updateData.apply_remark = updateDto.applyRemark;
    }

    const updatedInvoice = await this.prisma.user_invoice.update({
      where: { invoice_id: id },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    return updatedInvoice;
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
