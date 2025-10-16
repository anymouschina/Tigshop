<template>
  <tig-popup :show="innerShow" @update:show="val=> innerShow = val" position="bottom" :round="24" :z-index="999" :show-close="false" background-color="#fff" @close="handleClose">
    <view class="cart-panel">
      <view class="panel-header">
        <view class="title">已选商品</view>
        <view class="actions">
          <view v-if="items.length" class="clear" @click="emit('clear')">
            <text class="iconfont-h5 icon-shanchu" /> 清空
          </view>
        </view>
      </view>
      <scroll-view scroll-y class="panel-body">
        <view v-for="it in items" :key="it.productId" class="line">
          <image class="pic" mode="aspectFill" :src="it.pic || it.picUrl || it.picThumb || ''" />
          <view class="info">
            <view class="name line1">{{ it.productName || it.name }}</view>
            <view class="attr" v-if="it.skuDesc">{{ it.skuDesc }}</view>
            <view class="price">¥ {{ formatPrice(it.price) }}</view>
          </view>
          <view class="qty-box">
            <button class="btn minus" @click="dec(it.productId)" :disabled="it.qty<=1">-</button>
            <text class="q">{{ it.qty }}</text>
            <button class="btn plus" @click="inc(it.productId)">+</button>
          </view>
          <view class="del" @click="remove(it.productId)"><text class="iconfont-h5 icon-shanchu" /></view>
        </view>
        <view v-if="!items.length" class="empty">暂无已选商品</view>
      </scroll-view>
      <view class="panel-footer">
        <view class="summary">
          <image class="avatar" :src="avatarImg" mode="aspectFit" />
          <view class="badge" v-if="totalCount>0">{{ totalCount }}</view>
          <view class="amt">¥ {{ totalAmount }}</view>
        </view>
        <button class="confirm" :disabled="!items.length" @click="emit('confirm')">选好了</button>
      </view>
    </view>
  </tig-popup>
</template>
<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue';
interface CartLine { productId:number; price:number; qty:number; productName?:string; pic?:string; picUrl?:string; picThumb?:string; }
// 使用 defineModel 使父组件可直接 v-model:show
const innerShow = defineModel<boolean>('show', { default:false });
const props = defineProps<{ items:CartLine[]; divider?:number }>();
const emit = defineEmits<{ (e:'inc',id:number):void; (e:'dec',id:number):void; (e:'remove',id:number):void; (e:'clear'):void; (e:'confirm'):void }>();
const divider = computed(()=> props.divider || 100);
const totalCount = computed(()=> props.items.reduce((s,i)=> s+i.qty,0));
const totalAmount = computed(()=> (props.items.reduce((s,i)=> s+i.price*i.qty,0)/divider.value).toFixed(2));
function inc(id:number){ emit('inc', id); }
function dec(id:number){ emit('dec', id); }
function remove(id:number){ emit('remove', id); }
function formatPrice(p:number){ return (p/divider.value).toFixed(2); }
function handleClose(){ /* 关闭回调：无需额外处理，v-model 已更新 */ }
const avatarImg = 'https://img.js.design/assets/img/670e0e7e36544e7fd0426ff9.png';
</script>
<style scoped lang="scss">
.cart-panel { width:100%; max-height:70vh; display:flex; flex-direction:column; }
.panel-header { display:flex; align-items:center; justify-content:space-between; padding:24rpx 32rpx; font-size:28rpx; border-bottom:1px solid #f1f1f1; }
.title { font-weight:600; font-size:30rpx; }
.actions { color:#999; font-size:26rpx; }
.actions .clear { display:flex; align-items:center; gap:6rpx; }
.panel-body { flex:1; }
.line { display:flex; align-items:center; padding:24rpx 32rpx; position:relative; }
.line + .line { border-top:1px solid #f5f5f5; }
.check { width:40rpx; height:40rpx; border:2rpx solid #ccc; border-radius:50%; margin-right:20rpx; box-sizing:border-box; position:relative; }
.check.on { background:#18b5b5; border-color:#18b5b5; }
.check.on:after { content:""; position:absolute; left:11rpx; top:6rpx; width:12rpx; height:20rpx; border:4rpx solid #fff; border-top:none; border-left:none; transform:rotate(45deg); }
.pic { width:120rpx; height:120rpx; border-radius:16rpx; background:#f6f6f6; margin-right:24rpx; }
.info { flex:1; display:flex; flex-direction:column; }
.name { font-size:28rpx; color:#222; font-weight:500; margin-bottom:8rpx; }
.attr { font-size:22rpx; color:#999; margin-bottom:8rpx; }
.price { font-size:30rpx; font-weight:600; color:#ff5a00; }
.qty-box { display:flex; align-items:center; gap:16rpx; margin-left:24rpx; }
.btn { width:56rpx; height:56rpx; line-height:56rpx; text-align:center; border-radius:50%; background:#18b5b5; color:#fff; border:none; font-size:36rpx; }
.btn:disabled { opacity:.4; }
.q { min-width:40rpx; text-align:center; font-size:28rpx; }
.del { margin-left:12rpx; color:#bbb; font-size:36rpx; padding:10rpx; }
.empty { padding:80rpx 40rpx; text-align:center; color:#999; }
.panel-footer { display:flex; align-items:center; justify-content:space-between; padding:20rpx 32rpx calc(env(safe-area-inset-bottom) + 20rpx); border-top:1px solid #f1f1f1; }
.summary { position:relative; display:flex; align-items:center; gap:16rpx; }
.avatar { width:80rpx; height:80rpx; border-radius:50%; background:#f6f6f6; }
.badge { position:absolute; left:60rpx; top:-10rpx; min-width:36rpx; padding:4rpx 8rpx; background:#ff4d4f; color:#fff; font-size:22rpx; border-radius:28rpx; text-align:center; font-weight:600; }
.amt { font-size:36rpx; font-weight:600; color:#ff5a00; }
.confirm { background:#18b5b5; color:#fff; font-size:30rpx; font-weight:600; padding:0 52rpx; height:80rpx; line-height:80rpx; border:none; border-radius:54rpx; box-shadow:0 6rpx 16rpx rgba(24,181,181,0.35); }
.confirm:disabled { background:#ccc; box-shadow:none; }
</style>
