// @ts-nocheck
import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

/**
 * 前台 分销员详情 接口，对齐 PHP 期望 /api/salesman/salesman/detail
 * PHP 项目里没有直接的 controller，但结合 salesman 模型的 accessor 需求组装：
 *  - 基础 salesman 表字段
 *  - totalCommission: 已结算分销订单金额汇总 (salesman_order.status=1 => sum(amount))
 *  - totalCustomer: salesman_customer 按 user_id 去重数量
 *  - totalInvite: 直属下级分销员数量 (salesman.pid = 当前 salesman_id)
 * 若未传 salesmanId，则尝试用当前登录用户 userId 查找其 salesman 记录。
 */
@ApiTags("User API - 分销员")
@Controller("api/salesman/salesman")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesmanDetailController {
  constructor(private prisma: PrismaService) {}

  @Get("detail")
  @ApiOperation({ summary: "分销员详情（前台）" })
  @ApiQuery({
    name: "salesmanId",
    required: false,
    description: "分销员ID，不传则取当前用户对应的分销员",
  })
  async detail(@Req() req: any, @Query("salesmanId") salesmanId?: string) {
    const userId = req.user?.userId;
    let sid = Number(salesmanId);
    if (!sid || !Number.isFinite(sid)) {
      if (!userId) {
        return { code: 401, message: "未登录", data: null }; // 与统一响应结构兼容
      }
      const selfSalesman = await this.prisma.salesman.findFirst({
        where: { user_id: userId },
      });
      sid = selfSalesman?.salesman_id || 0;
      if (!sid) {
        return { code: 0, message: "success", data: null }; // 用户不是分销员
      }
    }

    const salesman = await this.prisma.salesman.findUnique({
      where: { salesman_id: sid },
    });
    if (!salesman) {
      return { code: 0, message: "success", data: null }; // 不抛错，保持前端兼容
    }

    // 并行聚合
    const [
      totalCommissionRow,
      totalCustomerRow,
      totalInvite,
      userBase,
      groupInfo,
    ] = await Promise.all([
      this.prisma.salesman_order.aggregate({
        _sum: { amount: true },
        where: { salesman_id: sid, status: 1 },
      }),
      this.prisma.salesman_customer.groupBy({
        by: ["user_id"],
        where: { salesman_id: sid },
      }),
      this.prisma.salesman.count({ where: { pid: sid } }),
      salesman.user_id
        ? this.prisma.user.findUnique({
            where: { user_id: salesman.user_id },
            select: {
              user_id: true,
              username: true,
              nickname: true,
              avatar: true,
              mobile: true,
            },
          })
        : null,
      salesman.group_id
        ? this.prisma.salesman_group.findUnique({
            where: { group_id: salesman.group_id },
          })
        : null,
    ]);

    const totalCommission = Number(totalCommissionRow._sum.amount || 0);
    const totalCustomer = totalCustomerRow.length;
    const data = {
      salesmanId: salesman.salesman_id,
      userId: salesman.user_id,
      level: salesman.level,
      groupId: salesman.group_id,
      pid: salesman.pid,
      addTime: salesman.add_time,
      shopId: salesman.shop_id,
      saleAmount: Number(salesman.sale_amount || 0),
      totalCommission,
      totalCustomer,
      totalInvite,
      user: userBase
        ? {
            userId: userBase.user_id,
            username: userBase.username,
            nickname: userBase.nickname || userBase.username,
            avatar: userBase.avatar,
            mobile: userBase.mobile,
          }
        : null,
      group: groupInfo
        ? { groupId: groupInfo.group_id, groupName: groupInfo.group_name }
        : null,
    };
    return { code: 0, message: "success", data };
  }
}
