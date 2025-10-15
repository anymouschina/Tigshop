<template>
  <view class="dine-cart-footer">
    <view class="left" @click.stop="emit('showCart')">
      <view class="icon-wrapper">
        <view class="icon">🛒</view>
        <view v-if="count>0" class="badge">{{ count }}</view>
      </view>
      <view class="amount">¥ {{ amount }}</view>
    </view>
    <button class="confirm" :disabled="count===0" @click="emit('confirm')">选好了</button>
  </view>
</template>
<script setup lang="ts">
interface Props { count:number; amount:string|number }
// count/amount 仅用于显示，不在内部变更
defineProps<Props>();
// 明确声明组件名称，利于调试 & 消除某些默认导出提示
defineOptions({ name: 'DineCartBar' });
const emit = defineEmits<{(e:'confirm'):void;(e:'showCart'):void}>();
</script>
<style scoped lang="scss">
.dine-cart-footer { position:fixed; left:0; right:0; bottom:0; background:#fff; display:flex; align-items:center; justify-content:space-between; padding:0 32rpx  env(safe-area-inset-bottom); padding-bottom: calc( env(safe-area-inset-bottom) + 0rpx); box-shadow:0 -4rpx 20rpx rgba(0,0,0,0.06); z-index:50; }
.left { display:flex; align-items:center; gap:28rpx; font-size:28rpx; color:#333; font-weight:500; }
.icon-wrapper { position:relative; }
.icon { width:92rpx; height:92rpx; background:#18b5b5; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:42rpx; box-shadow:0 8rpx 20rpx rgba(24,181,181,0.35); }
.badge { position:absolute; top:-10rpx; right:-10rpx; min-width:40rpx; padding:4rpx 10rpx; background:#ff4d4f; color:#fff; font-size:22rpx; line-height:1.1; border-radius:28rpx; text-align:center; font-weight:600; }
.amount { font-size:34rpx; font-weight:600; color:#ff5a00; }
.confirm { background:#18b5b5; color:#fff; font-size:30rpx; font-weight:600; padding:0 52rpx; height:80rpx; line-height:80rpx; border:none; border-radius:54rpx; box-shadow:0 6rpx 16rpx rgba(24,181,181,0.35); }
.confirm:disabled { background:#ccc; box-shadow:none; }
</style>
