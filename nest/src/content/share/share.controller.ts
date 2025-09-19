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
import { ShareService } from './share.service';
import {
  CreateShareDto,
  UpdateShareDto,
  ShareQueryDto,
  ShareConfigDto
} from './dto/share.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Share Management')
@Controller('content/share')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get('list')
  @Roles('shareManage')
  @ApiOperation({ summary: '获取分享列表' })
  async list(@Query() queryDto: ShareQueryDto) {
    const result = await this.shareService.findAll(queryDto);
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
  @Roles('shareManage')
  @ApiOperation({ summary: '获取配置信息' })
  async config() {
    const config = await this.shareService.getConfig();
    return {
      code: 200,
      msg: '获取成功',
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get('detail')
  @Roles('shareManage')
  @ApiOperation({ summary: '获取分享详情' })
  async detail(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    const item = await this.shareService.findById(itemId);
    return {
      code: 200,
      msg: '获取成功',
      data: item,
    };
  }

  @Post('create')
  @Roles('shareManage')
  @ApiOperation({ summary: '创建分享' })
  @ApiBody({ type: CreateShareDto })
  async create(@Body() createDto: CreateShareDto) {
    const item = await this.shareService.create(createDto);
    return {
      code: 200,
      msg: '创建成功',
      data: item,
    };
  }

  @Put('update')
  @Roles('shareManage')
  @ApiOperation({ summary: '更新分享' })
  @ApiBody({ type: UpdateShareDto })
  async update(@Body() updateDto: UpdateShareDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.shareService.update(id, data);
    return {
      code: 200,
      msg: '更新成功',
      data: item,
    };
  }

  @Delete('del')
  @Roles('shareManage')
  @ApiOperation({ summary: '删除分享' })
  async delete(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    await this.shareService.delete(itemId);
    return {
      code: 200,
      msg: '删除成功',
    };
  }

  @Post('batch')
  @Roles('shareManage')
  @ApiOperation({ summary: '批量操作' })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: '未选择项目',
      };
    }

    if (body.type === 'del') {
      await this.shareService.batchDelete(body.ids);
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
