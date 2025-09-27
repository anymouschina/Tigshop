import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthDebugMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 记录认证相关的调试信息
    console.log('🔍 [Auth Debug] Request details:');
    console.log(`📍 Path: ${req.path}`);
    console.log(`📍 Method: ${req.method}`);
    console.log(`📍 Headers:`, JSON.stringify(req.headers, null, 2));

    // 检查Authorization头
    const authHeader = req.headers.authorization;
    if (authHeader) {
      console.log(`🔑 Authorization header found: ${authHeader.substring(0, 30)}...`);

      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log(`🎫 Token length: ${token.length}`);
        console.log(`🎫 Token format: ${token.split('.').length === 3 ? 'Valid JWT' : 'Invalid JWT'}`);
      } else {
        console.log(`❌ Invalid Authorization format: ${authHeader.substring(0, 20)}...`);
      }
    } else {
      console.log(`❌ No Authorization header found`);
    }

    console.log('----------------------------------------');

    next();
  }
}