<template>
    <view class="total-card">
        <view>
            <view class="total-card-item">
                <view class="total-card-item-left">{{ $t("商品总价") }}</view>
                <view class="total-card-item-right"><format-price :is-bottom="false" :price-data="total.productAmount" /></view>
            </view>
            <view v-if="total.serviceFee && total.serviceFee > 0" class="total-card-item">
                <view class="total-card-item-left">{{ $t("附加费用") }}</view>
                <view class="total-card-item-right"><format-price :is-bottom="false" :price-data="total.serviceFee" /></view>
            </view>
            <view v-if="total.shippingFee > 0" class="total-card-item">
                <view class="total-card-item-left">{{ $t("配送费用") }} </view>
                <view class="total-card-item-right special-text"><format-price :is-bottom="false" :price-data="total.shippingFee" /></view>
            </view>
            <view v-if="total.balance > 0" class="total-card-item">
                <view class="total-card-item-left">{{ $t("使用余额") }}</view>
                <view class="total-card-item-right">- <format-price :is-bottom="false" :price-data="total.balance" /></view>
            </view>
            <view v-if="total.pointsAmount > 0 && flowType != 3" class="total-card-item">
                <view class="total-card-item-left">{{ $t(`${configStore.integralName}减免`) }}</view>
                <view class="total-card-item-right">- <format-price :is-bottom="false" :price-data="total.pointsAmount" /></view>
            </view>
            <view v-if="total.discounts > 0" class="total-card-item">
                <view class="total-card-item-left" @click="handleShowDiscountInfo">
                    {{ $t("共优惠") }}
                    <up-icon style="padding-left: 4rpx" size="16" color="#969799" name="info-circle" />
                </view>
                <view class="total-card-item-right">
                    <view> - <format-price :is-bottom="false" :price-data="total.discounts" /> </view>
                </view>
            </view>
            <view v-if="total.orderSendPoint && total.orderSendPoint > 0" class="total-card-tig">
                * {{ $t("该订单完成后，您将预计获得") }} <text class="special-text">{{ total.orderSendPoint }}</text> {{ $t(configStore.integralName) }}
            </view>
        </view>

        <discountInfo v-model="showDiscountInfo" :total="total" discount-type="order" />
    </view>
</template>

<script setup lang="ts">
import { ref, type PropType } from "vue";
import discountInfo from "@/components/product/discountInfo.vue";
import type { Total } from "@/types/order/check";
import { useConfigStore } from "@/store/config";

defineProps({
    total: {
        type: Object as PropType<Total>,
        default: () => ({})
    },
    cartList: {
        type: Array as PropType<any[]>,
        default: () => []
    },
    flowType: {
        type: Number
    }
});

const configStore = useConfigStore();

const showDiscountInfo = ref(false);
const handleShowDiscountInfo = () => {
    showDiscountInfo.value = !showDiscountInfo.value;
};
</script>

<style lang="scss" scoped>
.more-ico {
    width: 36rpx;
    height: 36rpx;
    padding-left: 10rpx;
}
.total-card {
    background-color: #fff;
    box-sizing: border-box;
    padding: 30rpx 32rpx;
    border-radius: 18rpx;
    margin-top: 20rpx;

    .total-card-item {
        padding-bottom: 35rpx;
        display: flex;
        justify-content: space-between;
        &:last-child {
            padding-bottom: 0;
        }

        .total-card-item-left {
            display: flex;
            align-items: center;
        }

        .red {
            color: var(--general);
        }

        .total-card-ico {
            margin-left: 10rpx;
        }
    }

    .total-card-tig {
        display: flex;
        justify-content: flex-end;
        font-size: 24rpx;
        color: #999;
        padding-bottom: 10rpx;

        .special-text {
            color: var(--general);
            padding: 0 5rpx;
        }
    }
}
</style>
