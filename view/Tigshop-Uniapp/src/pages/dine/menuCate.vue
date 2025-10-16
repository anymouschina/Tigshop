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
        <styleTwoCate :height="cateHeight" :shop-id="shopId" :table-no="tableNo"  @select-product="refreshCart"/>
      </template>
      <template v-if="decorateType === '3'">
        <styleThreeCate :height="cateHeight" :shop-id="shopId" :table-no="tableNo" />
      </template>
      <!-- 底部购物车条组件 -->
      <DineCartBar :count="cartCount" :amount="totalAmount" @confirm="toConfirm" @showCart="showPopup=true" />
      <DineCartPopup
        :show="showPopup"
        :items="cart"
        @update:show="v=>{ showPopup=v;refreshCart(); }"
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
// 后端购物车行映射：仅保留下单所需字段；qty=quantity, price(分) 统一转 number
interface CartLine { cartId:number; productId:number; qty:number; price:number; productName?:string; picThumb?:string; skuId?:number }
const cart = ref<CartLine[]>([]);
const showPopup = ref(false);
// 统计全部已加入购物车的商品（扫码点餐无勾选功能）
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
  if(!cart.value.length) return;
  const items = cart.value.map(i=>`${i.productId}:${i.qty}`).join(',');
  uni.navigateTo({ url:`/pages/dine/confirm?shopId=${shopId.value}&table=${tableNo.value}&type=${orderType.value}&pc=${peopleCount.value}&items=${items}` });
  // 关闭弹窗并刷新购物车最新数据（可能后端有促销/金额变化）
  showPopup.value = false;
  refreshCart();
}

// 商品选择（来自子组件）
// ===== 购物车接口集成 =====
// 若构建未配置 @ 别名，这里使用相对路径（本文件位于 pages/dine/）
import { getCart, updateCartItemData, clearCart as apiClearCart, removeCartItemData } from '../../api/cart/cart';
import { addToCart } from '../../api/product/product';

async function refreshCart(){
  try {
    const res:any = await getCart();
    // 结构: { data: { cartList: [...], total: {...} }, code }
    const list = res?.data?.cartList || res?.cartList || [];
    const lines:CartLine[] = [];
    list.forEach((blk:any)=>{
      if(shopId.value && blk.shopId !== shopId.value) return; // 仅当前店铺
      (blk.carts||[]).forEach((c:any)=>{
        lines.push({
          cartId:c.cartId,
          productId:c.productId,
          qty:c.quantity,
          price:Number(c.price)||Number(c.originalPrice)||0,
          productName:c.productName,
          picThumb:c.picThumb,
          skuId:c.skuId
        });
      });
    });
    cart.value = lines;
  } catch(e){ console.warn('[DINE] getCart failed', e); }
}

// 商品选择：此处不直接加本地，而是触发规格/数量确认弹窗（后续接入）。当前先直接加 1 件默认 SKU。
async function handleProductSelect(p:any){
  const pid = p.productId || p.id; if(!pid) return;
  // 规格二次确认 TODO: 调起规格组件，拿到 skuId 与 quantity
  try {
    await addToCart({ productId: pid, quantity:1, skuId: p.skuId, shopId: shopId.value });
    await refreshCart();
    showPopup.value = true; // 新增后弹出购物车
  } catch(e){ uni.showToast({ title:'加入购物车失败', icon:'none' }); console.error(e); }
}

// 加数量改用 addToCart，保持与后端“加购”语义一致（后端一般做累加）
async function inc(id:number){
  const line = cart.value.find(l=> l.productId===id);
  if(!line) return;
  try {
    await addToCart({ productId: id, quantity:1, skuId: line.skuId, shopId: shopId.value });
    await refreshCart();
  } catch(e){
    uni.showToast({ title:'加购失败', icon:'none' });
    console.error(e);
  }
}
async function dec(id:number){
  const line = cart.value.find(l=> l.productId===id); if(!line) return;
  const newQty = line.qty - 1;
  if(newQty<=0){
    try { await removeCartItemData({ cartIds:[line.cartId] }); cart.value = cart.value.filter(l=> l.cartId!==line.cartId); }
    catch(e){ await refreshCart(); }
  } else {
    try { await updateCartItemData({ cartId: line.cartId, data:{ quantity:newQty } }); line.qty = newQty; }
    catch(e){ await refreshCart(); }
  }
}
async function removeLine(id:number){
  const line = cart.value.find(l=> l.productId===id); if(!line) return;
  try { await removeCartItemData({ cartIds:[line.cartId] }); cart.value = cart.value.filter(l=> l.cartId!==line.cartId); }
  catch(e){ await refreshCart(); }
}
async function clearCart(){
  try { await apiClearCart(); cart.value = []; }
  catch(e){ await refreshCart(); }
}
// 勾选功能在扫码点餐场景不需要，已移除

// 页面进入后首次同步购物车
refreshCart();

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
