import request from '@/utils/request';

export interface DineCreateInput {
  orderType: 2 | 3; // 2=堂食 3=外带
  tableNo?: string;
  remark?: string;
  peopleCount?: number;
  items: { productId:number; quantity:number; skuId?:number }[];
}

const prefix = '/api/order/dine';

export function dineCreate(data: DineCreateInput, shopId:number, idemKey?:string){
  return request<any>({ url: `${prefix}/create`, method:'POST', data, header:{ 'X-Shop-Id': shopId, 'X-Idempotency-Key': idemKey } });
}
export function dineAppend(parentOrderId:number, items:{productId:number;quantity:number;skuId?:number}[], idemKey?:string){
  return request<any>({ url: `${prefix}/append`, method:'POST', data:{ parentOrderId, items }, header:{ 'X-Idempotency-Key': idemKey } });
}
export function dineQueue(shopId:number, day:number){
  return request<any>({ url: `${prefix}/queue`, method:'GET', data:{ shopId, day } });
}
export function dineDetail(orderId:number){
  return request<any>({ url: `${prefix}/detail`, method:'GET', data:{ orderId } });
}
export function dineRootSummary(orderId:number){
  return request<any>({ url: `${prefix}/root-summary`, method:'GET', data:{ orderId } });
}
export function dinePay(orderId:number){
  return request<any>({ url: `${prefix}/pay`, method:'POST', data:{ orderId } });
}
export function dineCancel(orderId:number){
  return request<any>({ url: `${prefix}/cancel`, method:'POST', data:{ orderId } });
}