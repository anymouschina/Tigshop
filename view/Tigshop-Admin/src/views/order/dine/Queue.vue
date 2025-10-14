<template>
  <div class="dine-queue-page">
    <a-card title="堂食/外带叫号队列" :loading="loading" bordered>
      <div class="toolbar">
        <a-space>
          <a-select v-model="shopId" placeholder="选择门店" style="width:180px" @change="refresh">
            <a-select-option v-for="s in shops" :key="s.id" :value="s.id">{{ s.name }}</a-select-option>
          </a-select>
          <a-date-picker v-model="dayMoment" value-format="YYYYMMDD" placeholder="业务日期" @change="refresh" />
          <a-button type="primary" @click="refresh">刷新</a-button>
          <a-button @click="autoToggle">{{ auto ? '停止自动刷新' : '自动刷新' }}</a-button>
        </a-space>
      </div>
      <a-table :data-source="records" :columns="columns" row-key="r => r.orderId" size="small" :pagination="false" />
    </a-card>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { dineQueue } from '../../../api/order/dine';
import type { DineOrderEvent } from '../../../types/dine';
import { useDineRealtime } from '../../../hooks/useDineRealtime';

function handleEvents(events: DineOrderEvent[]){
  let changed = false;
  for(const ev of events){
    // 只响应当前选择门店
    if (shopId.value && ev.shopId !== shopId.value) continue;
    if (['CREATE','APPEND'].includes(ev.kind)) {
      // CREATE 才会新增 root，APPEND 不影响 queue 列表字段（除非需要标记）
      if (ev.pickupNo != null) {
        if (!records.value.find(r=>r.orderId===ev.orderId)) {
          records.value.push({ orderId: ev.orderId, pickupNo: ev.pickupNo!, tableNo: ev.tableNo||'', orderType: ev.orderType||2, serviceState: ev.serviceState||'CREATED' });
          changed = true;
        }
      }
    }
    if (ev.kind==='STATE_CHANGE' || ev.kind==='PAY' || ev.kind==='CHANGE_TABLE') {
      const rec = records.value.find(r=>r.orderId===ev.orderId || r.orderId===ev.rootOrderId);
      if (rec) {
        if (ev.serviceState) rec.serviceState = ev.serviceState;
        if (ev.tableNo!=null) rec.tableNo = ev.tableNo || '';
        changed = true;
      }
    }
    if (ev.kind==='CANCEL') {
      const idx = records.value.findIndex(r=>r.orderId===ev.orderId);
      if (idx>=0) { records.value.splice(idx,1); changed=true; }
    }
  }
  if (changed) {
    // 按 pickupNo 重排
    records.value = [...records.value].sort((a,b)=>a.pickupNo - b.pickupNo);
  }
}

interface QueueRecord { orderId:number; pickupNo:number; tableNo?:string; orderType:number; serviceState:string }

const records = ref<QueueRecord[]>([]);
const loading = ref(false);
const shopId = ref<number | undefined>(Number(localStorage.getItem('shopId')) || undefined);
const dayMoment = ref<Dayjs | undefined>(dayjs());
const auto = ref(false);
let timer: any = null;
const shops = ref<{id:number;name:string}[]>([]); // TODO: 接入真实门店 API

function renderStateTag(state:string){
  const map: Record<string, {color:string; label:string}> = {
    CREATED: { color:'default', label:'已创建' },
    CONFIRMED: { color:'processing', label:'已确认' },
    PREPARING: { color:'cyan', label:'备餐中' },
    SERVING: { color:'blue', label:'出餐中' },
    SERVED: { color:'green', label:'已上餐' },
    FINISHED: { color:'purple', label:'完成' },
    CANCELED: { color:'red', label:'已取消' }
  };
  const item = map[state] || { color:'default', label: state };
  // 使用返回对象的方式避免 JSX 依赖
  return {
    props: {},
    children: [
      // 依赖 ant-design-vue a-tag 组件，通过 h 不直接引入（table customRender 支持）
      // 若需要更安全可改为字符串拼接
      // 这里返回一个简单标记：`[标签] 文本`
      `${item.label}`
    ]
  };
}

const columns = [
  { title:'取餐号', dataIndex:'pickupNo', width:90 },
  { title:'桌号', dataIndex:'tableNo', width:100 },
  { title:'类型', dataIndex:'orderType', width:90, customRender:({text}:any)=> (text===2?'堂食':'外带') },
  { title:'状态', dataIndex:'serviceState', width:140, customRender:({text}:any)=> renderStateTag(text) },
  { title:'订单ID', dataIndex:'orderId', width:120 }
];

async function refresh() {
  if (!shopId.value) return;
  loading.value = true;
  try {
    const day = Number(dayMoment.value?.format('YYYYMMDD'));
    const res = await dineQueue(shopId.value, day);
    records.value = res.records;
  } finally { loading.value = false; }
}

function autoToggle(){
  auto.value = !auto.value;
  if (auto.value) {
    timer = setInterval(refresh, 5000);
  } else if (timer) { clearInterval(timer); timer = null; }
}

const { connect, disconnect } = useDineRealtime({ shopId: () => shopId.value, filterShop: true, onEvents: handleEvents });

onMounted(()=>{ refresh(); connect(); });
onBeforeUnmount(()=>{ if(timer) clearInterval(timer); disconnect(); });
</script>
<style scoped>
.dine-queue-page { padding:16px; }
.toolbar { margin-bottom:12px; }
</style>
