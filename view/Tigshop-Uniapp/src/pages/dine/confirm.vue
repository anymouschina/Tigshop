<template>
  <view class="page">
    <view v-for="c in cart" :key="c.id">{{ c.name }} x {{ c.quantity }}</view>
    <textarea v-model="remark" placeholder="备注" />
    <button @click="submit" :disabled="submitting">提交订单</button>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { dineCreate } from '../../api/dine';
const shopId = ref<number>();
const tableNo = ref('');
const orderType = ref<2|3>(2);
const cart = ref<any[]>([]);
const peopleCount = ref<number>(1);
const remark = ref('');
const submitting = ref(false);
onLoad((q:any)=>{ 
  logOnLoad('confirm', q);
  shopId.value=Number(q.shopId); 
  tableNo.value=q.table||''; 
  const t = Number(q.type); orderType.value = (t===3?3:2); 
  if(q.pc){ const pc = Number(q.pc); if(pc>0 && pc<100) peopleCount.value = pc; }
  parseItems(q.items); 
});
function parseItems(str:string){ if(!str) return; cart.value = str.split(',').map(s=>{ const [id,q] = s.split(':'); return { id:Number(id), name:`商品${id}`, quantity:Number(q), price:10 }; }); }
async function submit(){
  if(!shopId.value) return;
  submitting.value = true;
  try{
    const idem = Date.now().toString()+Math.random();
    const payload = { orderType: orderType.value, tableNo: tableNo.value, peopleCount: peopleCount.value, remark: remark.value, items: cart.value.map(c=>({ productId:c.id, quantity:c.quantity })) };
    console.log('[DINE][confirm] submit payload=', payload, 'shopId=', shopId.value);
    const res = await dineCreate(payload, shopId.value, idem);
    uni.redirectTo({ url:`/pages/dine/progress?orderId=${res.data.orderId}` });
  } finally { submitting.value = false; }
}
function logOnLoad(tag:string, q:any){
  try {
    const pages = getCurrentPages();
    const cur:any = pages[pages.length-1];
    const route = cur?.route || cur?.__route__ || '';
    const fullPath = cur?.$page?.fullPath || '';
    console.log(`[DINE][${tag}] onLoad route="${route}" fullPath="${fullPath}" query=`, q);
  } catch(e){
    console.log(`[DINE][${tag}] onLoad (no pages API) query=`, q);
  }
}
</script>
<style scoped>.page{padding:24rpx}</style>
