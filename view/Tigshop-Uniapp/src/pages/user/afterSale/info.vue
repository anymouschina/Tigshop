<template>
    <view class="after-sale-info">
        <tig-layout :need-safe-top="true">
            <template v-if="Object.keys(infoData).length">
                <template v-if="showReturngoodstip">
                    <view class="returngoodstip-box">
                        <view class="returngoodstip-bg" />
                        <view class="returngoodstip-content">
                            <view class="iconfont-h5 icon-tongzhi" />
                            <view class="returngoodstip-text line1">{{ infoData.returnGoodsTip }}</view>
                            <view class="iconfont-h5 icon-chacha" @click="showTip = false" />
                        </view>
                    </view>
                </template>

                <view class="after-sal-info-steps">
                    <uni-steps active-color="var(--general)" :options="infoData.stepStatus.steps" :active="infoData.stepStatus.current" />
                </view>
                <view v-if="infoData.status === 3" class="refuse-reply">
                    <view class="refuse-reply-title"> {{ $t("拒绝原因") }}: </view>
                    <view class="refuse-reply-content line1">
                        {{ infoData.reply }}
                    </view>
                </view>
                <view class="negotiate" @click="handleNegotiate">
                    <view class="negotiate-text"> {{ $t("查看协商记录") }} </view>
                    <view class="negotiate-icon">
                        <uni-icons type="right" size="20" color="#999" />
                    </view>
                </view>
                <view v-if="infoData.status === 4" class="negotiate" @click="handleShipments">
                    <view class="negotiate-text"> {{ $t("去发货") }} </view>
                    <view class="negotiate-icon">
                        <uni-icons type="right" size="20" color="#999" />
                    </view>
                </view>

                <view class="info-content">
                    <view class="info-content-title"> {{ $t("售后信息") }} </view>
                    <view class="info-content-product">
                        <view
                            v-for="item in infoData.aftersalesItems"
                            :key="item.aftersalesItemId"
                            class="info-content-product-item"
                            @click="handleProduct(item.productId)"
                        >
                            <view class="product-item-left">
                                <tig-image :src="item.picThumb" />
                            </view>
                            <view class="product-item-right">
                                <view class="product-item-name line2">{{ item.productName }}</view>
                                <view class="right-price">
                                    <format-price
                                        :show-text="false"
                                        :decimals-style="{
                                            fontSize: '23rpx',
                                            fontWeight: 'bold'
                                        }"
                                        :currency-style="{
                                            fontSize: '21rpx',
                                            fontWeight: 'bold'
                                        }"
                                        class="right-price-pricenum"
                                        :price-data="item.price"
                                    />
                                    <view class="right-price-quantity">x {{ item.number }}</view>
                                </view>
                            </view>
                        </view>
                    </view>
                    <view class="refund-info">
                        <template v-if="Number(infoData.refundAmount) > 0">
                            <view class="refund-info-item">
                                <view class="label">{{ $t("退款金额") }}：</view>
                                <view class="value price"><format-price :show-text="false" :is-bottom="false" :price-data="infoData.refundAmount" /></view>
                            </view>
                        </template>

                        <view class="refund-info-item">
                            <view class="label">{{ $t("售后方式") }}：</view>
                            <view class="value">{{ infoData.aftersalesTypeName }}</view>
                        </view>
                        <view class="refund-info-item">
                            <view class="label">{{ $t("退款原因") }}：</view>
                            <view class="value">{{ infoData.aftersaleReason }}</view>
                        </view>
                    </view>
                    <view class="after-sale">
                        <view class="after-sale-item">
                            <view class="label">{{ $t("售后编号") }}：</view>
                            <view class="value">{{ infoData.aftersalesSn }}</view>
                        </view>
                        <view class="after-sale-item">
                            <view class="label">{{ $t("申请时间") }}：</view>
                            <view class="value">{{ infoData.addTime }}</view>
                        </view>
                        <view class="after-sale-item">
                            <view class="label">{{ $t("退货数量") }}：</view>
                            <view class="value">{{ quantityNum }}</view>
                        </view>
                    </view>
                </view>
                <template v-if="infoData.logisticsName && infoData.trackingNo">
                    <view class="info-content">
                        <view class="info-content-title"> {{ $t("退货信息") }} </view>
                        <view class="after-sale">
                            <view class="after-sale-item">
                                <view class="label">{{ $t("快递公司") }}：</view>
                                <view class="value">{{ infoData.logisticsName }}</view>
                            </view>
                            <view class="after-sale-item">
                                <view class="label">{{ $t("快递单号") }}：</view>
                                <view class="value">{{ infoData.trackingNo }}</view>
                            </view>
                        </view>
                    </view>
                </template>
                <template v-if="infoData.refund">
                    <view class="info-content">
                        <!-- refundStatus: 0 待处理 1:处理中 2：已处理  3:已取消 -->
                        <view class="info-content-title"> {{ $t("退款进度") }} </view>
                        <view class="after-sale">
                            <template v-if="infoData.refund.onlineBalance > 0">
                                <view class="after-sale-item">
                                    <view class="label">{{ $t("线上退款") }}：</view>
                                    <view class="value"
                                        ><format-price :show-text="false" :is-bottom="false" :price-data="infoData.refund.onlineBalance"
                                    /></view>
                                    <view class="after-sale-status">{{ infoData.refund.isOnline === 2 ? $t("退款成功") : $t("退款中") }}</view>
                                </view>
                            </template>
                            <template v-if="infoData.refund.offlineBalance > 0">
                                <view class="after-sale-item">
                                    <view class="label">{{ $t("线下退款") }}：</view>
                                    <view class="value"
                                        ><format-price :show-text="false" :is-bottom="false" :price-data="infoData.refund.offlineBalance"
                                    /></view>
                                    <view class="after-sale-status">{{ infoData.refund.isOnline === 2 ? $t("退款成功") : $t("退款中") }}</view>
                                </view>
                            </template>
                            <template v-if="infoData.refund.refundBalance > 0">
                                <view class="after-sale-item">
                                    <view class="label">{{ $t("余额退款") }}：</view>
                                    <view class="value"
                                        ><format-price :show-text="false" :is-bottom="false" :price-data="infoData.refund.refundBalance"
                                    /></view>
                                    <view class="after-sale-status">{{ infoData.refund.isOnline === 2 ? $t("退款成功") : $t("退款中") }}</view>
                                </view>
                            </template>
                        </view>
                    </view>
                </template>

                <template v-if="infoData.canCancel">
                    <tig-fixed-placeholder height="100rpx" background-color="#fff">
                        <view class="after-sale-btn">
                            <view class="after-sale-btn-box">
                                <tig-button class="btn" :plain="true" @click="handleRevocation">
                                    {{ $t("撤销申请") }}
                                </tig-button>
                                <tig-button :plain="true" class="btn" @click="handleEdit"> {{ $t("修改申请") }} </tig-button>
                            </view>
                        </view>
                    </tig-fixed-placeholder>
                </template>
            </template>
        </tig-layout>
    </view>
