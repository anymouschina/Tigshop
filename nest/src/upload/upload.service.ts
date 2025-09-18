import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UploadDto, UploadType } from './dto/upload.dto';
import { DatabaseService } from 'src/database/database.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as multer from 'multer';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(private readonly databaseService: DatabaseService) {
    // 确保上传目录存在
    this.ensureUploadDir();
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 上传文件
   * @param file 文件对象
   * @param uploadDto 上传参数
   * @returns 上传结果
   */
  async uploadFile(file: multer.File, uploadDto: UploadDto) {
    try {
      // 验证文件
      this.validateFile(file);

      // 生成文件名
      const fileName = this.generateFileName(file.originalname, uploadDto.type);

      // 确定存储路径
      const relativePath = this.getStoragePath(uploadDto.type);
      const fullPath = join(this.uploadDir, relativePath);
      const filePath = join(fullPath, fileName);

      // 确保目录存在
      await fs.mkdir(fullPath, { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, file.buffer);

      // 生成文件URL
      const fileUrl = this.getFileUrl(relativePath, fileName);

      // 保存到数据库
      const fileRecord = await this.databaseService.file.create({
        data: {
          fileName,
          originalName: file.originalname,
          filePath: relativePath,
          fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          type: uploadDto.type,
          relatedId: uploadDto.relatedId,
          description: uploadDto.description,
        },
      });

      return {
        fileId: fileRecord.fileId,
        fileName,
        originalName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: uploadDto.type,
        createdAt: fileRecord.createdAt,
      };
    } catch (error) {
      this.logger.error('文件上传失败:', error);
      throw new BadRequestException('文件上传失败');
    }
  }

  /**
   * 批量上传文件
   * @param files 文件数组
   * @param uploadDto 上传参数
   * @returns 上传结果
   */
  async uploadMultipleFiles(files: multer.File[], uploadDto: UploadDto) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const results = [];
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, uploadDto);
        results.push(result);
      } catch (error) {
        this.logger.error(`文件 ${file.originalname} 上传失败:`, error);
        results.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      total: files.length,
      success: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    };
  }

  /**
   * 获取文件信息
   * @param fileId 文件ID
   * @returns 文件信息
   */
  async getFile(fileId: number) {
    const file = await this.databaseService.file.findUnique({
      where: { fileId },
    });

    if (!file) {
      throw new BadRequestException('文件不存在');
    }

    return file;
  }

  /**
   * 删除文件
   * @param fileId 文件ID
   * @returns 删除结果
   */
  async deleteFile(fileId: number) {
    const file = await this.databaseService.file.findUnique({
      where: { fileId },
    });

    if (!file) {
      throw new BadRequestException('文件不存在');
    }

    // 删除物理文件
    try {
      const filePath = join(this.uploadDir, file.filePath, file.fileName);
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn('删除物理文件失败:', error);
    }

    // 删除数据库记录
    await this.databaseService.file.delete({
      where: { fileId },
    });

    return { message: '文件删除成功' };
  }

  /**
   * 获取文件列表
   * @param type 文件类型
   * @param relatedId 关联ID
   * @param page 页码
   * @param size 每页数量
   * @returns 文件列表
   */
  async getFileList(type?: UploadType, relatedId?: number, page: number = 1, size: number = 20) {
    const skip = (page - 1) * size;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (relatedId) {
      where.relatedId = relatedId;
    }

    const [files, total] = await Promise.all([
      this.databaseService.file.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.file.count({ where }),
    ]);

    return {
      files,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 验证文件
   * @param file 文件对象
   */
  private validateFile(file: multer.File) {
    if (!file) {
      throw new BadRequestException('请选择文件');
    }

    // 文件大小限制（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过10MB');
    }

    // 允许的文件类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
  }

  /**
   * 生成文件名
   * @param originalName 原始文件名
   * @param type 文件类型
   * @returns 新文件名
   */
  private generateFileName(originalName: string, type: UploadType): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ext = originalName.split('.').pop();
    return `${type}_${timestamp}_${random}.${ext}`;
  }

  /**
   * 获取存储路径
   * @param type 文件类型
   * @returns 存储路径
   */
  private getStoragePath(type: UploadType): string {
    const paths = {
      [UploadType.PRODUCT]: 'products',
      [UploadType.USER]: 'users',
      [UploadType.CATEGORY]: 'categories',
      [UploadType.BRAND]: 'brands',
      [UploadType.ORDER]: 'orders',
      [UploadType.OTHER]: 'others',
    };
    return paths[type] || 'others';
  }

  /**
   * 获取文件URL
   * @param relativePath 相对路径
   * @param fileName 文件名
   * @returns 文件URL
   */
  private getFileUrl(relativePath: string, fileName: string): string {
    return `/uploads/${relativePath}/${fileName}`;
  }
}