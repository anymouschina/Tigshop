// @ts-nocheck
import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { UploadService } from "./upload.service";
import { UploadDto, UploadType } from "./dto/upload.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("文件上传")
@Controller("upload")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "上传文件" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "要上传的文件",
        },
        type: {
          type: "string",
          enum: Object.values(UploadType),
          description: "文件类型",
        },
        relatedId: {
          type: "number",
          description: "关联ID（可选）",
        },
        description: {
          type: "string",
          description: "文件描述（可选）",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "文件上传成功" })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("请选择要上传的文件");
    }

    const userId = req.user?.userId;
    return this.uploadService.uploadFile(file, uploadDto, userId);
  }

  @Get("list")
  @ApiOperation({ summary: "获取文件列表" })
  @ApiResponse({ status: 200, description: "获取文件列表成功" })
  async getFiles(@Query() query: any) {
    const filter = {
      keyword: query.keyword || "",
      type: query.type,
      category: query.category,
      relatedId: query.relatedId ? parseInt(query.relatedId) : undefined,
      userId: query.userId ? parseInt(query.userId) : undefined,
      status: query.status !== undefined ? parseInt(query.status) : undefined,
      startTime: query.startTime,
      endTime: query.endTime,
      page: parseInt(query.page) || 1,
      size: parseInt(query.size) || 15,
      sort_field: query.sort_field || "created_at",
      sort_order: query.sort_order || "desc",
    };

    const [records, total] = await Promise.all([
      this.uploadService.getFilterResult(filter),
      this.uploadService.getFilterCount(filter),
    ]);

    return {
      records,
      total,
      page: filter.page,
      size: filter.size,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "获取文件详情" })
  @ApiResponse({ status: 200, description: "获取文件详情成功" })
  async getFileById(@Param("id", ParseIntPipe) id: number) {
    return this.uploadService.getFileById(id);
  }

  @Get("related/:relatedId/:type")
  @ApiOperation({ summary: "根据关联ID和类型获取文件列表" })
  @ApiResponse({ status: 200, description: "获取文件列表成功" })
  async getFilesByRelatedId(
    @Param("relatedId", ParseIntPipe) relatedId: number,
    @Param("type") type: UploadType,
  ) {
    return this.uploadService.getFilesByRelatedId(relatedId, type);
  }

  @Put(":id/description")
  @ApiOperation({ summary: "更新文件描述" })
  @ApiResponse({ status: 200, description: "更新文件描述成功" })
  async updateFileDescription(
    @Param("id", ParseIntPipe) id: number,
    @Body("description") description: string,
  ) {
    return this.uploadService.updateFileDescription(id, description);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除文件" })
  @ApiResponse({ status: 200, description: "删除文件成功" })
  async deleteFile(@Param("id", ParseIntPipe) id: number) {
    await this.uploadService.deleteFile(id);
    return { message: "文件删除成功" };
  }

  @Get("stats")
  @ApiOperation({ summary: "获取文件统计信息" })
  @ApiResponse({ status: 200, description: "获取文件统计信息成功" })
  async getFileStats() {
    return this.uploadService.getFileStats();
  }

  @Get("types")
  @ApiOperation({ summary: "获取支持的文件类型" })
  @ApiResponse({ status: 200, description: "获取支持的文件类型成功" })
  async getSupportedTypes() {
    return {
      types: Object.values(UploadType),
      categories: {
        IMAGE: "image",
        DOCUMENT: "document",
        VIDEO: "video",
        AUDIO: "audio",
        OTHER: "other",
      },
    };
  }
}
