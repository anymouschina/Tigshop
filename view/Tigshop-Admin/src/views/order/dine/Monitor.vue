<template>
  <div class="dine-monitor-page">
    <a-row :gutter="12">
      <a-col :span="10">
        <a-card title="实时叫号" size="small" :bordered="false">
          <div class="queue-list">
            <div v-for="item in queue" :key="item.orderId" :class="['queue-item', selectedRoot===item.orderId && 'active']" @click="select(item)">
              <span class="pickup">#{{ item.pickupNo }}</span>
              <span>{{ item.orderType===2 ? '堂食' : '外带' }}</span>
              <span>{{ item.tableNo || '-' }}</span>
              <span>{{ item.serviceState }}</span>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="14">
        <a-card title="主单汇总" size="small" :loading="loadingSummary" :bordered="false">
          <div v-if="summary">
            <a-descriptions :column="2" size="small">
              <a-descriptions-item label="主单ID">{{ summary.rootOrderId }}</a-descriptions-item>
              <a-descriptions-item label="场景">{{ summary.dineScene }}</a-descriptions-item>
              <a-descriptions-item label="桌号">{{ summary.tableNo || '-' }}</a-descriptions-item>
              <a-descriptions-item label="取餐号">{{ summary.pickupNo }}</a-descriptions-item>
              <a-descriptions-item label="状态">{{ summary.serviceState }}</a-descriptions-item>
              <a-descriptions-item label="订单类型">{{ summary.orderType===2?'堂食':'外带' }}</a-descriptions-item>
            </a-descriptions>
            <a-table :data-source="summary.items" :columns="itemCols" row-key="r=> r.productId + ':' + r.skuId" size="small" :pagination="false" style="margin-top:12px" />
          </div>
          <div v-else class="empty">选择一个队列订单查看详情</div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { dineQueue, dineRootSummary } from '../../../api/order/dine';
import dayjs from 'dayjs';
import { useDineRealtime } from '../../../hooks/useDineRealtime';
import type { DineOrderEvent } from '../../../types/dine';

const shopId = Number(localStorage.getItem('shopId')) || 0;
const queue = ref<any[]>([]);
const selectedRoot = ref<number|undefined>();
const summary = ref<any|null>(null);
const loadingSummary = ref(false);
let timer: any = null;
const summaryDirty = ref(false);

const itemCols = [
  { title:'商品', dataIndex:'name' },
  { title:'数量', dataIndex:'quantity', width:90 },
  { title:'单价', dataIndex:'price', width:100 }
];

async function loadQueue(){
  if(!shopId) return;
  const day = Number(dayjs().format('YYYYMMDD'));
  const res = await dineQueue(shopId, day);
  queue.value = res.records;
  // 若当前选中已不在队列，可清除
  if(selectedRoot.value && !queue.value.find(q=>q.orderId===selectedRoot.value)) {
    selectedRoot.value = undefined;
    summary.value = null;
  }
}
async function loadSummary(orderId:number){
  loadingSummary.value = true;
  try{ summary.value = await dineRootSummary(orderId); } finally { loadingSummary.value = false; }
}
function select(item:any){
  selectedRoot.value = item.orderId;
  loadSummary(item.orderId);
}
function handleEvents(events: DineOrderEvent[]) {
  let changed = false;
  for(const ev of events){
    if(ev.shopId !== shopId) continue;
    if (ev.kind==='CREATE' && ev.pickupNo!=null) {
      if(!queue.value.find(q=>q.orderId===ev.orderId)){
        queue.value.push({ orderId: ev.orderId, pickupNo: ev.pickupNo, tableNo: ev.tableNo||'', orderType: ev.orderType||2, serviceState: ev.serviceState||'CREATED' });
        changed = true;
      }
    }
    if (['STATE_CHANGE','PAY','CHANGE_TABLE'].includes(ev.kind)) {
      const rec = queue.value.find(q=>q.orderId===ev.orderId || q.orderId===ev.rootOrderId);
      if (rec) {
        if (ev.serviceState) rec.serviceState = ev.serviceState;
        if (ev.tableNo!=null) rec.tableNo = ev.tableNo || '';
        changed = true;
      }
      if(selectedRoot.value && (selectedRoot.value===ev.orderId || selectedRoot.value===ev.rootOrderId)){
        if(ev.serviceState && summary.value) summary.value.serviceState = ev.serviceState;
        if(ev.tableNo!=null && summary.value) summary.value.tableNo = ev.tableNo || '';
      }
    }
    if (ev.kind==='APPEND') {
      if(selectedRoot.value && (selectedRoot.value===ev.rootOrderId)){
        summaryDirty.value = true; // 标记有新子单
      }
    }
    if (ev.kind==='CANCEL') {
      const idx = queue.value.findIndex(q=>q.orderId===ev.orderId);
      if(idx>=0){ queue.value.splice(idx,1); changed = true; }
      if(selectedRoot.value===ev.orderId){ selectedRoot.value = undefined; summary.value = null; }
    }
  }
  if(changed){ queue.value = [...queue.value].sort((a,b)=> a.pickupNo - b.pickupNo); }
}

const { connect, disconnect } = useDineRealtime({ shopId: ()=> shopId, filterShop: true, onEvents: handleEvents });

onMounted(()=>{ loadQueue(); connect(); timer=setInterval(loadQueue,30000); });
onBeforeUnmount(()=>{ if(timer) clearInterval(timer); disconnect(); });
</script>
<style scoped>
.dine-monitor-page { padding:16px; }
.queue-list { max-height:70vh; overflow:auto; }
.queue-item { cursor:pointer; display:flex; gap:8px; padding:4px 6px; border-bottom:1px solid #f3f3f3; font-size:13px; }
.queue-item.active { background:#f0f5ff; font-weight:600; }
.pickup { font-weight:600; }
.empty { padding:12px; color:#999; }
</style>
