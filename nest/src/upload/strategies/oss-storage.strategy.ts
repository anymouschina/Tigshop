import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OSS from 'ali-oss';
import { StorageStrategy } from '../interfaces/storage-strategy.interface';

@Injectable()
export class OssStorageStrategy implements StorageStrategy, OnModuleInit {
  private ossClient: OSS;
  private bucket: string = '';
  private region: string = '';
  private baseUrl: string = '';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accessKeyId = this.configService.get<string>('STORAGE_OSS_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get<string>('STORAGE_OSS_ACCESS_KEY_SECRET');
    this.bucket = this.configService.get<string>('STORAGE_OSS_BUCKET', '');
    this.region = this.configService.get<string>('STORAGE_OSS_REGION', '');
    this.baseUrl = this.configService.get<string>('STORAGE_OSS_URL', '');

    if (!accessKeyId || !accessKeySecret || !this.bucket || !this.region) {
      console.warn('OSS配置不完整，将使用本地存储');
      return;
    }

    this.ossClient = new OSS({
      accessKeyId,
      accessKeySecret,
      bucket: this.bucket,
      region: this.region,
    });
  }

  async uploadFile(buffer: Buffer, key: string, contentType?: string): Promise<string> {
    if (!this.ossClient) {
      throw new Error('OSS客户端未初始化');
    }

    const result = await this.ossClient.put(key, buffer, {
      headers: contentType ? { 'Content-Type': contentType } : {},
    });

    if (result.url) {
      return result.url;
    }

    // 如果返回的不是完整URL，需要拼接
    if (this.baseUrl) {
      return `${this.baseUrl}/${key}`;
    }

    return `https://${this.bucket}.${this.region}.aliyuncs.com/${key}`;
  }

  getFileUrl(key: string): string {
    if (this.baseUrl) {
      return `${this.baseUrl}/${key}`;
    }
    return `https://${this.bucket}.${this.region}.aliyuncs.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.ossClient) {
      throw new Error('OSS客户端未初始化');
    }

    await this.ossClient.delete(key);
  }
}