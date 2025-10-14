import { onMounted, onBeforeUnmount } from 'vue';
import dineStore from '@/store/dine';

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnect = 5;

function connect(shopId?:number){
  const token = uni.getStorageSync('accessToken');
  if(!token) return;
  const base = (typeof window!=='undefined'? window.location.origin : '')
    .replace(/^http/,'ws') + '/ws';
  ws = new WebSocket(`${base}?token=${token}&platform=uniapp`);
  ws.onopen = ()=>{ reconnectAttempts = 0; };
  ws.onmessage = (e)=>{
    try{ const payload = JSON.parse(e.data); if(payload.type==='dine_order' && Array.isArray(payload.data)){ dineStore.applyEvents(payload.data, shopId); } }catch{}
  };
  ws.onclose = ()=>{ attemptReconnect(shopId); };
  ws.onerror = ()=>{ attemptReconnect(shopId); };
}
function attemptReconnect(shopId?:number){
  if(reconnectAttempts < maxReconnect){
    reconnectAttempts++;
    setTimeout(()=> connect(shopId), 1000 * reconnectAttempts);
  }
}
function disconnect(){ if(ws){ ws.close(); ws = null; } }

export function useDineSocket(shopId?:number){
  onMounted(()=> connect(shopId));
  onBeforeUnmount(()=> disconnect());
}

export default useDineSocket;