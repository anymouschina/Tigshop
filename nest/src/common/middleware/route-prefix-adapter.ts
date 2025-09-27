import { Request, Response, NextFunction } from 'express';

export function routePrefixMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalUrl = req.originalUrl;

  // 检查是否已经包含 /api 或 /adminapi 前缀
  const hasApiPrefix = originalUrl.startsWith('/api/');
  const hasAdminApiPrefix = originalUrl.startsWith('/adminapi/');

  // 如果没有前缀，添加 /api 前缀
  if (!hasApiPrefix && !hasAdminApiPrefix && originalUrl !== '/') {
    // 移除开头的斜杠（如果有）
    const pathWithoutSlash = originalUrl.startsWith('/') ? originalUrl.substring(1) : originalUrl;
    req.url = `/api/${pathWithoutSlash}`;
  }

  next();
}