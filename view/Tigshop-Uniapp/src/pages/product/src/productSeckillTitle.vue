<template>
    <view class="product-seckill-title flex justify-between align-center">
        <view class="seckill-price-box">
            <view class="title-top-price">
                <view class="price-box">
                    <view class="price">
                        <format-price
                            :font-style="{ fontWeight: 'bold' }"
                            :decimals-style="{
                                fontSize: '24rpx',
                                fontWeight: 'bold'
                            }"
                            :currency-style="{
                                fontSize: '23rpx',
                                fontWeight: 'bold'
                            }"
                            :price-data="productPrice"
                        />
                    </view>
                    <view class="tag-text-box">
                        <view class="tag-text"> {{ $t("秒杀价") }} </view>
                    </view>
                </view>

                <view class="title-top-market_price flex align-center">
                    <view v-if="productOriginPrice && Number(productOriginPrice) > Number(productPrice)" class="originalprice-box">
                        {{ $t("价格") }}
                        <view>
                            <format-price :is-bottom="false" :price-data="productOriginPrice" :font-style="{ 'text-decoration': 'line-through' }" />
                        </view>
                    </view>
                </view>
            </view>
        </view>
        <view class="seckill-time-box">
            <view class="countdown-box flex align-center">
                <view class="title-top-time">{{ $t("距结束还剩") }}</view>
                <tig-countdown :end-time="seckillValue.seckillEndTime" :font-size="11" color="#fff" />
            </view>
            <view class="stock-progress">
                <view class="progress-line-box">
                    <view class="progress-line" :style="{ width: `${progressTextValue}` }" />
                </view>
                <view class="progress-text">{{ $t("仅剩") }} {{ residueNum }} {{ $t("件") }}</view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import type { ProductItem } from "@/types/product/product";
import { computed } from "vue";
interface Props {
    productInfo: ProductItem;
    productPrice: string | number;
    productOriginPrice: string;
    seckillValue: AnyObject;
}
const props = defineProps<Props>();

console.log("seckillValue", props.seckillValue);

const residueNum = computed(() => {
    return props.seckillValue.seckillStock;
});
const seckillPercentage = (sales: number, stock: number) => {
    return Math.round((sales / (stock + sales)) * 100) + "%";
};
const progressTextValue = computed(() => {
    return seckillPercentage(props.seckillValue.seckillSales, props.seckillValue.seckillStock);
});
</script>

<style lang="scss" scoped>
.product-seckill-title {
    margin-bottom: 20rpx;
    background: linear-gradient(45deg, var(--ump-start-bg, #323233), var(--ump-end-bg, #323233));
    padding: 20rpx 20rpx 15rpx 25rpx;
    .title-top-price {
        .price-box {
            display: flex;

            .tag-text-box {
                display: inline-flex;
                align-items: flex-end;
                padding-left: 15rpx;
                position: relative;
                top: -8rpx;

                .tag-text {
                    background-color: #fff;
                    font-size: 20rpx;
                    color: var(--main-bg);
                    padding: 2rpx 6rpx;
                    border-radius: 25rpx;
                }
            }
        }

        .price {
            color: #fff;
            font-size: 36rpx;
            display: flex;
            align-items: center;
        }
        .title-top-market_price {
            .label {
                font-size: 20rpx;
                margin-right: 10rpx;
                .icon {
                    background-color: #fff;
                    border-bottom: 1rpx solid #fff;
                    border-radius: 5rpx 0 0 5rpx;
                }
                .txt {
                    border: 1rpx solid #fff;
                    padding-left: 5rpx;
                    padding-right: 5rpx;
                    color: #fff;
                    border-radius: 0 5rpx 5rpx 0;
                }
            }
            .originalprice-box {
                display: flex;
                font-size: 18rpx;
                color: #fff;
                opacity: 0.7;
            }
        }
    }
    .seckill-time-box {
        .title-top-time {
            font-size: 11px;
            color: #fff;
            padding-right: 8rpx;
        }

        .stock-progress {
            font-size: 11px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: end;
            padding-top: 6rpx;

            .progress-line-box {
                width: 64px;
                height: 4px;
                margin-right: 8px;
                border-radius: 4px;
                background: rgba(0, 0, 0, 0.15);
                overflow: hidden;
                .progress-line {
                    background: rgb(255, 255, 255);
                    height: 100%;
                    width: 0;
                }
            }
        }
    }
}
</style>
