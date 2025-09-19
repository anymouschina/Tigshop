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
import { FriendLinksService } from './friendLinks.service';
import {
  CreateFriendLinksDto,
  UpdateFriendLinksDto,
  FriendLinksQueryDto,
  FriendLinksConfigDto
} from './dto/friendLinks.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('FriendLinks Management')
@Controller('setting/friend_links')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FriendLinksController {
  constructor(private readonly friendLinksService: FriendLinksService) {}

  @Get('list')
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '获取友情链接列表' })
  async list(@Query() queryDto: FriendLinksQueryDto) {
    const result = await this.friendLinksService.findAll(queryDto);
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
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '获取配置信息' })
  async config() {
    const config = await this.friendLinksService.getConfig();
    return {
      code: 200,
      msg: '获取成功',
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get('detail')
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '获取友情链接详情' })
  async detail(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    const item = await this.friendLinksService.findById(itemId);
    return {
      code: 200,
      msg: '获取成功',
      data: item,
    };
  }

  @Post('create')
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '创建友情链接' })
  @ApiBody({ type: CreateFriendLinksDto })
  async create(@Body() createDto: CreateFriendLinksDto) {
    const item = await this.friendLinksService.create(createDto);
    return {
      code: 200,
      msg: '创建成功',
      data: item,
    };
  }

  @Put('update')
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '更新友情链接' })
  @ApiBody({ type: UpdateFriendLinksDto })
  async update(@Body() updateDto: UpdateFriendLinksDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.friendLinksService.update(id, data);
    return {
      code: 200,
      msg: '更新成功',
      data: item,
    };
  }

  @Delete('del')
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '删除友情链接' })
  async delete(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    await this.friendLinksService.delete(itemId);
    return {
      code: 200,
      msg: '删除成功',
    };
  }

  @Post('batch')
  @Roles('friendLinksManage')
  @ApiOperation({ summary: '批量操作' })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: '未选择项目',
      };
    }

    if (body.type === 'del') {
      await this.friendLinksService.batchDelete(body.ids);
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
