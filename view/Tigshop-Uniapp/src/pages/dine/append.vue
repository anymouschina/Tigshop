<template>
  <view class="page">
    <view>加单 - 主单 {{ rootOrderId }}</view>
    <view v-for="p in products" :key="p.id" class="prod" @click="add(p)">{{ p.name }} - {{ p.price }}</view>
    <button @click="submit" :disabled="!cart.length">提交加单</button>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { dineAppend } from '../../api/dine';
const rootOrderId = ref<number>();
const products = ref<any[]>([]);
const cart = ref<any[]>([]);
onLoad((q:any)=>{ rootOrderId.value = Number(q.rootOrderId); mock(); });
function mock(){ products.value=[{id:1,name:'测试商品1',price:10},{id:2,name:'测试商品2',price:20}]; }
function add(p:any){ const e = cart.value.find(c=>c.id===p.id); if(e) e.quantity++; else cart.value.push({...p,quantity:1}); }
async function submit(){ if(!rootOrderId.value) return; const idem = Date.now().toString(); await dineAppend(rootOrderId.value, cart.value.map(c=>({productId:c.id, quantity:c.quantity})), idem); uni.navigateBack(); }
</script>
<style scoped>.page{padding:24rpx}.prod{padding:12rpx;border-bottom:1px solid #eee}</style>
