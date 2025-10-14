<template>
  <view class="page">
    <view>订单进度 - #{{ orderId }}</view>
    <view v-if="detail">状态: {{ detail.serviceState }} 取餐号: {{ detail.pickupNo }} 桌号: {{ detail.tableNo||'-' }}</view>
    <view v-for="it in detail?.items || []" :key="it.productId">{{ it.name }} x {{ it.quantity }}</view>
    <button @click="toQueue">查看队列</button>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { dineDetail } from '../../api/dine';
import useDineSocket from '../../hooks/useDineSocket';
const orderId = ref<number>();
const detail = ref<any|null>(null);
onLoad(async (q:any)=>{ orderId.value=Number(q.orderId); await load(); useDineSocket(); });
async function load(){ if(orderId.value) detail.value = await dineDetail(orderId.value); }
function toQueue(){ uni.navigateTo({ url:'/pages/dine/queue' }); }
</script>
<style scoped>.page{padding:24rpx}</style>
