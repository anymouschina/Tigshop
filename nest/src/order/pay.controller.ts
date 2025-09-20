import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayService } from './pay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Order Payment')
@Controller('api')
export class PayController {
  constructor(private readonly payService: PayService) {}

  /**
   * 订单支付 - 对齐PHP版本 order/Pay/index
   */
  @Get('order/pay/index')
  @ApiBearerAuth()
  @ApiOperation({ summary: '订单支付' })
  async index(@Request() req, @Query() query: { id: number }) {
    const userId = req.user.userId;
    const orderId = query.id;

    if (!orderId) {
      throw new HttpException('参数缺失', HttpStatus.BAD_REQUEST);
    }

    return this.payService.getOrderPaymentInfo(userId, orderId);
  }

  /**
   * 检测订单支付状态 - 对齐PHP版本 order/Pay/getPayLog
   */
  @Get('order/pay/getPayLog')
  @ApiBearerAuth()
  @ApiOperation({ summary: '检测订单支付状态' })
  async getPayLog(@Query() query: { id: number }) {
    const orderId = query.id;

    if (!orderId) {
      throw new HttpException('参数缺失', HttpStatus.BAD_REQUEST);
    }

    const payLog = await this.payService.getPayLogByOrderId(orderId);
    return payLog || null;
  }

  /**
   * 检测订单支付状态 - 对齐PHP版本 order/Pay/checkStatus
   */
  @Get('order/pay/checkStatus')
  @ApiBearerAuth()
  @ApiOperation({ summary: '检测订单支付状态' })
  async checkStatus(@Query() query: { id?: number; paylog_id?: number }) {
    const { id, paylog_id } = query;

    if (!id && !paylog_id) {
      throw new HttpException('参数缺失', HttpStatus.BAD_REQUEST);
    }

    let payStatus = 0;
    if (id) {
      payStatus = await this.payService.getPayStatusByOrderId(id);
    } else {
      payStatus = await this.payService.getPayStatusByPayLogId(paylog_id);
    }

    return payStatus > 0 ? 1 : 0;
  }

  /**
   * 订单支付 - 对齐PHP版本 order/Pay/create
   */
  @Post('order/pay/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建支付' })
  async create(@Request() req, @Body() body: { id: number; type: string; code?: string }) {
    const userId = req.user.userId;
    const { id, type, code } = body;

    if (!id || !type) {
      throw new HttpException('未选择支付方式', HttpStatus.BAD_REQUEST);
    }

    return this.payService.createPayment(userId, id, type, code);
  }

  /**
   * 支付回调 - 对齐PHP版本 order/Pay/notify
   */
  @Post('order/pay/notify')
  @Public()
  @ApiOperation({ summary: '支付回调' })
  async notify(@Body() body: any, @Query() query: { payCode?: string }) {
    const payCode = query.payCode || body.payCode;
    return this.payService.handleNotify(payCode, body);
  }

  /**
   * 退款回调 - 对齐PHP版本 order/Pay/refundNotify
   */
  @Post('order/pay/refundNotify')
  @Public()
  @ApiOperation({ summary: '退款回调' })
  async refundNotify(@Body() body: any, @Query() query: { pay_code?: string }) {
    const payCode = query.pay_code || body.pay_code;
    return this.payService.handleRefundNotify(payCode, body);
  }
}