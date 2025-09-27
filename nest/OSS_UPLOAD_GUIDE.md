# OSS上传配置指南

## 概述

NestJS项目现在支持多种存储方式，包括本地存储和阿里云OSS存储。

## 配置选项

### 1. 本地存储（默认）

```env
STORAGE_TYPE=local
```

文件将保存到 `uploads/` 目录下。

### 2. 阿里云OSS存储

```env
STORAGE_TYPE=oss

# OSS配置
STORAGE_OSS_ACCESS_KEY_ID=your-oss-access-key-id
STORAGE_OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
STORAGE_OSS_BUCKET=your-oss-bucket
STORAGE_OSS_REGION=oss-cn-hangzhou
STORAGE_OSS_URL=https://your-oss-bucket.oss-cn-hangzhou.aliyuncs.com
```

## 功能特性

### ✅ 支持的功能
- 自动缩略图生成（用户头像200x200）
- 多种文件类型支持（图片、视频、音频、文档）
- 数据库记录完整信息
- 文件分类管理
- 云存储URL返回

### 🔄 存储策略切换
- 根据环境变量自动选择存储策略
- 无需修改业务代码
- 支持运行时切换

### 📁 文件组织
- 按类型分类：`image/`, `video/`, `audio/`, `document/`, `other/`
- 按日期归档：`YYYYMM/`
- 唯一文件名：随机字符串 + 时间戳

## 使用示例

### 1. 环境变量配置

```bash
# 本地开发
cp .env.example .env
# 编辑 .env 文件设置存储类型
```

### 2. 文件上传

```typescript
// 用户头像上传（自动生成缩略图）
const result = await uploadService.uploadFile(file, {
  type: UploadType.USER,
  relatedId: userId,
  description: "用户头像"
}, userId, {
  generateThumbnail: true,
  thumbnailWidth: 200,
  thumbnailHeight: 200
});

// 普通文件上传
const result = await uploadService.uploadFile(file, {
  type: UploadType.PRODUCT,
  relatedId: productId,
  description: "产品图片"
}, userId);
```

### 3. 返回数据格式

```json
{
  "id": 1,
  "fileName": "original.jpg",
  "filePath": "image/202509/original.jpg",
  "fileUrl": "https://bucket.oss-cn-hangzhou.aliyuncs.com/image/202509/original.jpg",
  "fileSize": 1024000,
  "fileType": "image/jpeg",
  "category": "image",
  "type": "user",
  "thumbnailUrl": "https://bucket.oss-cn-hangzhou.aliyuncs.com/image/202509/original_200x200.jpg",
  "thumbnailId": 2,
  "status": 1,
  "createdAt": "2025-09-27T03:30:00.000Z"
}
```

## 与PHP版本的对比

### 🔄 兼容性
- ✅ 支持相同的缩略图尺寸（200x200）
- ✅ 返回格式兼容
- ✅ 支持OSS存储
- ✅ 文件类型验证

### 🚀 增强功能
- 🆕 支持多种云存储策略
- 🆕 自动缩略图生成
- 🆕 更好的错误处理
- 🆕 TypeScript类型安全

### 🔧 配置简化
- 统一的环境变量配置
- 无需修改代码即可切换存储方式
- 自动处理OSS客户端初始化

## 注意事项

1. **OSS配置验证**：系统启动时会验证OSS配置，如果配置不完整会自动降级到本地存储
2. **缩略图生成**：用户头像会自动生成200x200缩略图，其他类型文件可选
3. **文件命名**：自动生成唯一文件名，避免冲突
4. **路径管理**：支持自定义上传路径，默认为项目根目录下的uploads文件夹