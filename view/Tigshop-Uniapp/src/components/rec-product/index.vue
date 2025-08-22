<template>
    <div class="recgoods-box">
        <div class="title">
            <div class="bg" />
            <navigator url="/pages/search/index">
                <div class="moregoods">{{ $t("查看更多") }} <span class="iconfont icon-xiangyou" /></div>
            </navigator>
        </div>
        <div class="wrap-goods">
            <view v-for="(item, index) in signInfo.recommendGoods" :key="index" class="item" @click="toProductPage(item)">
                <img class="rec-img" :alt="item.productName" :src="imageFormat(item.picThumb)" />
                <div class="info">
                    <div class="name">{{ item.productName }}</div>
                    <format-price class="price" :price-data="item.productPrice" />
                </div>
            </view>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { imageFormat } from "@/utils/format";
import { getSignList } from "@/api/user/sign";
import type { SignInfo } from "@/types/user/sign";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = defineProps({
    url: {
        type: String,
        required: true
    }
});

const signInfo = ref<SignInfo>({
    signPoints: 0,
    record: 0,
    isSign: 0,
    days: [],
    recommendGoods: []
});

const __getSignList = async () => {
    uni.showLoading({
        title: t("加载中")
    });
    try {
        const result = await getSignList(props.url);
        Object.assign(signInfo.value, result);
    } catch (error) {
        console.error(error);
    } finally {
        uni.hideLoading();
    }
};

const toProductPage = (params: any) => {
    uni.navigateTo({ url: "/pages/product/index?id=" + params.productId });
};

onMounted(() => {
    __getSignList();
});
</script>
<style lang="scss" scoped>
.recgoods-box {
    margin: 0 20rpx;
    background: #fff;
    border-radius: 18rpx;

    .title {
        display: flex;
        flex-wrap: nowrap;
        height: 100rpx;
        line-height: 100rpx;
        justify-content: space-between;

        .bg {
            width: 400rpx;
            background-image: url("https://demo.tigshop.cn/static/mini/images/user/qiandao/3.png");
            background-repeat: no-repeat;
            background-size: 100% 100%;
        }

        .moregoods {
            display: flex;
            align-items: center;
            font-size: 24rpx;
            color: #999;
            padding-top: 10rpx;
            padding-right: 20rpx;
        }
    }

    .wrap-goods {
        padding: 20rpx;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        column-gap: 10rpx;
        row-gap: 20rpx;

        .item {
            display: flex;
            flex-direction: column;
            text-align: center;

            img {
                width: 100%;
                height: auto;
                border-radius: 18rpx;
                border: 2rpx solid #efefef;
            }

            .name {
                padding: 0 30rpx;
                height: 40rpx;
                line-height: 40rpx;
                overflow: hidden;
                font-weight: 500;
                color: #333;
                font-size: 24rpx;
                margin-top: 8rpx;
            }

            .price {
                font-size: 24rpx;
                color: #e45363;
            }
        }
    }
}
</style>
