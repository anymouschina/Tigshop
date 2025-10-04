import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type FromStr = 'wechat' | 'miniapp' | 'h5' | 'pc' | 'android' | 'ios' | 'unknown';

function detectUserFrom(req: Request & any): FromStr {
  const headers = req.headers || {};
  const ua = String(headers['user-agent'] || '').toLowerCase();
  const q = (req.query || {}) as Record<string, any>;
  const b = (req.body || {}) as Record<string, any>;

  // 1) Explicit hints via headers or params
  const fromHeader = (headers['x-user-from'] || headers['x-client-from'] || headers['x-platform'] || headers['x-app-platform'] || '').toString().toLowerCase();
  const fromParam = (q.userFrom || q.user_from || b.userFrom || b.user_from || '').toString().toLowerCase();
  const hint = fromHeader || fromParam;
  if (['wechat', 'mp', 'mp-wechat', 'official', 'official-account'].includes(hint)) return 'wechat';
  if (['mini', 'miniapp', 'miniprogram', 'wxmini', 'weapp'].includes(hint)) return 'miniapp';
  if (['android'].includes(hint)) return 'android';
  if (['ios', 'iphone', 'ipad'].includes(hint)) return 'ios';
  if (['h5', 'mobile', 'wap'].includes(hint)) return 'h5';
  if (['pc', 'web', 'desktop'].includes(hint)) return 'pc';

  // 2) WeChat detection
  const isWeChat = ua.includes('micromessenger');
  const isMiniFlag = String(headers['x-wechat-miniprogram'] || '').toLowerCase() === 'true' || ua.includes('miniprogram') || ua.includes('mini program');
  if (isWeChat && isMiniFlag) return 'miniapp';
  if (isWeChat) return 'wechat';

  // 3) Native app hints (custom headers preferred)
  const hasAppHeader = Boolean(headers['x-app-client'] || headers['x-app-version']);
  if (hasAppHeader && ua.includes('android')) return 'android';
  if (hasAppHeader && (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios'))) return 'ios';

  // 4) Generic device checks
  const isMobile = /android|iphone|ipad|ipod|mobile|mqqbrowser|ucbrowser|miuibrowser/.test(ua);
  if (isMobile) return 'h5';
  return 'pc';
}

@Injectable()
export class RequestSourceMiddleware implements NestMiddleware {
  use(req: Request & any, _res: Response, next: NextFunction) {
    try {
      const detected = detectUserFrom(req);
      // attach to request scope
      req.userFrom = detected;
      // backfill into query/body if missing so controllers can read it transparently
      if (req && req.query && (req.query.userFrom == null && req.query.user_from == null)) {
        req.query.userFrom = detected;
      }
      if (req && req.body && (req.body.userFrom == null && req.body.user_from == null)) {
        req.body.userFrom = detected;
      }
    } catch (_e) {
      // ignore
    }
    next();
  }
}

