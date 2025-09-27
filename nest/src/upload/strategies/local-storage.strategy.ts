import { Injectable } from '@nestjs/common';
import { StorageStrategy } from '../interfaces/storage-strategy.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LocalStorageStrategy implements StorageStrategy {
  private uploadPath: string;

  constructor() {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    const categories = ['image', 'video', 'audio', 'document', 'other'];
    categories.forEach((category) => {
      const categoryPath = path.join(this.uploadPath, category);
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }
    });
  }

  async uploadFile(buffer: Buffer, key: string, contentType?: string): Promise<string> {
    const filePath = path.join(this.uploadPath, key);

    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${key}`;
  }

  getFileUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadPath, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}