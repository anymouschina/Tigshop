<template>
    <view>
        <tig-navbar title="产品分类" :show-left="false" />
        <search :needMenu="true" @menu="handleMenu" @search="handleSearch" />
        <view class="scroll-box">
            <view class="content-box">
                <view class="side">
                    <menuBox v-model:current-cate-id="currentCateId" @change="reset" />
                </view>
                <view class="list-box">
                    <selectCate
                        v-model:menu-list="menuList"
                        v-model:sub-current-cate-id="subCurrentCateId"
                        type="main"
                        :current-cate-id="currentCateId"
                        @change="handleChange"
                    />
                    <view class="list-content">
                        <template v-if="!isLoading && total > 0">
                            <scroll-view :scroll-y="true" class="list-scroll" @scrolltolower="reachBottom">
                                <view class="product-list">
                                    <view v-for="item in list" :key="item.productId" class="product-item">
                                        <view class="item-left" @click="handleToDetail(item.productId!)">
                                            <tig-lazy-image :src="item.picThumb" />
                                            <!-- <tig-image :src="item.picThumb"></tig-image> -->
                                            <template v-if="item.productStock == 0 || item.productStatus == 0">
                                                <view class="product-status-box">
                                                    <view class="outsale">{{ $t(item.productStock == 0 ? "已售罄" : "已下架") }}</view>
                                                </view>
                                            </template>
                                        </view>
                                        <view class="item-right">
                                            <view class="item-right-title line2" @click="handleToDetail(item.productId!)">
                                                {{ item.productName }}
                                            </view>
                                            <view class="item-right-price">
                                                <format-price
                                                    :decimals-style="{
                                                        fontSize: '24rpx',
                                                        fontWeight: 'bold'
                                                    }"
                                                    :currency-style="{
                                                        fontSize: '23rpx',
                                                        fontWeight: 'bold'
                                                    }"
                                                    :font-style="{ fontSize: '32rpx' }"
                                                    :price-data="item.productPrice"
                                                />
                                            </view>
                                            <view class="buy_icon">
                                                <view class="buy_btn" @click="handleBuy(item)">
                                                    <template v-if="item.isCheck">
                                                        <up-loading-icon mode="circle" />
                                                    </template>
                                                    <template v-else>
                                                        <text class="iconfont-h5 icon-gouwuche3 buy_btn_icon" />
                                                    </template>
                                                </view>
                                            </view>
                                        </view>
                                    </view>
                                </view>
                            </scroll-view>
                        </template>
                        <template v-if="!isLoading && total === 0">
                            <view class="empty-box">
                                <up-empty :icon="staticResource('salesman/no_order.png')" :text="$t('暂无数据')" />
                            </view>
                        </template>
                    </view>
                </view>
            </view>
        </view>
        <specification ref="specificationRef" v-model="productId" @add-card-succeed="" @load-end="loadEnd" @close="handleClose" />
    </view>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import search from "./src/search.vue";
import menuBox from "./src/menu.vue";
import selectCate from "./src/selectCate.vue";
import specification from "@/components/product/specification.vue";
import { getCateProduct } from "@/api/home/home";
import type { GetProductFilterResult } from "@/types/home/home";
import { useList } from "@/hooks";
import { staticResource, redirect } from "@/utils";
import type { filterSeleted } from "@/types/productCate/productCate";

const currentCateId = ref(0);

const subCurrentCateId = ref(0);

const menuList = ref<filterSeleted[]>([]);

const props = defineProps({
    height: {
        type: [Number, String],
        default: 0
    }
});

const params = reactive({
    categoryId: 0,
    page: 1,
    size: 10
});
const {
    data: list,
    getList,
    reachBottom,
    isLoading,
    total
} = useList<GetProductFilterResult>(getCateProduct, {
    params,
    path: {
        dataKey: "records"
    },
    needReachBottom: false
});

const handleChange = () => {
    list.value = [];
    params.page = 1;
    if (subCurrentCateId.value === 0) {
        params.categoryId = currentCateId.value;
    } else {
        params.categoryId = subCurrentCateId.value;
    }
    getList();
};

const reset = () => {
    subCurrentCateId.value = 0;
    list.value = [];
    menuList.value = [];
    params.page = 1;
};

const handleMenu = () => {
    redirect({
        url: "/pages/index/index"
    });
};
const handleSearch = () => {
    redirect({
        url: "/pages/search/index"
    });
};

const handleToDetail = (id: number) => {
    redirect({
        url: `/pages/product/index?id=${id}`
    });
};

const productId = ref(0);
const specificationRef = ref();
const currentItem = ref<AnyObject>({});

const handleBuy = (item: any) => {
    if (item.isCheck) return;
    productId.value = item.productId;
    item.isCheck = true;
    currentItem.value = item;
};
const loadEnd = () => {
    specificationRef.value.handleShowPopup();
    currentItem.value.isCheck = false;
};
const handleClose = () => {
    productId.value = 0;
};

const height = computed(() => {
    return `calc(${props.height} - 90rpx)`;
});
</script>
<style>
/* 兼容小程序 */
page {
    background-color: #fff !important;
}
</style>
<style lang="scss" scoped>
.scroll-box {
    height: v-bind("height");
    overflow: hidden;
}
.content-box {
    height: 100%;
    width: 100%;
    display: flex;

    .side {
        width: 90px;
        height: 100%;
        background-color: #f7f7f7;
    }

    .list-box {
        width: calc(100% - 90px);
        height: 100%;
        .list-content {
            height: calc(100% - 100rpx);
            .list-scroll {
                height: 100%;
            }

            .empty-box {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
            }
        }
    }
}

.product-list {
    padding: 25rpx;
    background-color: #fff;

    .product-item {
        display: flex;
        padding: 20rpx 0;
        .item-left {
            width: 171rpx;
            height: 171rpx;
            border-radius: 10rpx;
            overflow: hidden;
            position: relative;
        }

        .item-right {
            width: calc(100% - 171rpx);
            padding-left: 10rpx;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            .item-right-title {
                font-size: 24rpx;
                font-weight: bold;
                color: #2a3145;
            }
            .item-right-price {
                color: var(--general);
                font-weight: 600;
            }
            .buy_icon {
                position: absolute;
                right: 0;
                bottom: 0;
                color: var(--general);
                .buy_btn_icon {
                    font-size: 40rpx;
                }
            }
        }
    }
}
</style>
