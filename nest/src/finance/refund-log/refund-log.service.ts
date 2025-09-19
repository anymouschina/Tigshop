import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundLog } from '../entities/refund-log.entity';
import { RefundApply } from '../entities/refund-apply.entity';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { RefundLogQueryDto } from './dto/refund-log.dto';
import { RefundLogType } from '../entities/refund-log.entity';

@Injectable()
export class RefundLogService {
  constructor(
    @InjectRepository(RefundLog)
    private refundLogRepository: Repository<RefundLog>,
    @InjectRepository(RefundApply)
    private refundApplyRepository: Repository<RefundApply>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  // 构建筛选查询
  buildFilterQuery(queryDto: RefundLogQueryDto) {
    const query = this.refundLogRepository.createQueryBuilder('refund_log')
      .leftJoinAndSelect('refund_log.refund_apply', 'refund_apply')
      .leftJoinAndSelect('refund_log.user', 'user')
      .leftJoinAndSelect('refund_log.order', 'order');

    if (queryDto.keyword) {
      query.andWhere('(user.username LIKE :keyword OR user.mobile LIKE :keyword OR order.order_sn LIKE :keyword)', {
        keyword: `%${queryDto.keyword}%`
      });
    }

    if (queryDto.type !== undefined && queryDto.type !== -1) {
      query.andWhere('refund_log.refund_type = :type', { type: queryDto.type });
    }

    if (queryDto.sort_field && queryDto.sort_order) {
      query.orderBy(`refund_log.${queryDto.sort_field}`, queryDto.sort_order);
    }

    return query;
  }

  // 获取筛选结果
  async getFilterResult(queryDto: RefundLogQueryDto) {
    const query = this.buildFilterQuery(queryDto);
    const skip = (queryDto.page - 1) * queryDto.size;
    const results = await query.skip(skip).take(queryDto.size).getMany();

    // 添加退款类型名称
    return results.map(log => ({
      ...log,
      refund_type_name: log.getRefundTypeName(),
    }));
  }

  // 获取筛选结果数量
  async getFilterCount(queryDto: RefundLogQueryDto) {
    const query = this.buildFilterQuery(queryDto);
    return query.getCount();
  }

  // 获取退款类型统计
  async getRefundTypeStatistics() {
    const results = await this.refundLogRepository
      .createQueryBuilder('refund_log')
      .select('refund_log.refund_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(refund_log.refund_amount)', 'total_amount')
      .groupBy('refund_log.refund_type')
      .getRawMany();

    return results.map(result => ({
      type: result.type,
      type_name: this.getRefundTypeName(result.type),
      count: parseInt(result.count),
      total_amount: Number(result.total_amount || 0).toFixed(2),
    }));
  }

  // 获取退款金额趋势统计
  async getRefundTrendStatistics(dateRange: string[]) {
    const query = this.refundLogRepository
      .createQueryBuilder('refund_log')
      .select('DATE(refund_log.add_time)', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(refund_log.refund_amount)', 'total_amount')
      .where('refund_log.add_time BETWEEN :startDate AND :endDate', {
        startDate: new Date(dateRange[0]),
        endDate: new Date(dateRange[1]),
      })
      .groupBy('DATE(refund_log.add_time)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return query.map(result => ({
      date: result.date,
      count: parseInt(result.count),
      total_amount: Number(result.total_amount || 0).toFixed(2),
    }));
  }

  // 创建退款日志
  async createRefundLog(logData: Partial<RefundLog>) {
    const refundLog = this.refundLogRepository.create(logData);
    return await this.refundLogRepository.save(refundLog);
  }

  // 获取退款详情
  async getDetail(id: number) {
    const refundLog = await this.refundLogRepository.findOne({
      where: { log_id: id },
      relations: [
        'refund_apply',
        'refund_apply.aftersales',
        'user',
        'order',
      ],
    });

    if (!refundLog) {
      throw new Error('退款日志不存在');
    }

    return {
      ...refundLog,
      refund_type_name: refundLog.getRefundTypeName(),
    };
  }

  // 获取退款类型名称
  private getRefundTypeName(type: number): string {
    const typeMap = {
      [RefundLogType.ONLINE]: '线上退款',
      [RefundLogType.BALANCE]: '余额退款',
      [RefundLogType.OFFLINE]: '线下退款',
    };
    return typeMap[type] || '未知类型';
  }

  // 获取用户退款历史
  async getUserRefundHistory(userId: number, page: number = 1, size: number = 10) {
    const query = this.refundLogRepository.createQueryBuilder('refund_log')
      .leftJoinAndSelect('refund_log.refund_apply', 'refund_apply')
      .leftJoinAndSelect('refund_log.order', 'order')
      .where('refund_log.user_id = :userId', { userId })
      .orderBy('refund_log.add_time', 'DESC');

    const skip = (page - 1) * size;
    const [results, total] = await query.skip(skip).take(size).getManyAndCount();

    return {
      records: results.map(log => ({
        ...log,
        refund_type_name: log.getRefundTypeName(),
      })),
      total,
    };
  }

  // 获取订单退款日志
  async getOrderRefundLogs(orderId: number) {
    const logs = await this.refundLogRepository.find({
      where: { order_id: orderId },
      relations: ['refund_apply', 'user'],
      order: { add_time: 'DESC' },
    });

    return logs.map(log => ({
      ...log,
      refund_type_name: log.getRefundTypeName(),
    }));
  }

  // 删除退款日志（仅限管理员）
  async deleteRefundLog(id: number, adminId: number) {
    const refundLog = await this.refundLogRepository.findOne({
      where: { log_id: id },
    });

    if (!refundLog) {
      throw new Error('退款日志不存在');
    }

    // 记录删除操作
    await this.refundLogRepository.remove(refundLog);
    return true;
  }
}