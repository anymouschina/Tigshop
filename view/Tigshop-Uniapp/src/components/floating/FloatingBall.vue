<template>
  <movable-area class="floating-area">
    <movable-view
      class="floating-ball"
      direction="all"
      :x="x"
      :y="y"
      :damping="100"
      :friction="20"
      inertia
      @change="onMoveChange"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <text class="iconfont-h5 icon-gengduo" />
    </movable-view>
  </movable-area>
  <tig-popup v-model:show="open" position="bottom" :round="24" :z-index="999" background-color="#fff">
    <view class="panel">
      <view class="panel-header">快捷入口</view>
      <view class="list">
        <view class="list-item" @click="goDine">
          <view class="icon"><text class="iconfont-h5 icon-gouwuche3" /></view>
          <view class="title">门店点餐</view>
          <view class="arrow"><text class="iconfont-h5 icon-youjiantou" /></view>
        </view>
      </view>
    </view>
  </tig-popup>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const open = ref(false);
const x = ref(0);
const y = ref(0);
const startX = ref(0);
const startY = ref(0);
const moved = ref(false);
const STORAGE_KEY = 'floatingBallPos';

// 屏幕与安全区信息
let winW = 375;
let winH = 667;
let safeTop = 0;
let safeBottom = 0;
const marginRpx = 12; // 吸边边距（设计稿单位）
let margin = 10; // px，mounted 时用 rpx->px 覆盖
let ballWH = 60; // px (会在 mounted 用 rpx 转 px 覆盖)

function rpx2px(rpx:number){ return (winW / 750) * rpx; }

onMounted(()=>{
  try {
    const info:any = uni.getSystemInfoSync();
    winW = info.windowWidth || winW;
    winH = info.windowHeight || winH;
    // 兼容不同端的安全区字段
    if (info.safeAreaInsets) {
      safeTop = Number(info.safeAreaInsets.top || 0);
      safeBottom = Number(info.safeAreaInsets.bottom || 0);
    } else if (info.safeArea) {
      safeTop = Number(info.safeArea.top || 0);
      safeBottom = Math.max(0, winH - Number(info.safeArea.bottom || winH));
    }
    ballWH = Math.max(40, Math.round(rpx2px(96))); // 与样式保持一致
    margin = Math.max(0, Math.round(rpx2px(marginRpx))); // 吸边 24rpx

    const saved = uni.getStorageSync(STORAGE_KEY);
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
      x.value = clampX(saved.x);
      y.value = clampY(saved.y);
    } else {
      // 初始位置：屏幕右侧中间
      x.value = clampX(winW  - margin);
      y.value = clampY(Math.round((winH - ballWH) / 2));
    }
  } catch(e) {
    // 兜底：居右中
    x.value = 280; y.value = 480;
  }
});

function clampX(val:number){
  return Math.min(Math.max(margin, val), Math.max(margin, winW - ballWH - margin));
}
function clampY(val:number){
  const top = Math.max(margin, safeTop + margin);
  const bottom = Math.max(margin, safeBottom + margin);
  return Math.min(Math.max(top, val), Math.max(top, winH - ballWH - bottom));
}

function onMoveChange(e:any){
  if (e?.detail) {
    moved.value = true;
    x.value = e.detail.x;
    y.value = e.detail.y;
  }
}
function onTouchStart(){
  moved.value = false;
  startX.value = x.value;
  startY.value = y.value;
}
function onTouchEnd(){
  const dx = Math.abs((x.value||0) - (startX.value||0));
  const dy = Math.abs((y.value||0) - (startY.value||0));
  const isTap = !moved.value && dx < 2 && dy < 2;
  if (isTap) {
    open.value = true;
    return;
  }
  // 吸边与范围限制
  const toRight = (x.value + ballWH/2) >= (winW/2);
  const targetX = toRight ? (winW - ballWH - margin) : margin;
  x.value = clampX(targetX);
  y.value = clampY(y.value);
  uni.setStorage({ key: STORAGE_KEY, data: { x: x.value, y: y.value } });
}

function goDine(){
  open.value = false;
  uni.navigateTo({ url: '/pages/dine/index?scene=t%3DST51F61E3' });
}
</script>

<style scoped lang="scss">
.floating-area { position: fixed; left:0; top:0; width: 100vw; height: 100vh; z-index: 998; pointer-events: none; }
.floating-ball { pointer-events: auto; width: 96rpx; height: 96rpx; border-radius: 50%; background: #18b5b5; color:#fff; display:flex; align-items:center; justify-content:center; box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.15); }
.floating-ball .icon-gengduo { font-size: 44rpx; }

.panel { padding: 16rpx 20rpx 30rpx; max-height: 50vh; }
.panel-header { font-size: 28rpx; color:#333; padding: 12rpx 6rpx; }
.list { display: flex; flex-direction: column; }
.list-item {
  display: flex; align-items: center; padding: 20rpx 10rpx; border-bottom: 1px solid #f0f0f0;
  .icon { width: 64rpx; display:flex; align-items:center; justify-content:center; color:#18b5b5; }
  .icon .icon-gouwuche3 { font-size: 40rpx; }
  .title { flex: 1; font-size: 28rpx; color:#222; }
  .arrow { color:#bbb; }
}
</style>
