import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WechatLiveService } from './wechatLive.service';
import {
  CreateWechatLiveDto,
  UpdateWechatLiveDto,
  WechatLiveQueryDto,
  WechatLiveConfigDto
} from './dto/wechatLive.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('WechatLive Management')
@Controller('promotion/wechat_live')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WechatLiveController {
  constructor(private readonly wechatLiveService: WechatLiveService) {}

  @Get('list')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '获取微信直播列表' })
  async list(@Query() queryDto: WechatLiveQueryDto) {
    const result = await this.wechatLiveService.findAll(queryDto);
    return {
      code: 200,
      msg: '获取成功',
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('config')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '获取配置信息' })
  async config() {
    const config = await this.wechatLiveService.getConfig();
    return {
      code: 200,
      msg: '获取成功',
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get('detail')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '获取微信直播详情' })
  async detail(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    const item = await this.wechatLiveService.findById(itemId);
    return {
      code: 200,
      msg: '获取成功',
      data: item,
    };
  }

  @Post('create')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '创建微信直播' })
  @ApiBody({ type: CreateWechatLiveDto })
  async create(@Body() createDto: CreateWechatLiveDto) {
    const item = await this.wechatLiveService.create(createDto);
    return {
      code: 200,
      msg: '创建成功',
      data: item,
    };
  }

  @Put('update')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '更新微信直播' })
  @ApiBody({ type: UpdateWechatLiveDto })
  async update(@Body() updateDto: UpdateWechatLiveDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.wechatLiveService.update(id, data);
    return {
      code: 200,
      msg: '更新成功',
      data: item,
    };
  }

  @Delete('del')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '删除微信直播' })
  async delete(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    await this.wechatLiveService.delete(itemId);
    return {
      code: 200,
      msg: '删除成功',
    };
  }

  @Post('batch')
  @Roles('wechatLiveManage')
  @ApiOperation({ summary: '批量操作' })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: '未选择项目',
      };
    }

    if (body.type === 'del') {
      await this.wechatLiveService.batchDelete(body.ids);
      return {
        code: 200,
        msg: '批量删除成功',
      };
    } else {
      return {
        code: 400,
        msg: '操作类型错误',
      };
    }
  }
}
