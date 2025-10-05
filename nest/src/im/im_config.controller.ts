import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ImConfigService } from './im_config.service';

@Controller('im/config')
export class ImConfigController {
  constructor(private service: ImConfigService) {}

  // 对齐 PHP 路由：/im/config/config/detail
  @Get('config/detail')
  async getConfigDetail(@Query('code') code?: string, @Query('shopId') shopId?: string) {
    const data = await this.service.getDetail({ code: code || '', shopId: shopId ? Number(shopId) : 0 });
    return { code: 0, message: 'success', data };
  }

  // 保存配置：/im/config/config/save  (code, data(JSON), shopId)
  @Post('config/save')
  async saveConfig(@Body() body: any) {
    const code = body.code || body.key || '';
    const shopId = body.shopId ? Number(body.shopId) : 0;
    const data = body.data ?? body.value ?? null;
    const saved = await this.service.save({ code, shopId, data });
    return { code: 0, message: 'success', data: saved };
  }
}

