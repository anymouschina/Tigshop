import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { shopContext } from '../shop-context/shop-context';

/**
 * CurrentShopId 参数装饰器 (可选)
 * 统一解析当前请求期望使用的 shopId，解析优先级：
 * 1. query: shopId / shop_id
 * 2. body: shopId / shop_id (非 GET)
 * 3. Header: X-Shop-Id / X-ShopId
 * 4. AsyncLocalStorage: shopContext
 * 返回：存在且 >0 时为 number；否则返回 undefined（表示未指定，无店铺作用域）。
 */
export const CurrentShopId = createParamDecorator((data: unknown, ctx: ExecutionContext): number | undefined => {
  const req: any = ctx.switchToHttp().getRequest();
  const take = (raw: any): number | undefined => {
    if (raw === undefined || raw === null || raw === '') return undefined;
    const n = Number(raw); return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  // 1. query
  let n = take(req.query?.shopId ?? req.query?.shop_id);
  if (n) return n;
  // 2. body
  if (req.method !== 'GET') {
    n = take(req.body?.shopId ?? req.body?.shop_id);
    if (n) return n;
  }
  // 3. header
  n = take(req.headers['x-shop-id'] ?? req.headers['x-shopid']);
  if (n) return n;
  // 4. context
  const ctxStore = shopContext.getStore();
  n = take(ctxStore?.shopId);
  return n;
});

export function hasValidShopId(shopId: number | undefined | null): shopId is number { return !!shopId && shopId > 0; }

