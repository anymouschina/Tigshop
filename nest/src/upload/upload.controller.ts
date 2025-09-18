import { Controller, Post, Get, Delete, Param, Query, Body, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadDto, UploadType } from './dto/upload.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@ApiTags('文件上传')
@Controller('api/upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传单个文件' })
  @ApiResponse({ status: 200, description: '文件上传成功' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '要上传的文件',
        },
        type: {
          type: 'string',
          enum: Object.values(UploadType),
          description: '文件类型',
        },
        relatedId: {
          type: 'number',
          description: '关联ID（可选）',
        },
        description: {
          type: 'string',
          description: '文件描述（可选）',
        },
      },
    },
  })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDto,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    return this.uploadService.uploadFile(file, uploadDto);
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: '批量上传文件' })
  @ApiResponse({ status: 200, description: '文件上传成功' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '要上传的文件数组',
        },
        type: {
          type: 'string',
          enum: Object.values(UploadType),
          description: '文件类型',
        },
        relatedId: {
          type: 'number',
          description: '关联ID（可选）',
        },
        description: {
          type: 'string',
          description: '文件描述（可选）',
        },
      },
    },
  })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }
    return this.uploadService.uploadMultipleFiles(files, uploadDto);
  }

  @Get('files')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取文件列表' })
  @ApiResponse({ status: 200, description: '获取文件列表成功' })
  async getFileList(
    @Query('type') type?: UploadType,
    @Query('relatedId') relatedId?: number,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return this.uploadService.getFileList(type, relatedId, page, size);
  }

  @Get('files/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取文件信息' })
  @ApiResponse({ status: 200, description: '获取文件信息成功' })
  async getFile(@Param('id') id: string) {
    return this.uploadService.getFile(parseInt(id));
  }

  @Delete('files/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '删除文件' })
  @ApiResponse({ status: 200, description: '文件删除成功' })
  async deleteFile(@Param('id') id: string) {
    return this.uploadService.deleteFile(parseInt(id));
  }

  @Get('my-files')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的文件列表' })
  @ApiResponse({ status: 200, description: '获取我的文件列表成功' })
  async getMyFiles(
    @Query('type') type?: UploadType,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return this.uploadService.getFileList(type, undefined, page, size);
  }
}