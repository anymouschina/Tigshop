// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { UploadDto, UploadType } from "./dto/upload.dto";

export const UPLOAD_STATUS = {
  0: "上传中",
  1: "上传成功",
  2: "上传失败",
};

export const UPLOAD_CATEGORY = {
  IMAGE: "image",
  DOCUMENT: "document",
  VIDEO: "video",
  AUDIO: "audio",
  OTHER: "other",
};

@Injectable()
export class UploadService {
  private readonly uploadPath: string;

  constructor(private prisma: PrismaService) {
    this.uploadPath = path.join(process.cwd(), "uploads");
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    const categories = Object.values(UPLOAD_CATEGORY);
    categories.forEach((category) => {
      const categoryPath = path.join(this.uploadPath, category);
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }
    });
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const randomName = crypto.randomBytes(16).toString("hex");
    return `${randomName}${ext}`;
  }

  private getFileCategory(mimetype: string): string {
    if (mimetype.startsWith("image/")) return UPLOAD_CATEGORY.IMAGE;
    if (mimetype.startsWith("video/")) return UPLOAD_CATEGORY.VIDEO;
    if (mimetype.startsWith("audio/")) return UPLOAD_CATEGORY.AUDIO;
    if (
      mimetype.includes("pdf") ||
      mimetype.includes("document") ||
      mimetype.includes("text") ||
      mimetype.includes("application/vnd.openxmlformats-officedocument")
    )
      return UPLOAD_CATEGORY.DOCUMENT;
    return UPLOAD_CATEGORY.OTHER;
  }

  private validateFile(file: Express.Multer.File, type: UploadType): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException("文件大小不能超过10MB");
    }

    const allowedTypes = this.getAllowedFileTypes(type);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }
  }

  private getAllowedFileTypes(type: UploadType): string[] {
    const commonImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const commonDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    switch (type) {
      case UploadType.PRODUCT:
      case UploadType.CATEGORY:
      case UploadType.BRAND:
        return [...commonImageTypes];
      case UploadType.USER:
        return [...commonImageTypes, "application/pdf"];
      case UploadType.ORDER:
        return [...commonImageTypes, ...commonDocumentTypes];
      default:
        return [...commonImageTypes, ...commonDocumentTypes];
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadDto,
    userId?: number,
  ): Promise<any> {
    try {
      this.validateFile(file, uploadDto.type);

      const category = this.getFileCategory(file.mimetype);
      const filename = this.generateUniqueFilename(file.originalname);
      const relativePath = path.join(category, filename);
      const filePath = path.join(this.uploadPath, relativePath);

      // 保存文件
      fs.writeFileSync(filePath, file.buffer);

      // 创建数据库记录
      const uploadRecord = await this.prisma.upload.create({
        data: {
          file_name: file.originalname,
          file_path: relativePath,
          file_url: `/uploads/${relativePath}`,
          file_size: file.size,
          file_type: file.mimetype,
          category,
          type: uploadDto.type,
          related_id: uploadDto.relatedId,
          description: uploadDto.description,
          status: 1, // 上传成功
          user_id: userId,
        },
      });

      return {
        id: uploadRecord.id,
        fileName: uploadRecord.file_name,
        filePath: uploadRecord.file_path,
        fileUrl: uploadRecord.file_url,
        fileSize: uploadRecord.file_size,
        fileType: uploadRecord.file_type,
        category: uploadRecord.category,
        type: uploadRecord.type,
        relatedId: uploadRecord.related_id,
        description: uploadRecord.description,
        status: uploadRecord.status,
        createdAt: uploadRecord.created_at,
      };
    } catch (error) {
      throw new BadRequestException(`文件上传失败: ${error.message}`);
    }
  }

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    return this.prisma.upload.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.upload.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    if (filter.keyword) {
      where.OR = [
        { file_name: { contains: filter.keyword } },
        { description: { contains: filter.keyword } },
      ];
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.relatedId) {
      where.related_id = filter.relatedId;
    }

    if (filter.userId) {
      where.user_id = filter.userId;
    }

    if (filter.status !== undefined) {
      where.status = filter.status;
    }

    if (filter.startTime && filter.endTime) {
      where.created_at = {
        gte: new Date(filter.startTime),
        lte: new Date(filter.endTime),
      };
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    const orderBy: any = {};

    if (filter.sort_field) {
      orderBy[filter.sort_field] = filter.sort_order || "desc";
    } else {
      orderBy.created_at = "desc";
    }

    return orderBy;
  }

  async deleteFile(id: number): Promise<void> {
    const upload = await this.prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      throw new NotFoundException("文件不存在");
    }

    // 删除物理文件
    const filePath = path.join(this.uploadPath, upload.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await this.prisma.upload.delete({
      where: { id },
    });
  }

  async getFileById(id: number): Promise<any> {
    const upload = await this.prisma.upload.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!upload) {
      throw new NotFoundException("文件不存在");
    }

    return upload;
  }

  async getFilesByRelatedId(
    relatedId: number,
    type: UploadType,
  ): Promise<any[]> {
    return this.prisma.upload.findMany({
      where: {
        related_id: relatedId,
        type: type,
        status: 1,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async updateFileDescription(id: number, description: string): Promise<any> {
    return this.prisma.upload.update({
      where: { id },
      data: { description },
    });
  }

  async getFileStats(): Promise<any> {
    const totalFiles = await this.prisma.upload.count();
    const totalSize = await this.prisma.upload.aggregate({
      _sum: { file_size: true },
    });

    const categoryStats = await this.prisma.upload.groupBy({
      by: ["category"],
      _count: { id: true },
      _sum: { file_size: true },
    });

    const typeStats = await this.prisma.upload.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    return {
      totalFiles,
      totalSize: totalSize._sum.file_size || 0,
      categoryStats,
      typeStats,
    };
  }
}
