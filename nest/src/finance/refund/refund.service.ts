import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  REFUND_TYPE,
  REFUND_STATUS,
  REFUND_LOG_TYPE,
  REFUND_LOG_STATUS,
  RefundQueryDto,
  CreateRefundDto,
  UpdateRefundDto,
  ProcessRefundDto,
  BatchProcessRefundDto,
  RefundStatsDto,
} from "./refund.dto";

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: RefundQueryDto) {
    const {
      keyword,
      user_id,
      order_id,
      status,
      refund_type,
      start_time,
      end_time,
      page = 1,
      size = 10,
      sort_field = "add_time",
      sort_order = "desc",
    } = query;

    const skip = (page - 1) * size;
    const where: any = {};

    // 构建查询条件
    if (keyword) {
      where.refund_note = { contains: keyword };
    }

    if (user_id) {
      where.user_id = user_id;
    }

    if (order_id) {
      where.order_id = order_id;
    }

    if (status !== undefined) {
      where.refund_status = status;
    }

    if (refund_type !== undefined) {
      where.refund_type = refund_type;
    }

    if (start_time || end_time) {
      where.add_time = {};
      if (start_time) {
        where.add_time.gte = Math.floor(new Date(start_time).getTime() / 1000);
      }
      if (end_time) {
        where.add_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.refund_apply.findMany({
        where,
        orderBy: {
          [sort_field]: sort_order,
        },
        skip,
        take: size,
      }),
      this.prisma.refund_apply.count({ where }),
    ]);

    // 为每个项目计算总退款金额
    const enrichedItems = items.map((item) => {
      const totalAmount =
        Number(item.online_balance) +
        Number(item.offline_balance) +
        Number(item.refund_balance);

      return {
        ...item,
        refund_amount: totalAmount,
      };
    });

    return {
      items: enrichedItems,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    // 计算总退款金额
    const totalRefundAmount =
      Number(refund.online_balance) +
      Number(refund.offline_balance) +
      Number(refund.refund_balance);

    // 获取退款日志
    const refundLogs = await this.prisma.refund_log.findMany({
      where: { refund_apply_id: id },
      orderBy: { add_time: "desc" },
    });

    return {
      ...refund,
      refund_amount: totalRefundAmount,
      refund_logs: refundLogs,
    };
  }

  async create(createRefundDto: CreateRefundDto, adminId?: number) {
    const {
      order_id,
      user_id,
      refund_type,
      refund_amount,
      refund_reason,
      refund_note,
      aftersale_id,
      shop_id = 1,
    } = createRefundDto;

    // 验证订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { order_id },
    });

    if (!order) {
      throw new Error("订单不存在");
    }

    // 验证订单是否已支付
    if (order.pay_status !== 1) {
      throw new Error("订单未支付，无法申请退款");
    }

    // 验证退款金额
    if (Number(refund_amount) > Number(order.total_amount)) {
      throw new Error("退款金额不能超过订单金额");
    }

    // 检查是否已有待审核的退款申请
    const existingRefund = await this.prisma.refund_apply.findFirst({
      where: {
        order_id,
        refund_status: 0, // 待审核状态
      },
    });

    if (existingRefund) {
      throw new Error("该订单已有待审核的退款申请");
    }

    // 创建退款申请
    const refund = await this.prisma.refund_apply.create({
      data: {
        order_id,
        user_id,
        refund_type,
        refund_status: 0, // 待审核
        refund_note: refund_note || refund_reason || "",
        online_balance: refund_type === 1 ? refund_amount : 0,
        offline_balance: refund_type === 3 ? refund_amount : 0,
        refund_balance: refund_type === 2 ? refund_amount : 0,
        is_online: refund_type === 1 ? 1 : 0,
        is_offline: refund_type === 3 ? 1 : 0,
        aftersale_id: aftersale_id || 0,
        shop_id,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    this.logger.log(
      `退款申请创建成功: ID=${refund.refund_id}, 订单ID=${order_id}`,
    );

    return {
      ...refund,
      refund_amount: refund_amount,
    };
  }

  async update(id: number, updateRefundDto: UpdateRefundDto, adminId?: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    // 只有待审核状态可以修改
    if (refund.refund_status !== 0) {
      throw new Error("只有待审核状态的退款申请可以修改");
    }

    const { refund_type, refund_amount, refund_reason, refund_note } =
      updateRefundDto;

    const updateData: any = {};
    if (refund_type !== undefined) {
      updateData.refund_type = refund_type;
      const currentAmount =
        refund_amount ||
        Number(refund.online_balance) +
          Number(refund.offline_balance) +
          Number(refund.refund_balance);
      updateData.online_balance = refund_type === 1 ? currentAmount : 0;
      updateData.offline_balance = refund_type === 3 ? currentAmount : 0;
      updateData.refund_balance = refund_type === 2 ? currentAmount : 0;
      updateData.is_online = refund_type === 1 ? 1 : 0;
      updateData.is_offline = refund_type === 3 ? 1 : 0;
    }

    if (refund_amount !== undefined) {
      const currentRefundType =
        refund_type !== undefined ? refund_type : refund.refund_type;
      updateData.online_balance = currentRefundType === 1 ? refund_amount : 0;
      updateData.offline_balance = currentRefundType === 3 ? refund_amount : 0;
      updateData.refund_balance = currentRefundType === 2 ? refund_amount : 0;
    }

    if (refund_note !== undefined) updateData.refund_note = refund_note;

    const updatedRefund = await this.prisma.refund_apply.update({
      where: { refund_id: id },
      data: updateData,
    });

    const totalAmount =
      Number(updatedRefund.online_balance) +
      Number(updatedRefund.offline_balance) +
      Number(updatedRefund.refund_balance);

    this.logger.log(`退款申请更新成功: ID=${id}, 操作人=${adminId}`);

    return {
      ...updatedRefund,
      refund_amount: totalAmount,
    };
  }

  async approve(id: number, adminId?: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    if (refund.refund_status !== 0) {
      throw new Error("只有待审核状态的退款申请可以审核通过");
    }

    // 更新退款申请状态
    const updatedRefund = await this.prisma.refund_apply.update({
      where: { refund_id: id },
      data: {
        refund_status: 1, // 审核通过
      },
    });

    const totalAmount =
      Number(updatedRefund.online_balance) +
      Number(updatedRefund.offline_balance) +
      Number(updatedRefund.refund_balance);

    // 创建退款日志
    await this.prisma.refund_log.create({
      data: {
        refund_apply_id: id,
        refund_type: refund.refund_type,
        refund_amount: totalAmount,
        user_id: refund.user_id,
        order_id: refund.order_id,
        add_time: Math.floor(Date.now() / 1000),
        description: `退款申请审核通过，审核人ID: ${adminId}`,
      },
    });

    this.logger.log(`退款申请审核通过: ID=${id}, 审核人=${adminId}`);

    return {
      ...updatedRefund,
      refund_amount: totalAmount,
    };
  }

  async reject(id: number, reason: string, adminId?: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    if (refund.refund_status !== 0) {
      throw new Error("只有待审核状态的退款申请可以拒绝");
    }

    const totalAmount =
      Number(refund.online_balance) +
      Number(refund.offline_balance) +
      Number(refund.refund_balance);

    // 更新退款申请状态
    const updatedRefund = await this.prisma.refund_apply.update({
      where: { refund_id: id },
      data: {
        refund_status: 2, // 已拒绝
        refund_note: reason,
      },
    });

    // 创建退款日志
    await this.prisma.refund_log.create({
      data: {
        refund_apply_id: id,
        refund_type: refund.refund_type,
        refund_amount: totalAmount,
        user_id: refund.user_id,
        order_id: refund.order_id,
        add_time: Math.floor(Date.now() / 1000),
        description: `退款申请被拒绝: ${reason}, 审核人ID: ${adminId}`,
      },
    });

    this.logger.log(
      `退款申请拒绝: ID=${id}, 原因=${reason}, 审核人=${adminId}`,
    );

    return {
      ...updatedRefund,
      refund_amount: totalAmount,
    };
  }

  async cancel(id: number, adminId?: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    if (refund.refund_status !== 0 && refund.refund_status !== 1) {
      throw new Error("只有待审核或审核通过状态的退款申请可以取消");
    }

    const totalAmount =
      Number(refund.online_balance) +
      Number(refund.offline_balance) +
      Number(refund.refund_balance);

    // 更新退款申请状态
    const updatedRefund = await this.prisma.refund_apply.update({
      where: { refund_id: id },
      data: {
        refund_status: 3, // 已取消
      },
    });

    // 创建退款日志
    await this.prisma.refund_log.create({
      data: {
        refund_apply_id: id,
        refund_type: refund.refund_type,
        refund_amount: totalAmount,
        user_id: refund.user_id,
        order_id: refund.order_id,
        add_time: Math.floor(Date.now() / 1000),
        description: `退款申请取消, 操作人ID: ${adminId}`,
      },
    });

    this.logger.log(`退款申请取消: ID=${id}, 操作人=${adminId}`);

    return {
      ...updatedRefund,
      refund_amount: totalAmount,
    };
  }

  async processRefund(processRefundDto: ProcessRefundDto, adminId?: number) {
    const {
      refund_id,
      refund_method,
      actual_amount,
      transaction_id,
      description,
      is_online = 0,
      is_offline = 0,
      is_receive = 0,
    } = processRefundDto;

    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    if (refund.refund_status !== 1) {
      throw new Error("只有审核通过状态的退款申请可以处理退款");
    }

    const totalRefundAmount =
      Number(refund.online_balance) +
      Number(refund.offline_balance) +
      Number(refund.refund_balance);

    // 验证退款金额
    if (Number(actual_amount) > totalRefundAmount) {
      throw new Error("实际退款金额不能超过申请金额");
    }

    // 开始处理退款
    try {
      // 更新退款申请状态为退款中
      await this.prisma.refund_apply.update({
        where: { refund_id },
        data: {
          refund_status: 4, // 退款中
        },
      });

      // 根据退款方式处理
      let refundSuccess = false;

      switch (refund_method) {
        case 1: // 线上退款
          // 线上退款需要通过支付服务处理，这里简化处理
          refundSuccess = true;
          break;

        case 2: // 余额退款
          // 增加用户余额
          await this.prisma.user.update({
            where: { user_id: refund.user_id },
            data: {
              balance: {
                increment: Number(actual_amount),
              },
            },
          });

          // 记录余额日志
          const currentUser = await this.prisma.user.findUnique({
            where: { user_id: refund.user_id },
            select: { balance: true },
          });

          await this.prisma.userBalanceLog.create({
            data: {
              user_id: refund.user_id,
              balance: Number(actual_amount),
              new_balance: Number(currentUser!.balance) + Number(actual_amount),
              change_time: Math.floor(Date.now() / 1000),
              change_desc: `退款增加余额: ${description || "退款"}`,
              change_type: 1, // 余额增加
            },
          });
          refundSuccess = true;
          break;

        case 3: // 线下退款
        case 4: // 原路退回
          // 线下退款和原路退回需要人工处理
          refundSuccess = is_receive === 1;
          break;
      }

      // 更新退款申请状态
      const finalStatus = refundSuccess ? 5 : 6; // 退款成功或失败
      const updatedRefund = await this.prisma.refund_apply.update({
        where: { refund_id },
        data: {
          refund_status: finalStatus,
          is_online,
          is_offline,
          is_receive,
          paylog_refund_id: 0, // 简化处理
        },
      });

      // 创建退款日志
      await this.prisma.refund_log.create({
        data: {
          refund_apply_id: refund_id,
          refund_type: refund_method,
          refund_pay_code: "",
          transaction_id: transaction_id || "",
          refund_amount: Number(actual_amount),
          user_id: refund.user_id,
          order_id: refund.order_id,
          add_time: Math.floor(Date.now() / 1000),
          description:
            description ||
            `退款处理${refundSuccess ? "成功" : "失败"}, 操作人ID: ${adminId}`,
        },
      });

      this.logger.log(
        `退款处理${refundSuccess ? "成功" : "失败"}: ID=${refund_id}, 金额=${actual_amount}, 方式=${refund_method}, 操作人=${adminId}`,
      );

      return {
        ...updatedRefund,
        refund_amount: totalRefundAmount,
      };
    } catch (error) {
      // 处理失败，更新状态
      await this.prisma.refund_apply.update({
        where: { refund_id },
        data: {
          refund_status: 6, // 退款失败
        },
      });

      // 创建退款日志
      await this.prisma.refund_log.create({
        data: {
          refund_apply_id: refund_id,
          refund_type: refund_method,
          refund_amount: Number(actual_amount),
          user_id: refund.user_id,
          order_id: refund.order_id,
          add_time: Math.floor(Date.now() / 1000),
          description: `退款处理失败: ${error.message}, 操作人ID: ${adminId}`,
        },
      });

      this.logger.error(
        `退款处理失败: ID=${refund_id}, 错误=${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async batchProcessRefund(
    batchProcessRefundDto: BatchProcessRefundDto,
    adminId?: number,
  ) {
    const { refund_ids, refund_method, description } = batchProcessRefundDto;

    const results: any[] = [];
    const errors: any[] = [];

    for (const refund_id of refund_ids) {
      try {
        const refund = await this.prisma.refund_apply.findUnique({
          where: { refund_id },
        });

        if (!refund) {
          errors.push({ refund_id, error: "退款申请不存在" });
          continue;
        }

        if (refund.refund_status !== 1) {
          errors.push({
            refund_id,
            error: "只有审核通过状态的退款申请可以处理",
          });
          continue;
        }

        const totalAmount =
          Number(refund.online_balance) +
          Number(refund.offline_balance) +
          Number(refund.refund_balance);

        const processDto: ProcessRefundDto = {
          refund_id,
          refund_method,
          actual_amount: totalAmount,
          description: description || "批量退款",
        };

        const result = await this.processRefund(processDto, adminId);
        results.push({ refund_id, success: true, result });
      } catch (error: any) {
        errors.push({ refund_id, error: error.message });
        results.push({ refund_id, success: false, error: error.message });
      }
    }

    return {
      processed: results.length,
      success: results.filter((r: any) => r.success).length,
      failed: results.filter((r: any) => !r.success).length,
      results,
      errors,
    };
  }

  async getStats(query: RefundStatsDto) {
    const { start_time, end_time, shop_id = 1 } = query;

    const where: any = { shop_id };

    if (start_time || end_time) {
      where.add_time = {};
      if (start_time) {
        where.add_time.gte = Math.floor(new Date(start_time).getTime() / 1000);
      }
      if (end_time) {
        where.add_time.lte = Math.floor(new Date(end_time).getTime() / 1000);
      }
    }

    // 获取各种状态的退款数量
    const stats = await this.prisma.refund_apply.groupBy({
      by: ["refund_status"],
      where,
      _count: {
        refund_id: true,
      },
    });

    // 获取退款类型统计
    const typeStats = await this.prisma.refund_apply.groupBy({
      by: ["refund_type"],
      where,
      _count: {
        refund_id: true,
      },
    });

    // 构建结果
    const statusStats: any = {};
    const refundTypeStats: any = {};

    stats.forEach((stat) => {
      statusStats[stat.refund_status] = {
        count: Number(stat._count.refund_id),
      };
    });

    typeStats.forEach((stat) => {
      refundTypeStats[stat.refund_type] = {
        count: Number(stat._count.refund_id),
      };
    });

    return {
      status_stats: statusStats,
      type_stats: refundTypeStats,
      total_refunds: Object.values(statusStats).reduce(
        (sum: number, stat: any) => sum + stat.count,
        0,
      ),
    };
  }

  async getRefundTypes() {
    return REFUND_TYPE;
  }

  async getRefundStatus() {
    return REFUND_STATUS;
  }

  async getRefundLogs(refundId: number) {
    return await this.prisma.refund_log.findMany({
      where: { refund_apply_id: refundId },
      orderBy: { add_time: "desc" },
    });
  }

  async remove(id: number, adminId?: number) {
    const refund = await this.prisma.refund_apply.findUnique({
      where: { refund_id: id },
    });

    if (!refund) {
      throw new Error("退款申请不存在");
    }

    // 只有待审核状态可以删除
    if (refund.refund_status !== 0) {
      throw new Error("只有待审核状态的退款申请可以删除");
    }

    // 删除相关日志
    await this.prisma.refund_log.deleteMany({
      where: { refund_apply_id: id },
    });

    // 删除退款申请
    await this.prisma.refund_apply.delete({
      where: { refund_id: id },
    });

    this.logger.log(`退款申请删除: ID=${id}, 操作人=${adminId}`);

    return { success: true };
  }
}
