<template>
    <view>
        <tig-layout>
            <tig-navbar :show-left="false" title="产品分类" />
            <view v-if="loading || !partAllLoading" class="page-loading">
                <view class="ico" />
            </view>
            <view v-if="partAllLoading" class="pageMain">
                <block v-if="showCatLevel == 0">
                    <view class="productSort">
                        <view class="header acea-row row-center-wrapper">
                            <view class="acea-row row-between-wrapper input" @click.stop="toSearch">
                                <text class="iconfont-h5 icon-sousuo" />
                                <view class="txt"> {{ $t("点击搜索商品信息") }}</view>
                            </view>
                        </view>
                        <view class="aside">
                            <view :class="'item acea-row row-center-wrapper ' + (catId == 0 ? 'on' : '')" @click="changeCat(0)">
                                <text>{{ $t("推荐") }}</text>
                            </view>
                            <block v-for="(item, index) in cateList" :key="index">
                                <view
                                    :class="'item acea-row row-center-wrapper ' + (catId == item.categoryId ? 'on' : '')"
                                    :data-cat_id="item.categoryId"
                                    @click="changeCat(item.categoryId, item)"
                                >
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
                                            <view class="name">{{ $t("热门分类") }}</view>
                                        </view>
                                        <view class="list acea-row">
                                            <block v-for="(hot, index) in hotCat" :key="index">
                                                <navigator
                                                    hover-class="none"
                                                    :url="'/pages/search/result?categoryId=' + hot.categoryId"
                                                    class="item acea-row row-column row-middle"
                                                >
                                                    <view class="picture">
                                                        <tig-image :src="hot.categoryPic" mode="aspectFill" />
                                                    </view>
                                                    <view class="name line1">{{ hot.categoryName }}</view>
                                                </navigator>
                                            </block>
                                        </view>
                                    </view>
                                </block>
                                <block v-if="catId > 0">
                                    <view v-for="(cat, index) in childCat" :id="'b' + index" :key="index" class="listw">
                                        <view class="title acea-row row-center-wrapper">
                                            <navigator
                                                hover-class="none"
                                                :url="'/pages/search/result?categoryId=' + cat.categoryId"
                                                class="item acea-row row-column row-middle"
                                            >
                                                <view class="name">{{ cat.categoryName }}</view>
                                            </navigator>
                                        </view>
                                        <view class="list acea-row">
                                            <block v-for="(childCatItem, index1) in cat.children" :key="index1">
                                                <navigator
                                                    hover-class="none"
                                                    :url="'/pages/search/result?categoryId=' + childCatItem.categoryId"
                                                    class="item acea-row row-column row-middle"
                                                >
                                                    <view v-if="childCatItem.categoryPic" class="picture">
                                                        <tig-image :src="childCatItem.categoryPic" />
                                                    </view>
                                                    <view class="name line1">{{ childCatItem.categoryName }}</view>
                                                </navigator>
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
import { ref } from "vue";
import { getCategoryAll, getCategoryHot } from "@/api/productCate/productCate";
import type { filterSeleted } from "@/types/productCate/productCate";

const catId = defineModel("catId", {
    type: Number,
    default: 0
});

const cateList = ref<any>([]);
const childCat = ref<filterSeleted[]>([]);
const hotCat = ref<filterSeleted[]>([]);
const partAllLoading = ref(false);
const loading = ref(true);
const showCatLevel = ref(0);

const toSearch = () => {
    uni.navigateTo({
        url: "/pages/search/index"
    });
};
const getAllCategory = async () => {
    partAllLoading.value = true;
    try {
        const result = await getCategoryAll();
        cateList.value = result || [];
    } catch (err) {
        console.error(err);
    }
};

const changeCat = (id: number, item?: any) => {
    catId.value = id;
    if (item) {
        childCat.value = item.children;
    }
};
const getHotCatList = async () => {
    try {
        const result = await getCategoryHot();
        hotCat.value = result || [];
        loading.value = false;
    } catch (err) {
        console.error(err);
    }
};

getAllCategory();
getHotCatList();
</script>

<style lang="scss" scoped>
.productSort .header {
    width: 100%;
    height: 99rpx;
    background-color: #fff;
    position: fixed;
    left: 0;
    right: 0;
    z-index: 9;
    border-bottom: 1rpx solid #f5f5f5;
    top: var(--nav-height);
}

.productSort .header .input {
    width: 700rpx;
    height: 60rpx;
    background-color: #f5f5f5;
    border-radius: 50rpx;
    box-sizing: border-box;
    padding: 0 25rpx;
}

.productSort .header .input .iconfont {
    font-size: 35rpx;
    color: #555;
}

.productSort .header .input .txt {
    color: #999;
    width: 93%;
    font-size: 26rpx;
}

.productSort .aside {
    position: fixed;
    width: 180rpx;
    left: 0;
    bottom: 0;
    top: var(--nav-height);
    margin-top: 98rpx;
    background-color: #f7f7f7;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: var(--tabbar-height);
}

.productSort .aside .item {
    height: 80rpx;
    width: 100%;
    font-size: 26rpx;
    color: #424242;
    text-align: center;
}

.productSort .aside .item.on {
    background-color: #fff;
    width: 100%;
    text-align: center;
    color: var(--general);
    font-weight: bold;
}

.productSort .conter {
    margin: 98rpx 0 0 180rpx;
    padding: 0 14rpx;
}

.productSort .conter .listw {
    padding-top: 20rpx;
}

.productSort .conter .listw .title {
    height: 50rpx;
    justify-content: left;
}

.productSort .conter .listw .title .line {
    width: 100rpx;
    height: 2rpx;
    background-color: #999;
}

.productSort .conter .listw .title .name {
    font-size: 28rpx;
    color: #333;
    margin: 0 30rpx;
    font-weight: bold;
}

.productSort .conter .list {
    flex-wrap: wrap;
}

.productSort .conter .list .item {
    width: 177rpx;
    margin-top: 26rpx;
}

.productSort .conter .list .item .picture {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    overflow: hidden;
}

.productSort .conter .list .item .picture image {
    width: 100%;
    height: 100%;
}

.productSort .conter .list .item .name {
    font-size: 24rpx;
    color: #333;
    height: 56rpx;
    line-height: 56rpx;
    width: 120rpx;
    text-align: center;
}
</style>
