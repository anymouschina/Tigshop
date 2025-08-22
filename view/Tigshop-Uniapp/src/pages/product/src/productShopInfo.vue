<template>
    <view class="shop-info-box">
        <view class="shop-info-title">
            <view class="shop-info-title-left">
                <tig-image :src="shopInfo.shopLogo" />
            </view>
            <view class="shop-info-title-right">{{ shopInfo.shopTitle }}</view>
        </view>
        <view class="shop-info-btn">
            <view class="shop-info-btn-item" @click="handleShopCollection">{{ collectText }}</view>
            <view class="shop-info-btn-item" @click="handleToShop"><text class="iconfont icon-dianpu" /> {{ $t("进店逛逛") }}</view>
        </view>
    </view>
</template>

<script setup lang="ts">
import type { ShopDetailItem } from "@/types/shop/shop";
import { shopCollection } from "@/api/shop/shop";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
    shopInfo: ShopDetailItem;
}
const props = defineProps<Props>();
const emit = defineEmits(["refreshShopDetail"]);

const collectText = computed(() => {
    return props.shopInfo.collectShop ? t("取消收藏") : t("收藏店铺");
});

const handleShopCollection = () => {
    if (props.shopInfo.collectShop) {
        cancelCollect();
    } else {
        collect();
    }
};
const collect = async () => {
    try {
        const result = await shopCollection({ shopId: props.shopInfo.shopId });
        uni.showToast({
            title: t("收藏成功")
        });
        emit("refreshShopDetail", props.shopInfo.shopId);
    } catch (error) {
        console.error(error);
    }
};
const cancelCollect = async () => {
    uni.showModal({
        title: t("提示"),
        content: t("确认要取消收藏店铺吗？"),
        success: async (res) => {
            if (res.confirm) {
                try {
                    const result = await shopCollection({ shopId: props.shopInfo.shopId });
                    uni.showToast({
                        title: t("操作成功")
                    });
                    emit("refreshShopDetail", props.shopInfo.shopId);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    });
};
const handleToShop = () => {
    uni.navigateTo({
        url: `/pages/shop/index?shopId=${props.shopInfo.shopId}`
    });
};
</script>

<style lang="scss" scoped>
.shop-info-box {
    background-color: #fff;
    padding: 0.625rem;
    border-radius: 0.625rem;
    margin-top: 20rpx;

    .shop-info-title {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

        .shop-info-title-left {
            width: 62rpx;
            height: 62rpx;
            overflow: hidden;
            border-radius: 50%;
            margin-right: 20rpx;
            margin-left: 20rpx;
        }

        .shop-info-title-right {
            font-size: 26rpx;
        }
    }

    .shop-info-btn {
        display: flex;
        justify-content: space-between;

        .shop-info-btn-item {
            width: 46%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #d7d7d7;
            border-radius: 5px;
            height: 56rpx;
            font-size: 22rpx;
            color: #686868;
        }
    }
}
</style>