</template>

<script setup lang="ts">
import { aftersalesViewRecord, aftersalesCancel } from "@/api/user/afterSale";
import type { afterSaleInfoItem } from "@/types/user/afterSale";
import { onLoad, onShow, onUnload } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

onLoad((options) => {
    if (options && options.id) {
        id.value = Number(options.id);
        getAftersalesViewRecord();
    }
});

onShow(() => {
    uni.$on("refreshInfo", (data: number) => {
        id.value = data;
        getAftersalesViewRecord();
    });
});

onUnload(() => {
    uni.$off("refreshInfo");
});

const id = ref<number>();
const infoData = ref<afterSaleInfoItem>({} as afterSaleInfoItem);
const quantityNum = ref(0);
const getAftersalesViewRecord = async () => {
    try {
        const result = await aftersalesViewRecord(id.value!);
        infoData.value = result;
        infoData.value.aftersalesItems.forEach((item: any) => {
            quantityNum.value += item.number;
        });
    } catch (error: any) {
        console.error(error);
        uni.showToast({
            title: error.message,
            icon: "none"
        });
    }
};

const handleRevocation = () => {
    uni.showModal({
        title: t("提示"),
        content: t("确认要撤销申请吗？"),
        success: async (res) => {
            if (res.confirm) {
                try {
                    const result = await aftersalesCancel({ aftersaleId: infoData.value.aftersaleId });
                    uni.showToast({
                        title: t("撤销成功")
                    });
                    uni.redirectTo({
                        url: "/pages/user/afterSale/list"
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        }
    });
};

const handleEdit = async () => {
    try {
        if (infoData.value.aftersalesItems.length === 1) {
            uni.redirectTo({
                url: `/pages/user/afterSale/edit?aftersaleId=${infoData.value.aftersaleId}&itemId=${infoData.value.aftersalesItems[0].orderItemId}`
            });
        } else {
            uni.redirectTo({
                url: `/pages/user/afterSale/edit?aftersaleId=${infoData.value.aftersaleId}`
            });
        }
    } catch (error) {
        console.error(error);
    }
};

const showTip = ref(true);
const showReturngoodstip = computed(() => {
    return infoData.value.returnGoodsTip && showTip.value;
});

const handleProduct = (id: number) => {
    uni.navigateTo({
        url: `/pages/product/index?id=${id}`
    });
};

const handleNegotiate = () => {
    uni.navigateTo({
        url: "/pages/user/afterSale/negotiate?id=" + infoData.value.aftersaleId
    });
};
const handleShipments = () => {
    uni.navigateTo({
        url: `/pages/user/afterSale/shipments?id=${infoData.value.aftersaleId}&returnAddress=${infoData.value.returnAddress}`
    });
};
</script>

<style lang="scss" scoped>
.returngoodstip-box {
    margin: 20rpx 0;
    padding: 25rpx 0 25rpx 26rpx;
    color: var(--general);
    position: relative;

    .returngoodstip-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--general);
        opacity: 0.1;
        z-index: 0;
    }

    .returngoodstip-content {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;

        .returngoodstip-text {
            font-size: 24rpx;
            flex: 1;
            padding-left: 16rpx;
        }

        .icon-tongzhi {
            font-size: 34rpx;
        }

        .icon-chacha {
            font-size: 28rpx;
            padding-left: 20rpx;
            padding-right: 16rpx;
        }
    }
}

.after-sal-info-steps {
    background-color: #fff;
    padding: 20rpx;
    margin-bottom: 20rpx;
}
.refuse-reply {
    background-color: #fff;
    padding: 20rpx;
    margin-bottom: 20rpx;
    display: flex;
    font-size: 28rpx;
    .refuse-reply-title {
        color: #999;
    }
    .refuse-reply-content {
        padding-left: 15rpx;
        width: 550rpx;
    }
}

.negotiate {
    display: flex;
    justify-content: space-between;
    padding: 20rpx;
    background-color: #fff;
    .negotiate-text {
        font-weight: 500;
        color: #000;
    }
}

.info-content {
    background-color: #fff;
    padding: 20rpx 0;
    margin-top: 20rpx;

    .info-content-title {
        color: #000;
        font-weight: 500;
        padding: 10rpx 20rpx;
    }

    .info-content-product {
        padding: 10rpx 20rpx;
        background-color: #fafafa;

        .info-content-product-item {
            display: flex;
            padding: 10rpx 0;

            .product-item-left {
                width: 160rpx;
                height: 160rpx;
                border-radius: 10rpx;
                overflow: hidden;
            }

            .product-item-right {
                padding-left: 20rpx;

                .product-item-name {
                    font-weight: bold;
                    width: 500rpx;
                }

                .right-price {
                    display: flex;
                    font-size: 28rpx;
                    padding-top: 20rpx;
                    .right-price-pricenum {
                        font-weight: bold;
                        color: var(--general);
                        padding-right: 10rpx;
                        :deep(.util) {
                            font-size: 22rpx;
                            font-weight: normal;
                        }
                    }

                    .right-price-quantity {
                        color: #999;
                    }
                }
            }
        }
    }

    .refund-info {
        padding: 15rpx 20rpx;
        border-bottom: 1rpx solid #f5f5f5;
        .refund-info-item {
            display: flex;
            padding: 10rpx 0;

            .price {
                color: var(--general);
            }
        }
    }

    .after-sale {
        padding: 0 20rpx;
        padding-top: 15rpx;
        .after-sale-item {
            display: flex;
            padding: 10rpx 0;
        }
    }
}

.after-sale-btn {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding: 20rpx;

    .after-sale-btn-box {
        display: flex;
        align-items: center;

        .btn {
            height: 60rpx;

            &.special {
                color: var(--general);
                border-color: var(--general);
            }
            &:active {
                background-color: #d9d9d9;
            }

            &:first-child {
                margin-right: 15rpx;
            }
        }
    }
}

.label {
    color: #6a6a6a;
    font-size: 24rpx;
}
.value {
    color: #000;
    font-size: 24rpx;
}
.after-sale-status {
    color: #000;
    font-size: 24rpx;
    color: var(--general);
    padding-left: 15rpx;
}

:deep(.uni-steps__row-desc) {
    font-size: 20rpx;
}
</style>
