<template>
    <tig-layout title="订单评价">
        <view class="order">
            <view class="order-menu">
                <template v-for="item in menuList" :key="item.type">
                    <view class="order-menu-item" :class="{ active: currentType === item.type }" @click="handleMenuType(item.type)">
                        <uni-badge v-if="item.num > 0" class="badgecolor" :text="item.num" absolute="rightTop" size="small">
                            <text class="order-menu-item-text">{{ item.value }}</text>
                        </uni-badge>
                        <text v-else class="order-menu-item-text">{{ item.value }}</text>
                    </view>
                </template>
            </view>
            <view class="placeholder" />
            <template v-if="currentType < 2">
                <view class="order-list">
                    <template v-for="item in filterState" :key="item.orderId">
                        <view class="order-list-item">
                            <view class="order-list-item-header">
                                <text class="special-text"
                                    >{{ $t("订单编号") }}：<text class="special-color">{{ item.orderSn }}</text>
                                </text>
                            </view>
                            <view class="order-list-item-content">
                                <view class="item-content-product">
                                    <template v-for="subItem in item.items" :key="subItem.productId">
                                        <navigator :url="'/pages/product/index?id=' + subItem.productId" hover-class="navigator-hover">
                                            <view class="item-content-product-item">
                                                <view class="item-content-product-img">
                                                    <tig-image :src="subItem.picThumb" />
                                                </view>
                                                <view>
                                                    <view class="item-content-product-info">
                                                        <view class="product-item-title">
                                                            {{ subItem.productName }}
                                                        </view>

                                                        <view class="product-item-price">
                                                            <format-price
                                                                :show-text="false"
                                                                :decimals-style="{
                                                                    fontSize: '25rpx'
                                                                }"
                                                                :currency-style="{
                                                                    fontSize: '23rpx'
                                                                }"
                                                                class="product-item-pricenum"
                                                                :price-data="subItem.price"
                                                            />
                                                            <view class="product-item-quantity">x {{ subItem.quantity }} </view>
                                                        </view>
                                                    </view>
                                                    <view class="sku-card" :class="{ nodata: !subItem.skuData || subItem.skuData.length === 0 }">
                                                        <template v-if="subItem.skuData && subItem.skuData.length > 0">
                                                            <view v-for="(skuItem, skuIndex) in subItem.skuData" :key="skuIndex" class="sku-item line1">{{
                                                                skuItem.value
                                                            }}</view>
                                                        </template>
                                                    </view>
                                                </view>
                                            </view>
                                        </navigator>
                                    </template>
                                </view>
                            </view>
                            <view class="order-list-item-btn">
                                <view class="item-btn-box">
                                    <tig-button
                                        :plain="true"
                                        :custom-style="{ height: '55rpx' }"
                                        :plain-main-color="true"
                                        @click="handleEvaluate(item.orderId)"
                                    >
                                        {{ currentType == 0 ? $t("去评价") : $t("待晒单") }}
                                    </tig-button>
                                </view>
                            </view>
                        </view>
                    </template>
                </view>
            </template>
            <template v-else>
                <view class="comment-list">
                    <view v-for="item in filterState" :key="item.orderId" class="comment-item flex">
                        <view class="comment-header">
                            <tig-image v-if="item.picThumb" class="head" :src="item.picThumb" mode="aspectFill" />
                        </view>
                        <view class="comment-info">
                            <view class="comment-label flex align-center">
                                <view class="name">{{ $t("评价") }}:</view>
                                <view class="content flex align-center justify-between">
                                    <uni-rate :value="item.commentRank" color="#bfbfbf" :readonly="true" active-color="#ffa800" size="18" />
                                    <view class="time">{{ item.addTime }}</view>
                                </view>
                            </view>
                            <view class="comment-label flex" @click="handleToDetail(item.productId!)">
                                <view class="name">{{ $t("商品名称") }}:</view>
                                <view class="content">
                                    <view class="product-name line1">{{ item.productName || "--" }}</view>
                                </view>
                            </view>
                            <view v-if="item.skuData && item.skuData.length > 0" class="comment-label flex">
                                <view class="name">{{ $t("商品规格") }}:</view>
                                <view class="content flex-wrap">
                                    <view v-for="skuItem in item.skuData" class="product-tag">{{ skuItem.value }}</view>
                                </view>
                            </view>
                            <view class="comment-label flex">
                                <view class="name">{{ $t("评价标签") }}:</view>
                                <view class="content flex-wrap">
                                    <view v-for="tag in item.commentTag" class="product-tag">{{ tag }}</view>
                                </view>
                            </view>
                            <view class="comment-label flex">
                                <view class="name">{{ $t("评价内容") }}:</view>
                                <view class="content">
                                    <view class="cont">{{ item.content }}</view>
                                </view>
                            </view>
                            <view v-if="item.reply" class="comment-label flex">
                                <view class="name">{{ $t("客服答复") }}:</view>
                                <view class="content">
                                    <text class="cont">{{ item.reply?.content }}</text>
                                </view>
                            </view>
                            <view class="comment-label flex">
                                <view class="name">{{ $t("晒单") }}:</view>
                                <view v-if="item.showPics.length > 0" class="content flex-wrap">
                                    <view v-for="product in item.showPics" class="product-pic">
                                        <tig-image :src="product.picThumb" mode="aspectFill" @click="imagePreview(imageFormat(product.picUrl))" />
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </template>
            <view v-if="filterState.length == 0" class="empty-box">
                <view class="pictrue">
                    <image :src="staticResource('common/data_empty.png')" />
                </view>
                <view class="txt">{{ $t("暂无评价") }}</view>
            </view>
            <loading-box v-model="loaded" :page="filterParams.page" :length="filterState.length" />
        </view>
    </tig-layout>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { getOrderList } from "@/api/user/order";
