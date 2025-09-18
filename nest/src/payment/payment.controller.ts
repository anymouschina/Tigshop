import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('支付管理')
@Controller('api/payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建支付' })
  @ApiResponse({ status: 201, description: '支付创建成功' })
  @ApiBody({ type: CreatePaymentDto })
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    // 确保只能为当前用户创建支付
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '获取支付记录列表' })
  @ApiResponse({ status: 200, description: '获取支付记录列表成功' })
  async findAll(@Query() queryDto: PaymentQueryDto) {
    return this.paymentService.findAll(queryDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的支付记录' })
  @ApiResponse({ status: 200, description: '获取我的支付记录成功' })
  async findMyPayments(@Query() queryDto: PaymentQueryDto, @Request() req) {
    return this.paymentService.findAll({
      ...queryDto,
      userId: req.user.userId,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取支付记录详情' })
  @ApiResponse({ status: 200, description: '获取支付记录详情成功' })
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(parseInt(id));
  }

  @Post('callback/:paymentSn')
  @ApiOperation({ summary: '支付回调处理' })
  @ApiResponse({ status: 200, description: '支付回调处理成功' })
  async handleCallback(@Param('paymentSn') paymentSn: string, @Body() callbackData: any) {
    // TODO: Implement handleCallback method in payment service
    return {
      message: '支付回调处理功能待实现',
      paymentSn,
      callbackData,
    };
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '申请退款' })
  @ApiResponse({ status: 200, description: '退款申请成功' })
  async refund(
    @Param('id') id: string,
    @Body('refundAmount') refundAmount: number,
    @Body('reason') reason?: string,
  ) {
    return this.paymentService.refund({
      paymentId: parseInt(id),
      refundAmount,
      reason,
    });
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '获取支付统计信息' })
  @ApiResponse({ status: 200, description: '获取支付统计信息成功' })
  async getStatistics(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    // 这里可以实现支付统计逻辑
    return {
      message: '支付统计功能待实现',
      startTime,
      endTime,
    };
  }
}