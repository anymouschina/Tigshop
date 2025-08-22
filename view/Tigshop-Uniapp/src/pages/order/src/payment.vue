<template>
    <view class="paymentType">
        <view class="pay-list">
            <radio-group class="radio-group" @change="paymentChange">
                <template v-for="(payment, idx) in paymentList" :key="idx">
                    <view class="item">
                        <view class="payment-info">
                            <image v-if="payment !== 'offline'" class="payment-info-img" :src="staticResource('payment/pay_' + payment + '.png')" />
                            <view class="payment-info-text">
                                {{ $t(paymentText[payment!]) }}
                            </view>
                        </view>
                        <radio
                            :value="payment"
                            active-background-color="var(--general)"
                            :checked="payment === modelValue"
                            style="margin-right: 20rpx; transform: scale(0.9)"
                        />
                    </view>
                </template>
            </radio-group>
        </view>
    </view>
</template>

<script setup lang="ts">
import { staticResource } from "@/utils";

interface Props {
    paymentList: string[];
    modelValue: string;
}
defineProps<Props>();

const emit = defineEmits(["update:modelValue"]);

const paymentText: { [key: string]: string } = {
    wechat: "微信支付",
    alipay: "支付宝支付",
    paypal: "PayPal支付",
    offline: "线下支付",
    yabanpayWechat: "微信支付",
    yabanpayAlipay: "支付宝支付",
    yunpayWechat: "微信支付",
    yunpayAlipay: "支付宝支付",
    yunpayYunshanfu: "云闪付"
};

const paymentChange = (e: any) => {
    emit("update:modelValue", e.detail.value);
};
</script>

<style lang="scss" scoped>
.pay-list {
    background: #fff;
    padding: 5rpx 36rpx 15rpx;
    border-radius: 18rpx;
    margin-top: 40rpx;
}
.pay-list .item:last-child {
    border: 0;
}
.pay-list .item {
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100rpx;
    border-bottom: 1rpx solid #eee;
    padding-top: 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .payment-info {
        display: flex;
        align-items: center;

        .payment-info-text {
            min-width: 145rpx;
            padding-left: 15rpx;
        }

        .payment-info-img {
            width: 66rpx;
            height: 66rpx;
        }
    }
}
</style>
