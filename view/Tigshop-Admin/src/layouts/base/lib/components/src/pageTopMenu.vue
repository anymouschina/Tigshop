<template>
    <div class="page-top" :class="{ 'shop-admin': adminType === 'merchant' }">
        <div class="page-top-warp" :class="{ dark: themeInfo.navTheme === 'dark' }">
            <div class="top-bar-left flex flex-align-center">
                <div class="info-bar" v-if="screenWidth >= 900">
                    <div class="head_logo" v-if="adminType === 'admin' && isLogoLoaded">
                        <img
                            v-if="licensedData.adminLightLogo && licensedData.adminLightLogo !== null"
                            class="logo_img"
                            :src="imageFormat(licensedData.adminLightLogo)"
                        />
                        <img v-else class="logo_img" :src="logoWhite" />
                    </div>
                    <div class="head_shop_logo" v-if="adminType === 'shop'" @click="$router.push('/')">
                        <div class="flex flex-align-center">
                            <template v-if="shopInfo.shopLogo">
                                <template v-if="extractContent(String(shopInfo.shopLogo)) == 'def'">
                                    <img class="logo_img" :src="returnAvatar(shopInfo.shopLogo)" />
                                </template>
                                <template v-else>
                                    <img class="logo_img" :src="imageFormat(shopInfo.shopLogo)" />
                                </template>
                            </template>
                            <template v-else>
                                <img class="logo_img" src="@/assets/logo/merchant_logo.png" />
                            </template>
                            <div class="shop-tit line1">{{ shopInfo.shopTitle }}</div>
                        </div>
                        <i class="iconfont-admin icon-image_hotarea" @click.stop="$router.push('/setting')"></i>
                    </div>
                    <div class="head_shop_logo" v-if="adminType === 'vendor'" @click="$router.push('/')">
                        <div class="flex flex-align-center">
                            <template v-if="vendorInfo.vendorLogo">
                                <template v-if="extractContent(String(vendorInfo.vendorLogo)) == 'def'">
                                    <img class="logo_img" :src="returnAvatar(vendorInfo.vendorLogo)" />
                                </template>
                                <template v-else>
                                    <img class="logo_img" :src="imageFormat(vendorInfo.vendorLogo)" />
                                </template>
                            </template>
                            <template v-else>
                                <img class="logo_img" src="@/assets/logo/supplier_logo.png" />
                            </template>
                            <div class="shop-tit line1">{{ vendorInfo.vendorName }}</div>
                        </div>
                        <i class="iconfont-admin icon-image_hotarea" @click.stop="$router.push('/setting')"></i>
                    </div>
                </div>
                <div v-else class="top-bar-item wap-show" @click="menusStore.menuActive = !menusStore.menuActive">
                    <span class="open-menu-btn iconfont icon-zhankai"></span>
                </div>
                <topMenu v-if="screenWidth >= 900"></topMenu>
            </div>
            <div class="top-bar-right">
                <div class="top-bar-item mr10">
                    <Licensed></Licensed>
                </div>
                <MsgCount></MsgCount>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { extractContent } from "@/utils/util";
import { returnAvatar } from "@/utils/avatar";
import { useUserStore } from "@/store/user";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useLicensedStore } from "@/store/licensed";
import MsgCount from "../../src/MsgCount.vue";
import { useThemeStore } from "@/store/theme";
import { useMenusStore } from "@/store/menu";
import { imageFormat } from "@/utils/format";
import logoWhite from "@/style/images/logo_white.png";
import topMenu from "./topMenu.vue";
import Licensed from "@/layouts/base/lib/src/Licensed.vue";
import { set } from "lodash-es";
const isLogoLoaded = ref(false);
const menusStore = useMenusStore();
const { themeInfo } = useThemeStore();
const adminType = ref(localStorage.getItem("adminType"));
const shopInfo = computed(() => useUserStore().shopInfo);
const vendorInfo = computed(() => useUserStore().vendorInfo);
const licensedStore = useLicensedStore();
const licensedData = licensedStore.licensedData;
const screenWidth = ref(window.innerWidth);
const handleResize = () => {
    screenWidth.value = window.innerWidth;
};
onMounted(() => {
    licensedStore._getLicensed();
    window.addEventListener("resize", handleResize);
    setTimeout(() => {
        isLogoLoaded.value = true;
    }, 100);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
});
</script>
<style lang="less" scoped>
.page-top {
    background: #eef2ff;
    clear: both;
    height: 60px;
    z-index: 100;
    border-bottom: 1px solid #f0f2f5;
    box-sizing: border-box;
}

.page-top-warp {
    background: var(--tig-menu-bg);
    border-radius: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &.dark {
        border-radius: 0;
    }
}

.top-bar-left {
    margin-left: 10px;
    .info-bar {
        width: 230px;
        margin-right: 15px;
        .head_logo {
            display: flex;
            align-items: center;
            height: 100%;
            .logo_img {
                width: 110px;
            }
        }
        .head_shop_logo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 10px;
            cursor: pointer;
            color: var(--tig-menu-text-color);
            img {
                width: 30px;
                height: 30px;
                border-radius: 26px;
                background-color: #fff;
                object-fit: contain;
            }
            .shop-tit {
                width: 160px;
                margin-left: 10px;
            }
            i {
                font-size: 12px;
                display: none;
            }
            &:hover {
                background-color: #9c9c9c2e;
                border-radius: 2px;
                i {
                    display: block;
                }
            }
        }
    }
}

.top-bar-right {
    float: right;
    display: flex;
    align-items: center;
}
.wap-show {
    display: none;
}

@media only screen and (max-width: 767px) {
    .wap-show {
        display: block;
    }
    .open-menu-btn {
        padding: 0 20px;
        display: block;
        line-height: 58px;
        cursor: pointer;
        color: var(--tig-menu-text-color);
    }
    .top-bar-item .top-bar-btn {
        word-break: keep-all;
        margin: 0;
        padding-left: 10px;
    }
}
</style>
