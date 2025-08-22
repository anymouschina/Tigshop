<template>
    <view class="noCart">
        <view class="pictrue"><image lazy-load :src="staticResource('cart_empty.png')" /></view>
        <view class="noCart_text">{{ $t("购物车内还没商品哦，去逛逛吧") }}~</view>
    </view>
</template>

<script setup lang="ts">
import { staticResource } from "@/utils";
</script>

<style lang="scss" scoped>
.noCart {
    padding-top: 100rpx;
    background-color: #fff;
    padding-bottom: 100rpx;
    border-radius: 0 0 18rpx 18rpx;
}
.noCart .pictrue {
    width: 220rpx;
    height: 220rpx;
    margin: 0 auto;
}
.noCart .pictrue image {
    width: 100%;
    height: 100%;
}
.noCart .noCart_text {
    text-align: center;
    padding-top: 30rpx;
}
</style>
