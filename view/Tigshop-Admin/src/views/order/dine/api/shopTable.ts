import request from '@/utils/request';

export function listShopTable(shopId:number){
  return request({ url:'/adminapi/shopTable/list', method:'get', params:{ shopId } });
}
export function createShopTable(data:any){
  return request({ url:'/adminapi/shopTable/create', method:'post', data });
}
export function updateShopTable(id:number, data:any){
  return request({ url:`/adminapi/shopTable/update/${id}`, method:'put', data });
}
export function deleteShopTable(id:number){
  return request({ url:`/adminapi/shopTable/delete/${id}`, method:'delete' });
}