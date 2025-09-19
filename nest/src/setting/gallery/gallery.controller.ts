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
import { GalleryService } from './gallery.service';
import {
  CreateGalleryDto,
  UpdateGalleryDto,
  GalleryQueryDto,
  GalleryConfigDto
} from './dto/gallery.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Gallery Management')
@Controller('setting/gallery')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('list')
  @Roles('galleryManage')
  @ApiOperation({ summary: '获取图库列表' })
  async list(@Query() queryDto: GalleryQueryDto) {
    const result = await this.galleryService.findAll(queryDto);
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
  @Roles('galleryManage')
  @ApiOperation({ summary: '获取配置信息' })
  async config() {
    const config = await this.galleryService.getConfig();
    return {
      code: 200,
      msg: '获取成功',
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get('detail')
  @Roles('galleryManage')
  @ApiOperation({ summary: '获取图库详情' })
  async detail(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    const item = await this.galleryService.findById(itemId);
    return {
      code: 200,
      msg: '获取成功',
      data: item,
    };
  }

  @Post('create')
  @Roles('galleryManage')
  @ApiOperation({ summary: '创建图库' })
  @ApiBody({ type: CreateGalleryDto })
  async create(@Body() createDto: CreateGalleryDto) {
    const item = await this.galleryService.create(createDto);
    return {
      code: 200,
      msg: '创建成功',
      data: item,
    };
  }

  @Put('update')
  @Roles('galleryManage')
  @ApiOperation({ summary: '更新图库' })
  @ApiBody({ type: UpdateGalleryDto })
  async update(@Body() updateDto: UpdateGalleryDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.galleryService.update(id, data);
    return {
      code: 200,
      msg: '更新成功',
      data: item,
    };
  }

  @Delete('del')
  @Roles('galleryManage')
  @ApiOperation({ summary: '删除图库' })
  async delete(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    await this.galleryService.delete(itemId);
    return {
      code: 200,
      msg: '删除成功',
    };
  }

  @Post('batch')
  @Roles('galleryManage')
  @ApiOperation({ summary: '批量操作' })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: '未选择项目',
      };
    }

    if (body.type === 'del') {
      await this.galleryService.batchDelete(body.ids);
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
