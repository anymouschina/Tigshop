<template>
    <tig-popup v-model:show="showDiscountInfo" :z-index="10" background-color="#fff">
        <view class="discount">
            <view class="discount-title">
                <view class="title-text">{{ $t("优惠明细") }}</view>
            </view>
            <view class="discount-content">
                <view class="discount-item-box">
                    <view class="item-label">{{ $t("商品总额") }}</view>
                    <view class="item-value">
                        <format-price :show-text="false" :is-bottom="false" :price-data="total.productAmount" :font-style="{ fontWeight: 'bold' }" />
                    </view>
                </view>
                <view v-if="total.serviceFee && total.serviceFee > 0" class="discount-item-box">
                    <view class="item-label">{{ $t("附加费用") }}</view>
                    <view class="item-value">
                        <format-price :show-text="false" :is-bottom="false" :price-data="total.serviceFee" :font-style="{ fontWeight: 'bold' }" />
                    </view>
                </view>
                <view class="discount-item-box hassub">
                    <view class="flex justify-between">
                        <view class="item-label">{{ $t("共优惠") }}</view>
                        <view class="item-value discounts-value" style="color: var(--general)">
                            -
                            <format-price :show-text="false" :is-bottom="false" :price-data="total.discounts" />
                        </view>
                    </view>
                    <view v-if="total.discountCouponAmount > 0" class="sub-item-box">
                        <view class="sub-item-label"> {{ $t("优惠券") }} </view>
                        <view class="sub-item-value discounts-value">
                            -
                            <format-price :show-text="false" :is-bottom="false" :price-data="total.discountCouponAmount" />
                        </view>
                    </view>
                    <view v-if="total.discountDiscountAmount > 0" class="sub-item-box">
                        <view class="sub-item-label"> {{ $t("其他优惠") }} </view>
                        <view class="sub-item-value discounts-value">
                            -
                            <format-price :show-text="false" :is-bottom="false" :price-data="total.discountDiscountAmount" />
                        </view>
                    </view>
                </view>
                <view class="discount-item-box">
                    <view class="item-label">{{ $t("合计") }}</view>
                    <view class="item-value">
                        <format-price :show-text="false" :is-bottom="false" :price-data="total.discountAfter" :font-style="{ fontWeight: 'bold' }" />
                    </view>
                </view>
                <view v-if="!discountType" class="discount-desc">{{ $t("以上优惠不包含运费，实际优惠金额请以确认订单页为准") }}</view>
            </view>
        </view>
    </tig-popup>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    total: {
        type: Object,
        default: () => ({})
    },
    discountType: {
        type: String,
        default: ""
    }
});

const emit = defineEmits(["update:modelValue"]);
const showDiscountInfo = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
    }
});
</script>

<style lang="scss" scoped>
.discount {
    min-height: 60vh;
}
.discount-title {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    padding: 30rpx;
}

.discount-content {
    padding: 30rpx;
    padding-top: 0;
    font-size: 26rpx;
    .discount-item-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20rpx 0;

        .discounts-value {
            font-weight: bold;
        }

        .item-value {
            font-size: 28rpx;
        }
        &.hassub {
            display: block;
        }
        .sub-item-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20rpx 0 15rpx;
            color: #969799;
            font-size: 24rpx;
        }

        &:last-child {
            padding-top: 0;
        }
    }

    .discount-desc {
        font-size: 21rpx;
        color: #969799;
        letter-spacing: 0;
    }
}
</style>
