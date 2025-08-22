<template>
    <tig-layout title="发票管理">
        <view class="invoice-management">
            <view class="invoice-menu">
                <template v-for="item in menuTypeList" :key="item.type">
                    <view class="invoice-menu-item" :class="{ active: currentType === item.type }" @click="handleMenuType(item.type)">
                        <text class="invoice-menu-item-text">{{ $t(item.value) }}</text>
                    </view>
                </template>
            </view>
            <view class="placeholder" />
            <view class="invoice-content">
                <template v-if="currentType === 'list'">
                    <invoiceList ref="invoiceListRef" />
                </template>
                <template v-if="currentType === 'invoice'">
                    <certification />
                </template>
            </view>
        </view>
    </tig-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onReachBottom } from "@dcloudio/uni-app";
import invoiceList from "./src/invoiceList.vue";
import certification from "./src/certification.vue";

const menuTypeList = [
    { type: "list", value: "发票申请" },
    { type: "invoice", value: "增票资质" }
];
const invoiceListRef = ref();
const currentType = ref("list");

const handleMenuType = (type: string) => {
    currentType.value = type;
};

onLoad((options) => {
    if (options && options.type) {
        currentType.value = options.type;
    }
});

onReachBottom(() => {
    if (currentType.value === "list") {
        if (invoiceListRef.value.filterParams.page < Math.ceil(invoiceListRef.value.total / invoiceListRef.value.filterParams.size)) {
            invoiceListRef.value.filterParams.page++;
            invoiceListRef.value.__getOrderList();
        }
    }
});
</script>

<style lang="scss" scoped>
.placeholder {
    height: 88rpx;
}
.invoice-menu {
    background-color: #fff;
    display: flex;
    box-sizing: border-box;
    margin-bottom: 30rpx;
    position: fixed;
    width: 100%;
    z-index: 88;

    .invoice-menu-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 88rpx;
        position: relative;

        .invoice-menu-item-text {
            padding: 0 10rpx 0 0;
        }
        &.active {
            color: #333;

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

.invoice-content {
    padding: 20rpx;
}
</style>
