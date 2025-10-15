<template>
  <view class="menu-content">
    <scroll-view scroll-y="true" class="menu-scroll">
      <view v-for="item in menuList" :key="item.categoryId" class="menu-item" :class="{ active: internalCurrent===item.categoryId }" @click="handleClick(item.categoryId)">{{ item.categoryName }}</view>
    </scroll-view>
  </view>
</template>
<script setup lang="ts">
import { getCategoryList } from '@/api/productCate/productCate';
import type { filterSeleted } from '@/types/productCate/productCate';
import { shallowRef, watch, ref } from 'vue';

const props = defineProps<{ currentCateId?:number; shopId?:number }>();
const emit = defineEmits(['change','update:currentCateId']);

const internalCurrent = ref(props.currentCateId || 0);
const menuList = shallowRef<filterSeleted[]>([]);

async function getMenuList(){
  try {
    const result:any = await getCategoryList(0);
    const list = Array.isArray(result) ? result : (result?.list || []);
    menuList.value = list;
    if(list?.length && !internalCurrent.value){
      internalCurrent.value = list[0].categoryId;
      emit('change', internalCurrent.value);
    }
  } catch(e){ console.error(e);} }
getMenuList();

function handleClick(id:number){ if(id===internalCurrent.value) return; internalCurrent.value = id; emit('change', id); emit('update:currentCateId', id); }

watch(()=> props.shopId, (v)=>{ /* 后续按店铺调接口 */ });
</script>
<style lang="scss" scoped>
.menu-content { height:100%; width:100%; }
.menu-scroll { height:100%; }
.menu-item { min-height:50px; padding-left:6px; width:100%; font-size:13px; color:#424242; text-align:center; display:flex; align-items:center; flex-wrap:wrap; justify-content:center; &.active { color:var(--general); background-color:#fff; position:relative; &::after { content:''; width:3px; height:18px; background-color:var(--general); border-radius:2px; position:absolute; left:0; } } }
</style>
