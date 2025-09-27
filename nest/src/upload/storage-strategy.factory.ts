import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageStrategy } from './strategies/local-storage.strategy';
import { OssStorageStrategy } from './strategies/oss-storage.strategy';
import { StorageStrategy, StorageType } from './interfaces/storage-strategy.interface';
import * as path from 'path';

@Injectable()
export class StorageStrategyFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageStrategy: LocalStorageStrategy,
    private readonly ossStorageStrategy: OssStorageStrategy,
  ) {}

  getStorageStrategy(): StorageStrategy {
    const storageType = this.configService.get<string>('STORAGE_TYPE', StorageType.LOCAL);

    switch (storageType) {
      case StorageType.OSS:
        return this.ossStorageStrategy;
      case StorageType.LOCAL:
      default:
        return this.localStorageStrategy;
    }
  }

  getUploadPath(): string {
    const customUploadPath = this.configService.get<string>('UPLOAD_PATH');
    if (customUploadPath) {
      return customUploadPath;
    }
    return path.join(process.cwd(), 'uploads');
  }
}