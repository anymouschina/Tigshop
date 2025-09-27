export interface StorageStrategy {
  uploadFile(buffer: Buffer, key: string, contentType?: string): Promise<string>;
  getFileUrl(key: string): string;
  deleteFile(key: string): Promise<void>;
}

export enum StorageType {
  LOCAL = 'local',
  OSS = 'oss',
  COS = 'cos'
}