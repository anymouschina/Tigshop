// 统一客户端来源解析，对齐 PHP utils/Util::getClientType + getUserAgent 逻辑
// 优先使用自定义 Header: X-Client-Type (大小写不敏感)
// 允许的值: pc | wechat | h5 | miniProgram | android | ios | app
// 若 Header 缺失或无效，可根据 user-agent 进行回退推断
export function resolveClientType(req: any): string {
  if (!req) return '';
  const headers = req.headers || {};
  const headerVal = (headers['x-client-type'] || headers['X-Client-Type'] || '').toString().trim();
  const allow = new Set(['pc','wechat','h5','miniProgram','android','ios','app']);
  if (headerVal && allow.has(headerVal)) return headerVal;
  // UA 回退
  const ua = (headers['user-agent'] || headers['User-Agent'] || '').toString();
  if (/APP/i.test(ua)) return 'app';
  if (/MicroMessenger/i.test(ua)) {
    if (/MiniProgram/i.test(ua)) return 'miniProgram';
    return 'wechat';
  }
  if (/Windows|Macintosh/i.test(ua)) return 'pc';
  return 'h5';
}
