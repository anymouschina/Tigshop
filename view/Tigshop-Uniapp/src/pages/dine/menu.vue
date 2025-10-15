<template>
  <tig-layout title="点餐菜单">
    <view class="menu-wrapper">
      <scroll-view scroll-y class="product-scroll">
        <view v-if="loading" class="loading">加载中...</view>
        <view v-else-if="!products.length" class="empty">暂无商品</view>
        <view v-else>
          <view v-for="p in products" :key="p.productId" class="prod">
            <image class="pic" mode="aspectFill" :src="imageFormat(p.picUrl||'')" @click="preview(p.picUrl)" />
            <view class="meta" @click="add(p)">
              <view class="name line2">{{ p.productName }}</view>
              <view class="price">¥ {{ displayPrice(p) }}</view>
              <view class="ops">
                <button class="add" @click.stop="add(p)">加入</button>
                <view v-if="qty(p.productId) > 0" class="qty-box">
                  <button class="dec" @click.stop="dec(p.productId)">-</button>
                  <text class="q">{{ qty(p.productId) }}</text>
                  <button class="inc" @click.stop="add(p)">+</button>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <DineCartBar :count="totalCount" :amount="totalAmount" @confirm="toConfirm" />
    </view>
  </tig-layout>
</template>
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
// @ts-ignore 新建组件默认导出
import DineCartBar from './components/DineCartBar.vue';

// @ts-ignore 别名在构建配置里存在
import { imageFormat } from '@/utils/format';
// @ts-ignore 同上
import request from '@/utils/request';

interface ProductBrief { productId:number; productName:string; salePrice:number; minPrice?:number; picUrl?:string }
interface CartItem { productId:number; productName:string; price:number; quantity:number }

const shopId = ref<number>();
const tableNo = ref('');
const orderType = ref<2|3>(2);
const loading = ref(false);
const peopleCount = ref<number>(1);
const products = ref<ProductBrief[]>([]);
const cart = ref<CartItem[]>([]);

onLoad((q:any)=>{ 
  logOnLoad('menu', q);
  shopId.value=Number(q.shopId); 
  tableNo.value=q.table||''; 
  const t = Number(q.type); 
  orderType.value = (t===3?3:2); 
  if(q.pc){ const pc = Number(q.pc); if(pc>0 && pc<100) peopleCount.value = pc; }
  fetchProducts();
});

async function fetchProducts(){
  if(!shopId.value){ return; }
  loading.value = true;
  try {
    // 直接调用公开商品列表接口，可根据需要增加分类/分页
  // 注意：request 会自动在前面拼接 VITE_API_PREFIX (默认 /api/)，这里不要再写前缀，防止出现 /api/api/...
  const res:any = await request({ url:'product/product/list', method:'GET', params:{ shopId: shopId.value, page:1, size:50 } });
    const list = res?.data?.records || res?.records || res?.data || [];
    products.value = list.map((p:any)=>({
      productId: p.productId || p.id,
      productName: p.productName || p.name,
      salePrice: p.salePrice || p.price || 0,
      minPrice: p.minPrice,
      picUrl: p.picUrl || p.pic
    }));
  } finally { loading.value=false; }
}

function qty(id:number){ return cart.value.find(c=>c.productId===id)?.quantity || 0; }
function add(p:ProductBrief){
  let item = cart.value.find(c=>c.productId===p.productId);
  if(!item){ item = { productId: p.productId, productName: p.productName, price: p.minPrice||p.salePrice, quantity:0 }; cart.value.push(item); }
  item.quantity++;
}
function dec(id:number){ const idx = cart.value.findIndex(c=>c.productId===id); if(idx>-1){ const it = cart.value[idx]; it.quantity--; if(it.quantity<=0){ cart.value.splice(idx,1); } } }
const totalCount = computed(()=> cart.value.reduce((s,i)=> s+i.quantity,0));
const totalAmount = computed(()=> priceFormat(cart.value.reduce((s,i)=> s + i.price*i.quantity,0)) );
function priceFormat(v: number) { return (v / 100).toFixed(2); }
function displayPrice(p: ProductBrief) { return priceFormat((p.minPrice || p.salePrice || 0)); }

function toConfirm(){
  const items = cart.value.map(c=> `${c.productId}:${c.quantity}`).join(',');
  uni.navigateTo({ url:`/pages/dine/confirm?shopId=${shopId.value}&table=${tableNo.value}&type=${orderType.value}&pc=${peopleCount.value}&items=${items}` });
}
function preview(url?:string){ if(!url) return; uni.previewImage({ urls:[imageFormat(url)] }); }
function logOnLoad(tag:string, q:any){
  try {
    const pages = getCurrentPages();
    const cur:any = pages[pages.length-1];
    const route = cur?.route || cur?.__route__ || '';
    const fullPath = cur?.$page?.fullPath || '';
    console.log(`[DINE][${tag}] onLoad route="${route}" fullPath="${fullPath}" query=`, q);
  } catch(e){
    console.log(`[DINE][${tag}] onLoad (no pages API) query=`, q);
  }
}
</script>
<style scoped lang="scss">
.menu-wrapper { display:flex; flex-direction:column; height:100vh; }
.product-scroll { flex:1; }
.loading, .empty { padding:60rpx; text-align:center; color:#888; }
.prod { display:flex; padding:24rpx 24rpx 24rpx 16rpx; border-bottom:1px solid #f2f2f2; background:#fff; }
.pic { width:140rpx; height:140rpx; border-radius:16rpx; margin-right:20rpx; background:#f6f6f6; }
.meta { flex:1; display:flex; flex-direction:column; }
.name { font-size:30rpx; color:#333; font-weight:500; }
.price { margin-top:12rpx; font-size:28rpx; color:#ff5a00; font-weight:600; }
.ops { margin-top:auto; display:flex; align-items:center; gap:20rpx; }
.add { background:var(--general,#ff5a00); color:#fff; font-size:26rpx; padding:12rpx 32rpx; line-height:1; border-radius:40rpx; border:none; }
.qty-box { display:flex; align-items:center; gap:12rpx; }
.qty-box button { width:56rpx; height:56rpx; text-align:center; line-height:56rpx; border-radius:50%; background:#f6f6f6; border:none; font-size:36rpx; }
.qty-box .q { min-width:40rpx; text-align:center; font-size:28rpx; }
/* 旧 .cart-bar 样式移除，使用统一 DineCartBar 组件 */
</style>
