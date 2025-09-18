import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payment Management')
@Controller('order/pay')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 创建支付 - 对齐PHP版本 order/pay/create
   */
  @Post('create')
  @ApiOperation({ summary: '创建支付' })
  async createPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(req.user.userId, createPaymentDto);
  }

  /**
   * 获取支付状态 - 对齐PHP版本 order/pay/status
   */
  @Get('status')
  @ApiOperation({ summary: '获取支付状态' })
  async getPaymentStatus(@Request() req, @Query() query: { paymentId: number }) {
    return this.paymentService.getPaymentStatus(req.user.userId, Number(query.paymentId));
  }

  /**
   * 支付回调 - 对齐PHP版本 order/pay/notify
   */
  @Post('notify')
  @ApiOperation({ summary: '支付回调' })
  async handlePaymentCallback(
    @Headers('x-payment-sn') paymentSn: string,
    @Body() callbackData: any,
  ) {
    return this.paymentService.handlePaymentCallback(paymentSn, callbackData);
  }

  /**
   * 申请退款 - 对齐PHP版本 order/pay/refund
   */
  @Post('refund')
  @ApiOperation({ summary: '申请退款' })
  async requestRefund(
    @Request() req,
    @Body() data: { paymentId: number; amount?: number; reason?: string },
  ) {
    return this.paymentService.requestRefund(
      req.user.userId,
      Number(data.paymentId),
      {
        amount: data.amount,
        reason: data.reason,
      },
    );
  }

  /**
   * 获取支付方式列表 - 对齐PHP版本 order/pay/paymentMethods
   */
  @Get('paymentMethods')
  @ApiOperation({ summary: '获取支付方式列表' })
  async getPaymentMethods() {
    return this.paymentService.getPaymentMethods();
  }

  /**
   * 模拟支付成功（测试用）
   */
  @Post('simulate/success')
  @ApiOperation({ summary: '模拟支付成功' })
  async simulatePaymentSuccess(@Body() data: { paymentSn: string }) {
    const callbackData = {
      transaction_id: `SIM_TXN_${Date.now()}`,
      paid_time: new Date().toISOString(),
      status: 'success',
    };
    return this.paymentService.handlePaymentCallback(data.paymentSn, callbackData);
  }
}