import { getShowedList, getCommentList, getCommentSubNum } from "@/api/user/comment";
import type { CommentFilterState, CommentFilterParams } from "@/types/user/comment.d";
import { onLoad, onReachBottom, onUnload } from "@dcloudio/uni-app";
import { imageFormat } from "@/utils/format";
import { staticResource, redirect } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface MenuType {
    type: string;
    value: string;
    num: number;
}
const menuList = reactive<any>([
    { type: 0, value: t("待评价"), num: 0 },
    { type: 1, value: t("待晒单"), num: 0 },
    { type: 2, value: t("已评价"), num: 0 }
]);
const imagePreview = (url: string) => {
    uni.previewImage({
        urls: [url]
    });
};
const getSubNum = async () => {
    try {
        const result = await getCommentSubNum();
        menuList[0].size = result.awaitComment;
        menuList[1].size = result.showPics;
        menuList[2].size = result.commented;
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none",
            duration: 1000
        });
    }
};
const currentType = ref<number>(0);
const filterParams = reactive<CommentFilterParams>({
    page: 1,
    size: 10
});
const handleToDetail = (id: number) => {
    redirect({
        url: `/pages/product/index?id=${id}`
    });
};
const loaded = ref(false);
const filterState = ref<CommentFilterState[]>([]);
const total = ref(0);
const handleMenuType = (type: number) => {
    console.log("type", type);
    currentType.value = type;
    filterState.value = [];
    filterParams.page = 1;
    loadFilter();
};
const loadFilter = async () => {
    if (filterParams.page > 1) {
        loaded.value = true;
    } else {
        uni.showLoading({
            title: t("加载中")
        });
    }
    try {
        let result: any = [];
        if (currentType.value == 0) {
            result = await getOrderList({ ...filterParams, commentStatus: 0 });
        }
        if (currentType.value == 1) {
            result = await getShowedList({ ...filterParams });
        }
        if (currentType.value == 2) {
            result = await getCommentList({ ...filterParams });
        }
        filterState.value = [...filterState.value, ...result.records];
        total.value = result.total;
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none",
            duration: 1000
        });
    } finally {
        uni.hideLoading();
        loaded.value = false;
    }
};

const handleEvaluate = (id: number) => {
    uni.navigateTo({
        url: `/pages/user/comment/info?id=${id}`
    });
};

onLoad((options) => {
    if (options && options.currentType) {
        currentType.value = Number(options.currentType);
    }
    uni.$on("commentFinished", (data) => {
        if (data) {
            currentType.value = 2;
            filterState.value = [];
            filterParams.page = 1;
            loadFilter();
        }
    });
    getSubNum();
    loadFilter();
});

onReachBottom(() => {
    if (filterParams.page < Math.ceil(total.value / filterParams.size)) {
        filterParams.page++;
        loadFilter();
    }
});

// 关闭预览图片
onUnload(() => {
    // #ifdef  H5 || APP
    uni.closePreviewImage();
    // #endif
    // 页面卸载时移除监听器
    uni.$off("commentFinished");
});
</script>

