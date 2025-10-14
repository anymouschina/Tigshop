import { reactive } from 'vue';

export interface DineQueueRecord { orderId:number; pickupNo:number; tableNo?:string; orderType:number; serviceState:string }
export interface DineOrderEvent { kind:string; orderId:number; rootOrderId?:number; shopId:number; pickupNo?:number; tableNo?:string; orderType?:number; serviceState?:string; timestamp?:number }

const state = reactive({
  queue: [] as DineQueueRecord[],
  currentOrderId: 0,
  summaryDirty: false
});

function applyEvents(events: DineOrderEvent[], currentShopId?:number){
  let changed = false;
  for(const ev of events){
    if(currentShopId && ev.shopId!==currentShopId) continue;
    if(ev.kind==='CREATE' && ev.pickupNo!=null){
      if(!state.queue.find(q=>q.orderId===ev.orderId)){
        state.queue.push({ orderId: ev.orderId, pickupNo: ev.pickupNo, tableNo: ev.tableNo||'', orderType: ev.orderType||2, serviceState: ev.serviceState||'CREATED' });
        changed = true;
      }
    }
    if(['STATE_CHANGE','PAY','CHANGE_TABLE'].includes(ev.kind)){
      const rec = state.queue.find(q=>q.orderId===ev.orderId || q.orderId===ev.rootOrderId);
      if(rec){
        if(ev.serviceState) rec.serviceState = ev.serviceState;
        if(ev.tableNo!=null) rec.tableNo = ev.tableNo || '';
        changed = true;
      }
    }
    if(ev.kind==='APPEND'){
      if(state.currentOrderId && (state.currentOrderId===ev.rootOrderId)) state.summaryDirty = true;
    }
    if(ev.kind==='CANCEL'){
      const idx = state.queue.findIndex(q=>q.orderId===ev.orderId);
      if(idx>=0){ state.queue.splice(idx,1); changed=true; }
      if(state.currentOrderId===ev.orderId){ state.currentOrderId = 0; }
    }
  }
  if(changed){ state.queue.sort((a,b)=> a.pickupNo - b.pickupNo); }
}

export default { state, applyEvents };