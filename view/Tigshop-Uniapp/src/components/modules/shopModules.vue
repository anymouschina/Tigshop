<template>
    <view>
        <template v-for="(module, index) in modules" :key="index">
            <template v-if="module.type == 'notice'">
                <notice :module="module.module" />
            </template>

            <template v-if="module.type == 'titleAd'">
                <titleAd :module="module.module" />
            </template>

            <template v-if="module.type == 'imageAd'">
                <imageAd :module="module.module" />
            </template>

            <template v-if="module.type == 'imageNav'">
                <imageNav :module="module.module" />
            </template>

            <template v-if="module.type == 'coupon'">
                <coupon :module="module.module" :shop-id="props.shopInfo.shopId" />
            </template>
            <template v-if="module.type == 'whiteBlank'">
                <whiteBlank :module="module.module" />
            </template>

            <template v-if="module.type == 'whiteLine'">
                <whiteLine :module="module.module" />
            </template>

            <template v-if="module.type == 'imageSquareAd'">
                <imageSquareAd :module="module.module" />
            </template>

            <template v-if="module.type == 'imageHotarea'">
                <imageHotarea :module="module.module" />
            </template>

            <template v-if="module.type == 'shopInfo'">
                <shopInfo :module="module.module" :shop-info="props.shopInfo" @refresh-shop-detail="emit('refreshShopDetail')" />
            </template>

            <template v-if="module.type == 'product'">
                <product :shop-id="props.shopInfo.shopId" :module="module.module" :module-index="module.moduleIndex" />
            </template>

            <template v-if="module.type == 'categoryNav'">
                <categoryNav :module="module.module" :module-index="module.moduleIndex" />
            </template>
            <template v-if="module.type == 'categoryNavA2'">
                <categoryNavA2 :module="module.module" :module-index="module.moduleIndex" />
            </template>
            <template v-if="module.type == 'banner'">
                <banner :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'slidingImage'">
                <SlidingImage :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'slideLargeImage'">
                <slideLargeImage :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'comboSuggestions'">
                <comboSuggestions :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'noticeA2'">
                <noticeA2 :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'specialOffer'">
                <specialOffer :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'mixedProductDisplay'">
                <mixedProductDisplay :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'categoryRec'">
                <categoryRec :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'countdown'">
                <countdown :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'groupSliding'">
                <groupSliding :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'productGrouping'">
                <productGrouping :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'imageTextComponent'">
                <imageTextComponent :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
            <template v-if="module.type == 'categoryNavA1'">
                <categoryNavA1 :module="module.module" :module-index="module.moduleIndex" :index="index" />
            </template>
        </template>
    </view>
</template>

<script lang="ts" setup>
import notice from "@/components/modules/notice/index.vue";
import titleAd from "@/components/modules/titleAd/index.vue";
import imageAd from "@/components/modules/imageAd/index.vue";
import whiteBlank from "@/components/modules/whiteBlank/index.vue";
import whiteLine from "@/components/modules/whiteLine/index.vue";
import imageSquareAd from "@/components/modules/imageSquareAd/index.vue";
import imageNav from "@/components/modules/imageNav/index.vue";
import coupon from "@/components/modules/coupon/index.vue";
import imageHotarea from "@/components/modules/imageHotarea/index.vue";
import product from "@/components/modules/product/index.vue";
import shopInfo from "@/components/modules/shopInfo/index.vue";
import categoryNav from "@/components/modules/categoryNav/index.vue";
import categoryNavA2 from "@/components/modules/categoryNavA2/index.vue";
import SlidingImage from "@/components/modules/slidingImage/index.vue";
import banner from "@/components/modules/banner/index.vue";
import slideLargeImage from "@/components/modules/slideLargeImage/index.vue";
import comboSuggestions from "@/components/modules/comboSuggestions/index.vue";
import noticeA2 from "@/components/modules/noticeA2/index.vue";
import specialOffer from "@/components/modules/specialOffer/index.vue";
import mixedProductDisplay from "@/components/modules/mixedProductDisplay/index.vue";
import categoryRec from "@/components/modules/categoryRec/index.vue";
import countdown from "@/components/modules/countdown/index.vue";
import groupSliding from "@/components/modules/groupSliding/index.vue";
import productGrouping from "@/components/modules/productGrouping/index.vue";
import imageTextComponent from "@/components/modules/imageTextComponent/index.vue";
import categoryNavA1 from "@/components/modules/categoryNavA1/index.vue";
import type { ShopDetailItem } from "@/types/shop/shop";

interface Props {
    modules: any[];
    shopInfo: ShopDetailItem;
}
const props = defineProps<Props>();
const emit = defineEmits(["refreshShopDetail"]);
</script>
<style>
@import "../../static/css/modules.css";
</style>
