// @ts-nocheck
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { AuthorityGuard } from 'src/auth/guards/authority.guard';
// 修正装饰器导入路径: 实际文件为 authority.decorator.ts 而非 authorities.decorator.ts
import { Authorities } from 'src/auth/decorators/authority.decorator';

@ApiTags('Admin API - 分销员详情兼容')
@Controller('adminapi/salesman/salesman')
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanDetailCompatController {
  constructor(private prisma: PrismaService) {}

  @Get('detail')
  @ApiOperation({ summary: '分销员详情（兼容结构 salesmanVO/statistical）' })
  @ApiQuery({ name: 'id', required: true, description: 'salesmanId' })
  @Authorities('salesmanManage')
  async detail(@Query('id') id: string) {
    const sid = Number(id);
    if (!sid || !Number.isFinite(sid)) return { code: 400, message: '参数错误', data: null };
    const salesman = await this.prisma.salesman.findUnique({ where: { salesman_id: sid } });
    if (!salesman) return { code: 0, message: 'success', data: null };

    // 聚合统计
    const [commissionAgg, orderAgg, customerGroup, inviteCount, userBase, groupInfo] = await Promise.all([
      this.prisma.salesman_order.aggregate({ _sum: { amount: true }, where: { salesman_id: sid, status: 1 } }),
      this.prisma.salesman_order.aggregate({ _count: { order_id: true }, where: { salesman_id: sid } }),
      this.prisma.salesman_customer.groupBy({ by: ['user_id'], where: { salesman_id: sid } }),
      this.prisma.salesman.count({ where: { pid: sid } }),
      salesman.user_id ? this.prisma.user.findUnique({ where: { user_id: salesman.user_id }, select: { user_id: true, username: true, avatar: true, mobile: true, email: true, nickname: true, distribution_register_time: true } }) : null,
      salesman.group_id ? this.prisma.salesman_group.findUnique({ where: { group_id: salesman.group_id } }) : null,
    ]);

    const levelText = this.mapLevelText(salesman.level);
    const saleAmount = Number(salesman.sale_amount || 0);
    const commissionAmount = Number(commissionAgg._sum.amount || 0);
    const orderNum = Number(orderAgg._count.order_id || 0);
    const customerNum = customerGroup.length;
    const inviteNum = inviteCount;

    const salesmanVO = {
      salesmanId: salesman.salesman_id,
      userId: salesman.user_id,
      level: salesman.level,
      groupId: salesman.group_id,
      pid: salesman.pid,
      shopId: salesman.shop_id,
      saleAmount: parseFloat(saleAmount.toFixed(2)),
      levelText,
      addTime: salesman.add_time ? this.formatTs(salesman.add_time) : '',
      baseUserInfo: userBase ? {
        userId: userBase.user_id,
        username: userBase.username,
        avatar: userBase.avatar,
        mobile: userBase.mobile,
        email: userBase.email,
        nickname: userBase.nickname || userBase.username,
        distributionRegisterTime: userBase.distribution_register_time ? this.formatTs(userBase.distribution_register_time) : null,
      } : null,
      groupInfo: groupInfo ? { groupId: groupInfo.group_id, groupName: groupInfo.group_name } : null,
      pidUserInfo: null, // 可按需补充上级信息
      totalCustomer: customerNum,
      salesmanName: null,
      salesmanPic: null,
      sortOrder: null,
      isShow: null,
      status: null,
      totalCommission: commissionAmount,
      totalInvite: inviteNum,
    };

    const statistical = {
      saleAmount: parseFloat(saleAmount.toFixed(2)),
      orderNum,
      customerNum,
      inviteNum,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      productCommissionAmount: 0,
    };

    return { code: 0, message: 'success', data: { salesmanVO, statistical } };
  }

  private formatTs(ts: number) {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private mapLevelText(level: number) {
    switch (Number(level)) {
      case 1: return '普通分销员';
      case 2: return '高级分销员';
      case 3: return '钻石分销员';
      default: return '普通分销员';
    }
  }
}
