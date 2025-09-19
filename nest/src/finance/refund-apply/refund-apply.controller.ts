import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RefundApplyService } from './refund-apply.service';
import { RefundApplyQueryDto, RefundApplyAuditDto, RefundApplyOfflineAuditDto } from './dto/refund-apply.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';

@ApiTags('财务管理-退款申请')
@Controller('admin/finance/refund-apply')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class RefundApplyController {
  constructor(private readonly refundApplyService: RefundApplyService) {}

  @ApiOperation({ summary: '获取退款申请列表' })
  @Get('list')
  async list(@Query() queryDto: RefundApplyQueryDto) {
    const records = await this.refundApplyService.getFilterResult(queryDto);
    const total = await this.refundApplyService.getFilterCount(queryDto);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
      },
    };
  }

  @ApiOperation({ summary: '获取退款状态配置' })
  @Get('config')
  async config() {
    const refundStatusList = this.refundApplyService.getRefundStatusList();
    return {
      code: 200,
      message: '获取成功',
      data: refundStatusList,
    };
  }

  @ApiOperation({ summary: '获取退款申请详情' })
  @Get('detail')
  async detail(@Query('id') id: number) {
    const item = await this.refundApplyService.getDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @ApiOperation({ summary: '审核退款申请' })
  @Post('audit')
  async audit(@Body() auditDto: RefundApplyAuditDto) {
    const result = await this.refundApplyService.auditRefundApply(auditDto.refund_id, auditDto);
    if (result) {
      return {
        code: 200,
        message: '审核成功',
        data: null,
      };
    } else {
      return {
        code: 400,
        message: '退款申请更新失败',
        data: null,
      };
    }
  }

  @ApiOperation({ summary: '确认线下转账' })
  @Post('offline-audit')
  async offlineAudit(@Body() auditDto: RefundApplyOfflineAuditDto) {
    const result = await this.refundApplyService.offlineAudit(auditDto);
    if (result) {
      return {
        code: 200,
        message: '确认成功',
        data: null,
      };
    } else {
      return {
        code: 400,
        message: '更新失败',
        data: null,
      };
    }
  }
}