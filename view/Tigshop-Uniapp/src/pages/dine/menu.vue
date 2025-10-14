<template>
  <view class="page">
    <view class="products">
      <view v-for="p in products" :key="p.id" class="prod" @click="add(p)">{{ p.name }} - {{ p.price }}</view>
    </view>
    <view class="cart">
      <view v-for="c in cart" :key="c.id">{{ c.name }} x {{ c.quantity }}</view>
      <button @click="toConfirm" :disabled="!cart.length">去确认</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
const shopId = ref<number>();
const tableNo = ref('');
const orderType = ref<2|3>(2);
const products = ref<any[]>([]); // TODO: 接入商品 API
const cart = ref<any[]>([]);
onLoad((q:any)=>{ shopId.value=Number(q.shopId); tableNo.value=q.table||''; const t = Number(q.type); orderType.value = (t===3?3:2); mock(); });
function mock(){ products.value=[{id:1,name:'测试商品1',price:10},{id:2,name:'测试商品2',price:20}]; }
function add(p:any){ const exist = cart.value.find(c=>c.id===p.id); if(exist) exist.quantity++; else cart.value.push({...p, quantity:1}); }
function toConfirm(){
  const items = cart.value.map(c=> `${c.id}:${c.quantity}`).join(',');
  uni.navigateTo({ url:`/pages/dine/confirm?shopId=${shopId.value}&table=${tableNo.value}&type=${orderType.value}&items=${items}` });
}
</script>
<style scoped>.page{padding:24rpx}.prod{padding:12rpx;border-bottom:1px solid #eee}</style>
