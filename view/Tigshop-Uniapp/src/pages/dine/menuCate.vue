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
        <styleTwoCate :height="cateHeight" :shop-id="shopId" :table-no="tableNo" @select-product="handleProductSelect" />
      </template>
      <template v-if="decorateType === '3'">
        <styleThreeCate :height="cateHeight" :shop-id="shopId" :table-no="tableNo" />
      </template>
      <!-- 底部购物车条组件 -->
      <DineCartBar :count="cartCount" :amount="totalAmount" @confirm="toConfirm" @showCart="showPopup=true" />
      <DineCartPopup
        :show="showPopup"
        :items="cart"
        @update:show="v=>showPopup=v"
        @inc="inc"
        @dec="dec"
        @remove="removeLine"
        @clear="clearCart"
        @confirm="toConfirm"
      />
    </template>
  </tig-layout>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 使用默认导入保证 Vue 正确识别组件（script setup 会自动注册）
// @ts-ignore 这些旧组件未显式 export default，通过 SFC 编译仍可使用
import styleOneCate from './styles/styleOneCate.vue';
// @ts-ignore
import styleTwoCate from './styles/styleTwoCate.vue';
// @ts-ignore
import styleThreeCate from './styles/styleThreeCate.vue';
// @ts-ignore script setup 默认导出
import DineCartBar from './components/DineCartBar.vue';
// @ts-ignore script setup 默认导出
import DineCartPopup from './components/DineCartPopup.vue';
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
interface CartLine { productId:number; qty:number; price:number; productName?:string; pic?:string; picUrl?:string; picThumb?:string }
const cart = ref<CartLine[]>([]);
const showPopup = ref(false);
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
  if(cartCount.value===0) return;
  const items = cart.value.map(i=>`${i.productId}:${i.qty}`).join(',');
  uni.navigateTo({ url:`/pages/dine/confirm?shopId=${shopId.value}&table=${tableNo.value}&type=${orderType.value}&pc=${peopleCount.value}&items=${items}` });
}

// 商品选择（来自子组件）
function handleProductSelect(p:any){
  const pid = p.productId || p.id;
  if(!pid) return;
  const price = p.price || p.discountsPrice || p.salePrice || p.minPrice || 0;
  let line = cart.value.find(l=> l.productId===pid);
  if(!line){ line = { productId:pid, qty:0, price, productName:p.productName||p.name, pic:p.pic||p.picUrl||p.picThumb, picUrl:p.picUrl, picThumb:p.picThumb }; cart.value.push(line); }
  line.qty++;
}
function inc(id:number){ const line = cart.value.find(l=>l.productId===id); if(line){ line.qty++; } }
function dec(id:number){ const line = cart.value.find(l=>l.productId===id); if(line){ line.qty--; if(line.qty<=0){ cart.value = cart.value.filter(l=> l.productId!==id); } } }
function removeLine(id:number){ cart.value = cart.value.filter(l=> l.productId!==id); }
function clearCart(){ cart.value = []; }

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
/* 移除旧的 .dine-cart-bar 样式，底部由组件提供 */
</style>
