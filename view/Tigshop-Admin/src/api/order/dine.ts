import request from '@/utils/request';

// 注意：这里直接调用用户侧 /api 前缀，需要显式指定 prefix 覆盖 admin 默认 /adminapi
const userApiPrefix = '/api';

export interface CreateDineOrderInput {
  orderType: 2 | 3; // 2=堂食 3=外带
  tableNo?: string;
  remark?: string;
  peopleCount?: number;
  items: { productId: number; quantity: number; skuId?: number }[];
}

export function dineCreate(data: CreateDineOrderInput, shopId: number, idemKey?: string) {
  return request<any>({
    url: 'order/dine/create',
    method: 'post',
    data,
    prefix: userApiPrefix,
    headers: { 'X-Idempotency-Key': idemKey, 'X-Shop-Id': shopId }
  });
}

export function dineAppend(parentOrderId: number, items: { productId: number; quantity: number; skuId?: number }[], idemKey?: string) {
  return request<any>({
    url: 'order/dine/append',
    method: 'post',
    data: { parentOrderId, items },
    prefix: userApiPrefix,
    headers: { 'X-Idempotency-Key': idemKey }
  });
}

export function dineChangeTable(orderId: number, newTableNo: string) {
  return request<any>({
    url: 'order/dine/change-table',
    method: 'patch',
    data: { orderId, newTableNo },
    prefix: userApiPrefix
  });
}

export function dineUpdateState(orderId: number, to: string) {
  return request<any>({
    url: 'order/dine/state',
    method: 'patch',
    data: { orderId, to },
    prefix: userApiPrefix
  });
}

export function dineQueue(shopId: number, day: number) {
  return request<{ records: any[] }>({
    url: 'order/dine/queue',
    method: 'get',
    params: { shopId, day },
    prefix: userApiPrefix
  });
}

export function dinePay(orderId: number) {
  return request<any>({
    url: 'order/dine/pay',
    method: 'post',
    data: { orderId },
    prefix: userApiPrefix
  });
}

export function dineCancel(orderId: number) {
  return request<any>({
    url: 'order/dine/cancel',
    method: 'post',
    data: { orderId },
    prefix: userApiPrefix
  });
}

export function dineDetail(orderId: number) {
  return request<any>({
    url: 'order/dine/detail',
    method: 'get',
    params: { orderId },
    prefix: userApiPrefix
  });
}

export function dineRootSummary(orderId: number) {
  return request<any>({
    url: 'order/dine/root-summary',
    method: 'get',
    params: { orderId },
    prefix: userApiPrefix
  });
}
