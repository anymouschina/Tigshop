<template>
  <view class="page">
    <view>扫码进入堂食/外带</view>
    <button @click="goMenu">开始点单</button>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
const shopId = ref<number>();
const tableNo = ref<string>('');
const orderType = ref<2|3>(2);
onLoad((q:any)=>{
  if(q.shopId) shopId.value = Number(q.shopId);
  if(q.table) tableNo.value = q.table;
  if(q.type) orderType.value = Number(q.type) as any;
});
function goMenu(){
  uni.navigateTo({ url: `/pages/dine/menu?shopId=${shopId.value||''}&table=${tableNo.value||''}&type=${orderType.value}` });
}
</script>
<style scoped>.page{padding:24rpx;}</style>
