// @ts-nocheck
import { Controller, Get, Post, Put, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserAccountService } from './user-account.service';
import { BalanceQueryDto, WithdrawApplyDto, RechargeOrderDto, SetWithdrawPasswordDto, VerifyWithdrawPasswordDto } from './dto/user-account.dto';

@ApiTags('用户端账户管理')
@Controller('api/user/account')
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  @Get('balance')
  @ApiOperation({ summary: '获取账户余额' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBalance(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userAccountService.getBalanceDetail(userId);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Get('balanceLog')
  @ApiOperation({ summary: '获取余额明细' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBalanceLog(@Request() req, @Query() queryDto: BalanceQueryDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.getBalanceLog(userId, queryDto);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Post('withdraw')
  @ApiOperation({ summary: '申请提现' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '申请成功' })
  async withdrawApply(@Request() req, @Body() withdrawDto: WithdrawApplyDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.withdrawApply(userId, withdrawDto);
    return {
      code: 200,
      message: '提现申请成功',
      data,
    };
  }

  @Post('recharge')
  @ApiOperation({ summary: '充值申请' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '申请成功' })
  async rechargeOrder(@Request() req, @Body() rechargeDto: RechargeOrderDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.rechargeOrder(userId, rechargeDto);
    return {
      code: 200,
      message: '充值申请成功',
      data,
    };
  }

  @Post('setWithdrawPassword')
  @ApiOperation({ summary: '设置提现密码' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '设置成功' })
  async setWithdrawPassword(@Request() req, @Body() setPasswordDto: SetWithdrawPasswordDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.setWithdrawPassword(userId, setPasswordDto);
    return {
      code: 200,
      message: '提现密码设置成功',
      data,
    };
  }

  @Post('verifyWithdrawPassword')
  @ApiOperation({ summary: '验证提现密码' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '验证成功' })
  async verifyWithdrawPassword(@Request() req, @Body() verifyDto: VerifyWithdrawPasswordDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.verifyWithdrawPassword(userId, verifyDto);
    return {
      code: 200,
      message: '验证成功',
      data,
    };
  }

  @Get('withdrawList')
  @ApiOperation({ summary: '获取提现记录' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWithdrawList(@Request() req, @Query() queryDto: BalanceQueryDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.getWithdrawList(userId, queryDto);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Get('rechargeList')
  @ApiOperation({ summary: '获取充值记录' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRechargeList(@Request() req, @Query() queryDto: BalanceQueryDto) {
    const userId = req.user.userId;
    const data = await this.userAccountService.getRechargeList(userId, queryDto);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }
}
