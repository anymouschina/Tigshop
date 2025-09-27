import { Request, Response, NextFunction } from 'express';

export function routePrefixMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalUrl = req.originalUrl;
  const currentUrl = req.url;

  // Debug logging
  console.log(`[RoutePrefix] originalUrl: ${originalUrl}, currentUrl: ${currentUrl}`);

  // 检查是否已经包含 /api 或 /adminapi 前缀
  const hasApiPrefix = originalUrl.startsWith('/api/') || currentUrl.startsWith('/api/');
  const hasAdminApiPrefix = originalUrl.startsWith('/adminapi/') || currentUrl.startsWith('/adminapi/');

  // 如果没有前缀，添加 /api 前缀
  if (!hasApiPrefix && !hasAdminApiPrefix && originalUrl !== '/' && currentUrl !== '/') {
    // 移除开头的斜杠（如果有）
    const pathWithoutSlash = currentUrl.startsWith('/') ? currentUrl.substring(1) : currentUrl;
    req.url = `/api/${pathWithoutSlash}`;
    console.log(`[RoutePrefix] Modified URL to: ${req.url}`);
  }

  next();
}