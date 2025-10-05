import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ImConfigService } from './im_config.service';

@Controller('im/config')
export class ImConfigController {
  constructor(private service: ImConfigService) {}

  // 对齐 PHP 路由：/im/config/config/detail
  @Get('config/detail')
  async getConfigDetail(@Query('code') code?: string, @Query('shopId') shopId?: string) {
    const row = await this.service.getDetail({ code: code || '', shopId: shopId ? Number(shopId) : 0 });
    // 期望返回纯 data JSON（activate/sendText...），而不是包含 id/code 元数据
    const payload = row && (row as any).data !== undefined ? (row as any).data : row;
    return { code: 0, message: 'success', data: payload };
  }

  // 保存配置：/im/config/config/save  (code, data(JSON), shopId)
  @Post('config/save')
  async saveConfig(@Body() body: any) {
    const code = body.code || body.key || '';
    const shopId = body.shopId ? Number(body.shopId) : 0;
    const data = body.data ?? body.value ?? null;
    await this.service.save({ code, shopId, data });
    // 保存后读取最新并仅返回 JSON
    const latest = await this.service.getDetail({ code, shopId });
    const payload = latest && (latest as any).data !== undefined ? (latest as any).data : latest;
    return { code: 0, message: 'success', data: payload };
  }
}

