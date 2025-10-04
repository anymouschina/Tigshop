import { Controller, Get, Query } from '@nestjs/common';
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
}

