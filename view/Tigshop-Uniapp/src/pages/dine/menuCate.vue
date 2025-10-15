<template>
  <tig-layout>
    <template v-if="mode==='loading'">
      <view class="loading">加载中...</view>
    </template>
    <template v-else-if="mode==='error'">
      <view class="error">{{ errorMsg }}</view>
      <button class="retry" @click="init">重试</button>
    </template>
    <template v-else>
      <!-- 复用分类装修三种风格，按平台配置；增加 shopId 透传以便后续按店铺筛选/装修 -->
      <template v-if="decorateType === '1'">
        <styleOneCate :shop-id="shopId" :table-no="tableNo" />
      </template>
      <template v-if="decorateType === '2'">
        <styleTwoCate :height="cateHeight" :shop-id="shopId" :table-no="tableNo" />
      </template>
      <template v-if="decorateType === '3'">
        <styleThreeCate :height="cateHeight" :shop-id="shopId" :table-no="tableNo" />
      </template>
      <!-- 底部结算条（点餐购物车）-->
      <view class="dine-cart-bar" v-if="cartCount>0" @click="toConfirm">
        <view class="info">已选 {{ cartCount }} 件 - ¥ {{ totalAmount }}</view>
        <view class="go">去下单</view>
      </view>
    </template>
  </tig-layout>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 使用默认导入保证 Vue 正确识别组件（script setup 会自动注册）
import styleOneCate from './styles/styleOneCate.vue';
import styleTwoCate from './styles/styleTwoCate.vue';
import styleThreeCate from './styles/styleThreeCate.vue';
import { useConfigStore } from '../../store/config';
import { useTabbarStore } from '../../store/tabbar';

// 未来可替换为后端按店铺返回的分类装修配置
const configStore = useConfigStore();
const tabbarStore = useTabbarStore();

const mode = ref<'loading'|'ready'|'error'>('loading');
const errorMsg = ref('');
const shopId = ref<number>();
const tableNo = ref('');
const orderType = ref<2|3>(2);
const peopleCount = ref(1);
// 统一把装修类型转成字符串，容错后端可能返回 number
const decorateType = computed(()=> {
  const v = (configStore as any).categoryDecorateType;
  const res = v == null ? '2' : String(v);
  return (['1','2','3'].includes(res) ? res : '2');
});

// 简易本地购物车（后续可与全局共享或服务端同步）
const cart = ref<{productId:number; qty:number; price:number}[]>([]);
const cartCount = computed(()=> cart.value.reduce((s,i)=>s+i.qty,0));
const totalAmount = computed(()=> (cart.value.reduce((s,i)=> s + i.price*i.qty,0)/100).toFixed(2));

onLoad((q:any)=>{
  try { logOnLoad('menuCate', q); } catch(e){}
  console.log('[DINE][menuCate] decorateType resolved =', decorateType.value);
  shopId.value = Number(q.shopId)||0;
  tableNo.value = q.table||'';
  const t = Number(q.type); orderType.value = (t===3?3:2);
  if(q.pc){ const pc = Number(q.pc); if(pc>0 && pc<100) peopleCount.value = pc; }
  init();
});

function init(){
  if(!shopId.value){ mode.value='error'; errorMsg.value='缺少店铺ID'; return; }
  // 目前无需额外接口，直接进入 ready；后续可在此按 shopId 拉取分类装修配置 / 启用的风格等
  mode.value='ready';
}

function toConfirm(){
  const items = cart.value.map(i=>`${i.productId}:${i.qty}`).join(',');
  uni.navigateTo({ url:`/pages/dine/confirm?shopId=${shopId.value}&table=${tableNo.value}&type=${orderType.value}&pc=${peopleCount.value}&items=${items}` });
}

const cateHeight = computed(()=> {
  const screenH = (configStore as any).windowInfo?.screenHeight || 0;
  const hasTab = (tabbarStore as any).currentActiveValue > -1;
  return `calc(${screenH}px - var(${hasTab ? '--tabbar-height' : '--safe-bottom'}) - var(--nav-height))`;
});

function logOnLoad(tag:string,q:any){
  const pages = getCurrentPages();
  // @ts-ignore
  const cur:any = pages[pages.length-1];
  const route = cur?.route || cur?.__route__ || '';
  const fullPath = cur?.$page?.fullPath || '';
  console.log(`[DINE][${tag}] route="${route}" fullPath="${fullPath}" query=`, q);
}
</script>
<style scoped lang="scss">
.loading, .error { padding:80rpx; text-align:center; color:#888; }
.retry { margin-top:20rpx; background:#fff; border:1px solid #ddd; padding:16rpx 40rpx; border-radius:40rpx; }
.dine-cart-bar { position:fixed; left:0; right:0; bottom:0; background:#222; color:#fff; display:flex; justify-content:space-between; align-items:center; padding:20rpx 32rpx; font-size:28rpx; z-index:20; }
.dine-cart-bar .go { background:#ff6a00; padding:18rpx 42rpx; border-radius:50rpx; font-weight:600; }
</style>
