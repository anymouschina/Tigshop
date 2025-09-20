// @ts-nocheck
import { Controller, Get, Post, Body, Query, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserOauthService } from './user-oauth.service';
import { OAuthCallbackDto, OAuthUrlDto, OAuthProvider } from './dto/user-oauth.dto';

@ApiTags('用户端OAuth认证')
@Controller('api/user/oauth')
export class UserOauthController {
  constructor(private readonly userOauthService: UserOauthService) {}

  @Get('render/:provider')
  @ApiOperation({ summary: '获取OAuth授权链接' })
  @ApiQuery({ name: 'provider', enum: OAuthProvider })
  @ApiQuery({ name: 'redirectUri', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async render(@Param('provider') provider: OAuthProvider, @Query('redirectUri') redirectUri?: string) {
    const url = await this.userOauthService.getAuthUrl(provider, redirectUri);
    return {
      code: 200,
      message: '获取成功',
      data: url,
    };
  }

  @Get('callback/:provider')
  @ApiOperation({ summary: 'OAuth回调处理' })
  @ApiQuery({ name: 'provider', enum: OAuthProvider })
  @ApiQuery({ name: 'code', required: true })
  @ApiResponse({ status: 200, description: '授权成功' })
  async callback(
    @Param('provider') provider: OAuthProvider,
    @Query('code') code: string,
    @Query('state') state?: string,
    @Query('redirectUri') redirectUri?: string,
  ) {
    const callbackDto: OAuthCallbackDto = {
      code,
      provider,
      state,
      redirectUri,
    };

    const result = await this.userOauthService.handleCallback(callbackDto);
    return {
      code: 200,
      message: '授权成功',
      data: result,
    };
  }

  @Post('callback')
  @ApiOperation({ summary: 'OAuth回调处理（POST方式）' })
  @ApiResponse({ status: 200, description: '授权成功' })
  async callbackPost(@Body() callbackDto: OAuthCallbackDto) {
    const result = await this.userOauthService.handleCallback(callbackDto);
    return {
      code: 200,
      message: '授权成功',
      data: result,
    };
  }

  @Get('bindings')
  @ApiOperation({ summary: '获取用户OAuth绑定信息' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBindings(@Request() req) {
    const userId = req.user.userId;
    const bindings = await this.userOauthService.getUserOAuthBindings(userId);
    return {
      code: 200,
      message: '获取成功',
      data: bindings,
    };
  }

  @Get('url')
  @ApiOperation({ summary: '获取OAuth授权链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAuthUrl(@Query() query: OAuthUrlDto) {
    const url = await this.userOauthService.getAuthUrl(query.provider, query.redirectUri);
    return {
      code: 200,
      message: '获取成功',
      data: url,
    };
  }
}
