<template>
  <view>
    <tig-navbar :title="navTitle" :show-left="false" />
    <view class="scroll-box">
      <view class="content-box">
  <view class="side"><menuBox :current-cate-id="currentCateId" @update:current-cate-id="val=> (currentCateId=val, handleChange())" @change="reset" /></view>
        <view class="list-box">
          <selectCate :menu-list="menuList" :sub-current-cate-id="subCurrentCateId" type="main" :current-cate-id="currentCateId" @update:sub-current-cate-id="val=> (subCurrentCateId=val, handleChange())" @change="handleChange" />
          <view class="list-content">
            <template v-if="!isLoading && total > 0">
              <scroll-view :scroll-y="true" class="list-scroll" @scrolltolower="reachBottom">
                <view class="product-list">
                  <view v-for="item in list" :key="item.productId" class="product-item">
                    <view class="item-left" @click="emitDetail(Number(item.productId || 0))">
                      <tig-lazy-image :src="item.picThumb" />
                      <template v-if="item.productStock == 0 || item.productStatus == 0">
                        <view class="product-status-box"><view class="outsale">{{ $t(item.productStock == 0 ? '已售罄' : '已下架') }}</view></view>
                      </template>
                    </view>
                    <view class="item-right">
                      <view class="item-right-title line2" @click="emitDetail(Number(item.productId || 0))">{{ item.productName }}</view>
                      <view class="item-right-price">
                        <format-price :decimals-style="{ fontSize:'24rpx', fontWeight:'bold' }" :currency-style="{ fontSize:'23rpx', fontWeight:'bold' }" :font-style="{ fontSize:'32rpx' }" :price-data="item.productPrice" />
                      </view>
                      <view class="buy_icon">
                        <view class="buy_btn" @click="emitBuy(item)">
                          <text class="iconfont-h5 icon-gouwuche3 buy_btn_icon" />
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </scroll-view>
            </template>
            <template v-if="!isLoading && total === 0">
              <view class="empty-box"><up-empty :icon="staticResource('salesman/no_order.png')" :text="$t('暂无数据')" /></view>
            </template>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import menuBox from '@/pages/dine/styles/src/menu.vue';
import selectCate from '@/pages/dine/styles/src/selectCate.vue';
import { getCateProduct } from '@/api/home/home';
import type { GetProductFilterResult } from '@/types/home/home';
import { useList } from '@/hooks';
import { staticResource } from '@/utils';
import type { filterSeleted } from '@/types/productCate/productCate';

const props = defineProps<{ height?:string|number; shopId?:number; tableNo?:string }>();
const emit = defineEmits<{ (e:'buy', item:any):void; (e:'detail', id:number):void }>();
const currentCateId = ref(0);
const subCurrentCateId = ref(0);
const menuList = ref<filterSeleted[]>([]);
// 传递 useShopCategory=1 以指示后端使用 shop_category_id 过滤
const params = reactive({ categoryId:0, page:1, size:10, shopId: props.shopId, useShopCategory:1 });
const { data:list, getList, reachBottom, isLoading, total } = useList<GetProductFilterResult>(getCateProduct, { params, path:{ dataKey:'records' }, needReachBottom:false });

function handleChange(){ list.value = []; params.page=1; params.categoryId = subCurrentCateId.value===0? currentCateId.value : subCurrentCateId.value; getList(); }
function reset(){ subCurrentCateId.value=0; list.value=[]; menuList.value=[]; params.page=1; }
function emitBuy(item:any){ emit('buy', item); }
function emitDetail(id:number){ emit('detail', id); }

const height = computed(()=> `calc(${props.height || '100vh'} - 90rpx)`);
watch(()=> props.shopId, (v)=> { if(v){ params.shopId = v; handleChange(); } });
const navTitle = computed(()=> props.tableNo ? `${props.tableNo}` : '点餐菜单');
</script>
<style>
page { background-color:#fff !important; }
</style>
<style lang="scss" scoped>
.scroll-box { height: v-bind('height'); overflow:hidden; }
.content-box { height:100%; width:100%; display:flex; }
.side { width:90px; height:100%; background-color:#f7f7f7; }
.list-box { width:calc(100% - 90px); height:100%; }
.list-content { height:calc(100% - 100rpx); }
.list-scroll { height:100%; }
.empty-box { display:flex; align-items:center; justify-content:center; height:100%; width:100%; }
.product-list { padding:25rpx; background-color:#fff; }
.product-item { display:flex; padding:20rpx 0; }
.item-left { width:171rpx; height:171rpx; border-radius:10rpx; overflow:hidden; position:relative; }
.item-right { width:calc(100% - 171rpx); padding-left:10rpx; display:flex; flex-direction:column; justify-content:space-between; position:relative; }
.item-right-title { font-size:24rpx; font-weight:bold; color:#2a3145; }
.item-right-price { color:var(--general); font-weight:600; }
.buy_icon { position:absolute; right:0; bottom:0; color:var(--general); }
.buy_btn_icon { font-size:40rpx; }
</style>
