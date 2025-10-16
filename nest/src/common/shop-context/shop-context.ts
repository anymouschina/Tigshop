import { AsyncLocalStorage } from "async_hooks";

export interface ShopRequestContext {
  shopId: number;
  isSuperAdmin: boolean;
}

export const shopContext = new AsyncLocalStorage<ShopRequestContext>();
export function getCurrentShopContext() {
  return shopContext.getStore();
}
