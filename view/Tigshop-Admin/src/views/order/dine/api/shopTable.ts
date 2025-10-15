import request from '@/utils/request';
import axios from 'axios';

// 说明：request 会自动加 VITE_REQUEST_URL_PREFIX (通常为 /adminapi)，
// 这里不要再手写 /adminapi 前缀，否则会出现 /adminapi/adminapi/* 双前缀导致 404。

export function listShopTable(shopId:number){
  return request({ url:'/shopTable/list', method:'get', params:{ shopId } });
}
export function createShopTable(data:any){
  return request({ url:'/shopTable/create', method:'post', data });
}
export function updateShopTable(id:number, data:any){
  return request({ url:`/shopTable/update/${id}`, method:'put', data });
}
export function deleteShopTable(id:number){
  return request({ url:`/shopTable/delete/${id}`, method:'delete' });
}

// 获取桌号小程序二维码图片，返回的是图片流；这里直接返回完整 URL（利用 request 的 baseURL）
// 标准 API：获取二维码（后台受保护接口），返回 Blob URL，方便直接用于 <img :src>
export async function fetchShopTableQrcode(id?:number, key?:string):Promise<string>{
  const { VITE_BASE_URL, VITE_REQUEST_URL_PREFIX } = (import.meta as any).env;
  const query = key ? `key=${encodeURIComponent(key)}` : `id=${id}`;
  const url = `${VITE_BASE_URL}${VITE_REQUEST_URL_PREFIX}/shopTable/qrcode?${query}`;
  const resp = await axios.get(url, {
    responseType: 'blob',
    headers:{
      'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
      'X-Shop-Id': localStorage.getItem('shopId') || '',
      'X-Client-Type': 'admin'
    }
  });
  // 这里 resp 不是标准包装格式，因为图片是纯二进制流
  const blobUrl = URL.createObjectURL(resp.data);
  return blobUrl;
}

// 若仍需要拼接公开 URL（前端不请求二进制，直接 img src 加载），可使用此帮助函数
export function buildPublicTableQrcodeUrl(id?:number, key?:string, envVersion: 'release'|'trial'|'develop'='release'){
  const { VITE_BASE_URL } = (import.meta as any).env;
  const envParam = envVersion && envVersion!=='release' ? `&env=${envVersion}` : '';
  if(key){
    return `${VITE_BASE_URL}/qrcode/table?key=${encodeURIComponent(key)}${envParam}`;
  }
  return `${VITE_BASE_URL}/qrcode/table?id=${id}${envParam}`;
}

export function buildProtectedTableQrcodeUrl(id?:number, key?:string, envVersion: 'release'|'trial'|'develop'='release'){
  const { VITE_BASE_URL, VITE_REQUEST_URL_PREFIX } = (import.meta as any).env;
  const envParam = envVersion && envVersion!=='release' ? `&env=${envVersion}` : '';
  const query = key ? `key=${encodeURIComponent(key)}` : `id=${id}`;
  return `${VITE_BASE_URL}${VITE_REQUEST_URL_PREFIX}/shopTable/qrcode?${query}${envParam}`;
}