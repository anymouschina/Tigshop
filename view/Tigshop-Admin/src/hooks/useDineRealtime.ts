import { onMounted, onBeforeUnmount, ref } from 'vue';
import WebSocketClient from '@/services/socket';
import type { DineOrderEvent } from '@/types/dine';

export interface UseDineRealtimeOptions {
  shopId?: () => number | undefined; // 动态获取当前门店
  onEvents?: (events: DineOrderEvent[]) => void; // 原始事件回调
  filterShop?: boolean; // 是否按 shop 过滤
  autoConnect?: boolean;
}

export function useDineRealtime(opts: UseDineRealtimeOptions){
  const connected = ref(false);
  const wsRef = ref<WebSocketClient|null>(null);

  function connect(){
    const token = localStorage.getItem('accessToken');
    if(!token) return;
    const base: string = (window as any).__APP_SOCKET__ || location.origin.replace(/^http/,'ws') + '/ws';
    const ws = new WebSocketClient(`${base}?token=${token}&platform=admin`);
    wsRef.value = ws;
    ws.onopen(()=>{ connected.value = true; });
    ws.onclose(()=>{ connected.value = false; });
    ws.onmessage((ev: MessageEvent)=>{
      try {
        const payload = JSON.parse(ev.data);
        if(payload.type==='dine_order' && Array.isArray(payload.data)){
          let events: DineOrderEvent[] = payload.data;
          if(opts.filterShop && opts.shopId){
            const sid = opts.shopId();
            if(sid){ events = events.filter(e=> e.shopId===sid); }
          }
          if(events.length && opts.onEvents){
            opts.onEvents(events);
          }
        }
      } catch {}
    });
    ws.connect();
  }

  function disconnect(){
    if(wsRef.value){ wsRef.value.close(); wsRef.value = null; }
  }

  onMounted(()=>{ if(opts.autoConnect!==false) connect(); });
  onBeforeUnmount(disconnect);

  return { connected, connect, disconnect };
}

export default useDineRealtime;