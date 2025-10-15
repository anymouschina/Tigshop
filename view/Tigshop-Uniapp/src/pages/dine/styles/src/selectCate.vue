<template>
  <view class="cate-box" :class="{ main: type==='main' }">
    <scroll-view :scroll-x="true" class="cate-scroll" :scroll-with-animation="true" :scroll-left="scrollLeft" @scroll="handleScroll">
      <view v-for="item in menuList" :key="item.categoryId" class="cate-item" @click="handleClick(item.categoryId)">
        <view class="item-text" :class="{ active: item.categoryId === internalSubCurrent, main: type==='main' }">{{ item.categoryName }}</view>
      </view>
    </scroll-view>
    <view class="cate-btn" @click="handleShowPopup"><text class="iconfont-h5 icon-xiajiantou" :class="{ 'icon-xiajiantou1-copy': type==='main' }" /></view>
    <tig-popup v-model:show="show" position="top" :z-index="999" :show-close="false" background-color="#fff">
      <view class="cate-popup">
        <view class="cate-popup-title">{{ catePopupTitle }}</view>
        <view class="cate-popup-list-box">
          <view class="cate-popup-list">
            <view v-for="item in menuList" :key="item.categoryId" class="list-item popup-item" @click="handleClick(item.categoryId)">
              <view class="item-text popup-text line1" :class="{ active: item.categoryId === internalSubCurrent, main: type==='main' }">{{ item.categoryName }}</view>
            </view>
          </view>
        </view>
        <view class="cate-popup-close" @click="show=false">{{ $t('点击收起') }}<text class="iconfont-h5 icon-xiajiantou1-copy" /></view>
      </view>
    </tig-popup>
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getCategoryList } from '@/api/productCate/productCate';
import type { filterSeleted } from '@/types/productCate/productCate';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{ currentCateId:number; type?:string }>();
const emit = defineEmits(['change']);

const internalSubCurrent = defineModel<number>('subCurrentCateId',{ default:0 });
const menuList = defineModel<filterSeleted[]>('menuList', { default:[] });
const scrollLeft = ref(0);

async function getMenu(id:number){
  try {
    const result:any = await getCategoryList(id);
    const list = Array.isArray(result) ? result : (result?.list || []);
    menuList.value = [{ categoryId:0, categoryName: t('全部商品') } as any, ...list];
    emit('change');
    scrollLeft.value = 0;
  } catch(e){ console.error(e);} }

function handleClick(id:number){ if(id===internalSubCurrent.value) return; internalSubCurrent.value = id; emit('change'); }
function handleScroll(e:any){ scrollLeft.value = e.detail.scrollLeft; }
function handleShowPopup(){ if(menuList.value.length){ show.value = true; } }

const catePopupTitle = computed(()=> menuList.value.find(i=> i.categoryId===internalSubCurrent.value)?.categoryName);

watch(()=> props.currentCateId, async (v)=> { if(v && v>0){ await getMenu(v); } });

const show = ref(false);
</script>
<style lang="scss" scoped>
.cate-box { width:100%; height:100rpx; position:relative; }
.cate-btn { position:absolute; right:0; top:0; width:80rpx; height:100%; background-color:#fff; display:flex; align-items:center; justify-content:center; }
.cate-scroll { width:100%; white-space:nowrap; padding:20rpx 0; }
.cate-item { display:inline-block; min-width:150rpx; padding:5rpx 0; margin-right:15rpx; &:first-child { margin-left:20rpx; } &:last-child { margin-right:100rpx; } }
.item-text { padding:10rpx 10rpx; background-color:#f6f6f6; border-radius:50rpx; font-size:26rpx; color:#999; text-align:center; &.popup-text { margin-right:0; width:100%; padding:10rpx; } &.active { background-color: var(--tag-bg); color: var(--tag-text); border:1px solid var(--tag-text); } &.active.main { color: var(--main-text); background-color: var(--main-bg); } }
.cate-popup { max-height:50vh; padding:0 30rpx; position:relative; }
.cate-popup-title { font-size:32rpx; height:100rpx; display:flex; align-items:center; }
.cate-popup-list-box { height:calc(100% - 100rpx); padding-bottom:70rpx; overflow:hidden; overflow-y:auto; }
.cate-popup-list { display:grid; grid-template-columns:repeat(4,1fr); grid-gap:20rpx; .list-item { height:60rpx; } }
.cate-popup-close { position:absolute; bottom:0; left:50%; transform:translateX(-50%); font-size:24rpx; color:#999; display:flex; align-items:center; padding:20rpx; }
.icon-xiajiantou1-copy { font-size:28rpx; transform: rotate(180deg); }
</style>
