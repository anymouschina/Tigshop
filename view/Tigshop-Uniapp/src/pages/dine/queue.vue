<template>
  <view class="page">
    <view class="title">当前叫号队列</view>
    <view v-for="q in queue" :key="q.orderId" class="row" @click="open(q)">#{{ q.pickupNo }} {{ q.tableNo||'-' }} {{ q.serviceState }}</view>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { dineQueue } from '../../api/dine';
import dineStore from '../../store/dine';
import useDineSocket from '../../hooks/useDineSocket';
import dayjs from 'dayjs';
const queue = ref<any[]>([]);
const shopId = ref<number>(0); // TODO: 根据定位/选择
onLoad(async ()=>{ shopId.value = Number(uni.getStorageSync('shopId'))||0; await load(); useDineSocket(shopId.value); });
async function load(){ if(!shopId.value) return; const day = Number(dayjs().format('YYYYMMDD')); const res = await dineQueue(shopId.value, day); queue.value = res.records; dineStore.state.queue = res.records; }
function open(q:any){ uni.navigateTo({ url:`/pages/dine/progress?orderId=${q.orderId}` }); }
</script>
<style scoped>.page{padding:24rpx}.row{padding:12rpx;border-bottom:1px solid #eee}</style>