<style lang="scss" scoped>
.placeholder {
    height: 100rpx;
}

.badgecolor {
    :deep(.uni-badge--error) {
        background-color: var(--general);
    }
}

.order-menu {
    background-color: #fff;
    display: flex;
    box-sizing: border-box;
    margin-bottom: 30rpx;
    position: fixed;
    width: 100%;
    z-index: 88;

    .order-menu-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 88rpx;
        position: relative;

        .order-menu-item-text {
            padding: 0 10rpx 0 0;
        }

        &.active {
            color: #333;
            font-weight: bold;

            &:after {
                content: "";
                position: absolute;
                bottom: 0;
                height: 5rpx;
                width: 60rpx;
                background-color: var(--general);
                border-radius: 10rpx;
            }
        }
    }
}

.order-list {
    padding: 10rpx 20rpx;

    .order-list-item {
        background-color: #fff;
        border-radius: 10rpx;
        margin-bottom: 20rpx;
        padding: 20rpx;
        font-size: 24rpx;

        &:last-child {
            margin-bottom: 0;
        }

        .order-list-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20rpx;

            .special-text {
                font-size: 26rpx;
                font-weight: bold;
            }

            .special-color {
                color: #999;
                font-weight: normal;
            }
        }

        .order-list-item-content {
            .item-content-text {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 10rpx;

                .special-color {
                    color: #999;
                }
            }

            .item-content-product-item {
                padding-bottom: 15rpx;
                display: flex;

                &:first-child {
                    padding-top: 15rpx;
                }

                .item-content-product-img {
                    width: 140rpx;
                    height: 140rpx;
                }

                .item-content-product-info {
                    width: 495rpx;
                    padding-left: 25rpx;

                    .product-item-title {
                        font-weight: bold;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }

                    .product-item-price {
                        display: flex;
                        padding-top: 25rpx;

                        .product-item-pricenum {
                            font-size: 30rpx;
                        }

                        .product-item-quantity {
                            font-size: 28rpx;
                            color: #999;
                            padding-left: 15rpx;
                        }
                    }
                }
                .sku-card {
                    margin-left: 20rpx;
                    margin-top: 10rpx;
                }
            }

            .item-content-pay {
                display: flex;
                justify-content: flex-end;

                .item-content-pay-box {
                    display: flex;

                    .pay-item {
                        padding: 0 10rpx;

                        &.pay-type {
                            color: #999;
                        }

                        &.total-money {
                            .price-content {
                                color: var(--general);
                            }
                        }
                    }
                }
            }
        }

        .order-list-item-btn {
            display: flex;
            justify-content: flex-end;
            padding-top: 25rpx;

            .item-btn-box {
                display: flex;

                .base-item-btn {
                    padding: 10rpx 25rpx;
                    border: 1px solid #ddd;
                    border-radius: 30rpx;
                    margin-left: 10rpx;

                    &.detail {
                        border: 1px solid var(--general);
                        color: var(--general);
                    }

                    &:active {
                        opacity: 0.6;
                    }
                }
            }
        }
    }
}

.comment-list {
    padding: 0 20rpx;

    .comment-item {
        padding: 20rpx;
        background-color: #fff;
        border-radius: 20rpx;
        margin-bottom: 20rpx;
    }

    .comment-header {
        width: 120rpx;
        height: 120rpx;
        margin-right: 20rpx;

        .head {
            width: 120rpx;
            height: 120rpx;
            border-radius: 20rpx;
        }
    }

    .comment-info {
        font-size: 24rpx;
        color: #333;

        .comment-label {
            margin-bottom: 15rpx;
            align-items: center;

            .name {
                margin-right: 20rpx;
            }

            .content {
                width: 52vw;

                .time {
                    color: #999;
                    font-size: 22rpx;
                    margin-top: 5rpx;
                }

                .product-name {
                    width: 50vw;
                    color: var(--tag-text);
                }

                .product-tag {
                    background-color: #f5f5f5;
                    border-radius: 5rpx;
                    padding: 5rpx 10rpx;
                    margin: 0 0 5rpx 5rpx;
                    text-align: center;
                }

                .cont {
                    word-wrap: break-word;
                }

                .product-pic {
                    width: 80rpx;
                    height: 80rpx;
                    border-radius: 10rpx;
                    overflow: hidden;
                    margin-right: 10rpx;
                    margin-bottom: 10rpx;
                }
            }
        }
    }
}
</style>
