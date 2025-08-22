<template>
    <tig-layout :title="navbarTitle" :shop-id="shopId" :background="pageModulesData.titleBackgroundColor" :color="pageModulesData.titleColor">
        <view class="decorate-page-window" :style="{ ...cssVariable }">
            <modules v-if="Object.keys(shopInfo).length > 0" :modules="modulesList" :shop-info="shopInfo" @refresh-shop-detail="getShopInfo" />
        </view>
    </tig-layout>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref, computed } from "vue";
import { getShopDecorate, getShopDetail } from "@/api/shop/shop";
import modules from "@/components/modules/shopModules.vue";
import type { ShopDetailItem } from "@/types/shop/shop";
import type { PageModule } from "@/types/home/home";

const shopId = ref(0);

onLoad((options) => {
    if (options && options.shopId) {
        shopId.value = options.shopId;
        getShopInfo();
        __getShopDecorate();
    }
});

const navbarTitle = ref("店铺详情");

const modulesList = ref<any[]>([]);
const pageModulesData = ref<PageModule>({} as PageModule);

const __getShopDecorate = async () => {
    try {
        const result = await getShopDecorate(shopId.value);
        modulesList.value = result.moduleList;
        pageModulesData.value = result.pageModule;  
    } catch (error) {
        console.error(error);
    }
};

const cssVariable = computed(() => {
    return {
        "background-color": `${pageModulesData.value.backgroundColor}`,
        "background-image": `url("${pageModulesData.value.backgroundImage?.picUrl}")`,
        "background-size": `${getSize(pageModulesData.value?.backgroundSize)}`,
        "background-repeat": `${getRepeat(pageModulesData.value?.backgroundRepeat)}`
    };
});


const getSize = (key: string) => {
    let repeat:{[key: string]: any} = {
        '1': '100% auto',
        '2': 'auto 100%',
        '3': '100% 100%',
    }
    return repeat[key]
}

const getRepeat = (key: string) => {
    let repeat:{[key: string]: any} = {
        '1': 'no-repeat',
        '2': 'repeat',
        '3': 'repeat-x',
        '4': 'repeat-y'
    }
    return repeat[key]
}

const shopInfo = ref<ShopDetailItem>({} as ShopDetailItem);
const getShopInfo = async () => {
    try {
        const result = await getShopDetail(shopId.value);
        shopInfo.value = result;
        navbarTitle.value = result.shopTitle;
    } catch (error: any) {
        console.error(error);
    }
};
</script>

<style lang="scss" scoped></style>
