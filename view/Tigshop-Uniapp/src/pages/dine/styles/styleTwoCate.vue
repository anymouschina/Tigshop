<template>
  <view>
    <tig-navbar :title="navTitle" :show-left="true" />
    <view class="scroll-box">
      <view class="content-box">
        <view class="side">
          <menuBox :current-cate-id="currentCateId" @update:current-cate-id="val => (currentCateId = val, handleChange())" @change="handleMenuChange" />
        </view>
        <view class="list-box">
          <!-- <selectCate :menu-list="menuList" :sub-current-cate-id="subCurrentCateId" :current-cate-id="currentCateId" @update:sub-current-cate-id="val => (subCurrentCateId = val, handleChange())" @change="handleChange" /> -->
          <view class="list-content">
            <template v-if="!isLoading && total > 0">
              <scroll-view :scroll-y="true" class="list-scroll" @scrolltolower="reachBottom">
                <masonry :commodity-list="list" @callback="emitSelect" />
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
// @ts-nocheck
import { computed, reactive, ref, watch } from 'vue';
import menuBox from '@/pages/dine/styles/src/menu.vue';
import selectCate from '@/pages/dine/styles/src/selectCate.vue';
import masonry from '@/components/masonry/masonry.vue';
import { getCateProduct } from '@/api/home/home';
import { useList } from '@/hooks';
import { staticResource } from '@/utils';
import type { filterSeleted } from '@/types/productCate/productCate';
// 复用已创建的底部购物车条
// @ts-ignore 底部购物车条组件（script setup 默认导出）
// （点餐父页面集中管理购物车与弹窗）

const props = defineProps<{ height?: string | number; shopId?: number; tableNo?: string }>();
const emit = defineEmits<{ (e:'select-product', product:any):void }>();

const currentCateId = ref(0);
const subCurrentCateId = ref(0);
const menuList = ref<filterSeleted[]>([]);

// 添加 useShopCategory=1 让后端以 shop_category_id 过滤商品
const params = reactive({ categoryId: 0, page: 1, size: 10, shopId: props.shopId, useShopCategory: 1 });

const { data: list, getList, reachBottom, isLoading, total } = useList(getCateProduct, { params, path:{ dataKey:'records' }, needReachBottom:false });

const handleChange = () => {
  list.value = [];
  params.page = 1;
  params.categoryId = subCurrentCateId.value === 0 ? currentCateId.value : subCurrentCateId.value;
  getList();
};
const handleMenuChange = (id:number)=> { currentCateId.value = id; handleChange(); };
const reset = () => { subCurrentCateId.value = 0; list.value = []; menuList.value = []; params.page = 1; };

function emitSelect(p:any){ emit('select-product', p); }

watch(()=> props.shopId, (v)=> { if(v){ params.shopId = v; handleChange(); } }, { immediate:true });

const height = computed(()=> `calc(${props.height || '100vh'} - 90rpx)`);
const navTitle = computed(()=> props.tableNo ? `${props.tableNo}` : '点餐菜单');
</script>
<style>
page { background-color:#fff !important; }
</style>
<style lang="scss" scoped>
.scroll-box { height: v-bind('height'); overflow: hidden; }
.content-box { height: 100%; width:100%; display:flex; }
.content-box .side { width:90px; height:100%; background-color:#f7f7f7; }
.content-box .list-box { width:calc(100% - 90px); height:100%; padding-bottom:160rpx; /* 预留底部购物车空间 */ }
.content-box .list-box .list-content { height: calc(100% - 100rpx); }
.content-box .list-box .list-content .list-scroll { height:100%; }
.content-box .list-box .list-content .empty-box { display:flex; align-items:center; justify-content:center; height:100%; width:100%; }
</style>
