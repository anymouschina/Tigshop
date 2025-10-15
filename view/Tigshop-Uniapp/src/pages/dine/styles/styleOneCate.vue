<template>
  <!-- Dine版 Style One 分类：去掉搜索跳转，标题显示店铺或桌号，可按需插入堂食提示 -->
  <view>
    <tig-layout>
      <tig-navbar :show-left="false" :title="navTitle" />
      <view v-if="loading || !partAllLoading" class="page-loading">
        <view class="ico" />
      </view>
      <view v-if="partAllLoading" class="pageMain">
        <block v-if="showCatLevel == 0">
          <view class="productSort">
            <view class="aside">
              <view :class="'item acea-row row-center-wrapper ' + (catId == 0 ? 'on' : '')" @click="changeCat(0)">
                <text>{{ $t('推荐') }}</text>
              </view>
              <block v-for="(item, index) in cateList" :key="index">
                <view :class="'item acea-row row-center-wrapper ' + (catId == item.categoryId ? 'on' : '')" :data-cat_id="item.categoryId" @click="changeCat(item.categoryId, item)">
                  <text v-if="item.catShortName">{{ item.catShortName }}</text>
                  <text v-else>{{ item.categoryName }}</text>
                </view>
              </block>
            </view>
            <view class="conter">
              <block v-if="!loading">
                <block v-if="catId == 0">
                  <view class="listw">
                    <view class="title acea-row row-center-wrapper">
                      <view class="name">{{ $t('热门分类') }}</view>
                    </view>
                    <view class="list acea-row">
                      <block v-for="(hot, index) in hotCat" :key="index">
                        <view class="item acea-row row-column row-middle" @click="emitSelectCategory(hot)">
                          <view class="picture"><tig-image :src="hot.categoryPic" mode="aspectFill" /></view>
                          <view class="name line1">{{ hot.categoryName }}</view>
                        </view>
                      </block>
                    </view>
                  </view>
                </block>
                <block v-if="catId > 0">
                  <view v-for="(cat, index) in childCat" :id="'b' + index" :key="index" class="listw">
                    <view class="title acea-row row-center-wrapper">
                      <view class="item acea-row row-column row-middle">
                        <view class="name">{{ cat.categoryName }}</view>
                      </view>
                    </view>
                    <view class="list acea-row">
                      <block v-for="(childCatItem, index1) in cat.children" :key="index1">
                        <view class="item acea-row row-column row-middle" @click="emitSelectCategory(childCatItem)">
                          <view v-if="childCatItem.categoryPic" class="picture"><tig-image :src="childCatItem.categoryPic" /></view>
                          <view class="name line1">{{ childCatItem.categoryName }}</view>
                        </view>
                      </block>
                    </view>
                  </view>
                </block>
              </block>
            </view>
          </view>
        </block>
      </view>
    </tig-layout>
  </view>
</template>
<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { getCategoryAll, getCategoryHot } from '@/api/productCate/productCate';
import type { filterSeleted } from '@/types/productCate/productCate';

const props = defineProps<{ shopId?: number; tableNo?: string }>();
const emit = defineEmits<{ (e: 'select-category', cat: any): void }>();

const navTitle = computed(()=> props.tableNo ? `${props.tableNo}` : '点餐分类');

const catId = ref(0);
const cateList = ref<any>([]);
const childCat = ref<filterSeleted[]>([]);
const hotCat = ref<filterSeleted[]>([]);
const partAllLoading = ref(false);
const loading = ref(true);
const showCatLevel = ref(0);

const getAllCategory = async () => {
  partAllLoading.value = true;
  try {
    // 如果后端返回 { list, source, fallback } 结构，做兼容处理
    const result:any = await getCategoryAll();
    const list = Array.isArray(result) ? result : (result?.list || []);
    cateList.value = list;
  } catch (err) { console.error(err); }
};

const changeCat = (id: number, item?: any) => {
  catId.value = id;
  if (item) { childCat.value = item.children; }
};
const getHotCatList = async () => {
  try {
    const result = await getCategoryHot();
    hotCat.value = result || [];
    loading.value = false;
  } catch (err) { console.error(err); }
};

function emitSelectCategory(cat:any){ emit('select-category', cat); }

// 允许无 shopId 也加载；若后端提供定制接口，在这里切换
watch(()=> props.shopId, async (v)=> {
  if(v !== undefined){
    await getAllCategory();
    await getHotCatList();
  }
}, { immediate:true });
</script>
<style lang="scss" scoped>
/* 基于原 styleOneCate 精简，保留样式 */
.productSort .aside { position: fixed; width: 180rpx; left: 0; bottom: 0; top: var(--nav-height); margin-top: 0; background-color: #f7f7f7; overflow-y: auto; overflow-x: hidden; padding-bottom: 160rpx; }
.productSort .aside .item { height: 80rpx; width: 100%; font-size: 26rpx; color: #424242; text-align: center; }
.productSort .aside .item.on { background-color: #fff; color: var(--general); font-weight: bold; }
.productSort .conter { margin: 0 0 0 180rpx; padding: 0 14rpx; }
.productSort .conter .listw { padding-top: 20rpx; }
.productSort .conter .listw .title { height: 50rpx; justify-content: left; }
.productSort .conter .listw .title .name { font-size: 28rpx; color: #333; margin: 0 30rpx; font-weight: bold; }
.productSort .conter .list { flex-wrap: wrap; }
.productSort .conter .list .item { width: 177rpx; margin-top: 26rpx; }
.productSort .conter .list .item .picture { width: 120rpx; height: 120rpx; border-radius: 50%; overflow: hidden; }
.productSort .conter .list .item .name { font-size: 24rpx; color: #333; height: 56rpx; line-height: 56rpx; width: 120rpx; text-align: center; }
</style>
