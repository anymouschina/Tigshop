<template>
    <div class="div-main">
        <div class="text-right flex" style="justify-content: flex-end;">
            <div> + 商品总金额：<span class="money-style">{{ priceFormat(modelValue.productAmount) }}</span></div>
            <div> + 订单运费：<span class="money-style">{{ priceFormat(modelValue.shippingFee) }}</span></div>
            <div> + 附加费用：<span class="money-style">{{ priceFormat(modelValue.serviceFee) }}</span></div>
            <div v-if="modelValue.couponAmount > 0">
                - 优惠券抵扣：<span class="money-style">{{ priceFormat(modelValue.couponAmount) }}</span>
            </div>
            <div v-if="modelValue.discountAmount > 0">
                - 优惠折扣：<span class="money-style">{{ priceFormat(modelValue.discountAmount) }}</span>
            </div>
            <div v-if="modelValue.pointsAmount > 0">
                - 积分抵扣：<span class="money-style">{{ priceFormat(modelValue.pointsAmount) }}</span>
            </div>
            <div v-if="modelValue.onlinePaidAmount > 0">
                - 线上支付：<span class="money-style">{{ priceFormat(modelValue.onlinePaidAmount) }}</span>
            </div>
            <div v-if="modelValue.offlinePaidAmount > 0">
                - 线下支付：<span class="money-style">{{ priceFormat(modelValue.offlinePaidAmount) }}</span>
            </div>
        </div>
        <div class="text-right">= 订单总金额：<span class="money-style">{{ priceFormat(modelValue.totalAmount) }}</span></div>
        <div class="text-right">
            实收金额：<span class="money-style">{{ priceFormat(Number(modelValue.paidAmount)) }}</span>
            <span class="money-style2" v-if="modelValue.balance > 0">(使用余额: {{ priceFormat(modelValue.balance) }})</span>
        </div>
        <!-- <div class="text-right">= 未付款金额：<span class="money-style">{{ priceFormat(modelValue.unpaidAmount) }}</span></div> -->
        <div class="text-right" v-if="modelValue.refundAmount > 0">售后协商金额：<span class="money-style">{{ priceFormat(modelValue.refundAmount) }}</span></div>
    </div>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import type { OrderFormState } from "@/types/order/order";
import { priceFormat } from "@/utils/format";

const props = defineProps({
    modelValue: {
        type: Object,
        default: {
            productAmount: 0,
            couponAmount: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            discountAmount: 0,
            pointsAmount: 0,
            balance: 0,
            onlinePaidAmount: 0,
            offlinePaidAmount: 0,
        }
    }
})
</script>
<style lang="less" scoped>
.div-main {
    padding: 20px;
    background-color: #f5f8ff;
    text-align: right;

    .text-right {
        width: 100%;
        line-height: 26px;
        text-align: right;
        font-size: 12px;
    }

    .text-right>div {
        padding-left: 5px;
    }

    .money-style {
        font-size: 14px;
        color: #F64747;
        font-weight: bold;
    }
    .money-style2 {
        margin-left: 10px;
    }
}
</style>
