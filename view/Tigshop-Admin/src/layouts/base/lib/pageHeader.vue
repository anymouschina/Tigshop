<template>
    <div class="header-title-warp">
        <div class="breadcrumb">
            <ul>
                <li v-for="(item, index) in routerMatched" :key="item.path">
                    <span class="breadcrumb-span">{{ removeSuffix(item.meta.title) }}</span
                    ><span class="breadcrumb-separator" v-if="index < routerMatched.length - 1">/</span>
                </li>
            </ul>
        </div>
        <div class="page-header-heading">
            <div class="page-header-heading-left">
                <span class="page-header-heading-title" v-if="!hideHeaderList.includes(currentRouteName)">{{ removeSuffix(title) }}</span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/store/app";
import { removeSuffix } from "@/utils/authorize";
const appStore = useAppStore();
const router = useRouter();
const title = ref("");
const routerMatched = ref(<any>[]);
const hideHeaderList = ["overviewManage"];
const currentRouteName = ref("");
routerMatched.value = router.currentRoute.value.matched;
// 监听路由的变化
watchEffect(() => {
    title.value = appStore.getHeaderTitle;
    routerMatched.value = router.currentRoute.value.matched;
    currentRouteName.value = (router.currentRoute.value.name as string) || "";
});
</script>
<style lang="less">
/*头部通用标题和导航*/
.header-title-warp {
    padding: 20px 16px 0 16px;
}

.header-title-warp .breadcrumb {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-variant: tabular-nums;
    line-height: 1.5;
    list-style: none;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
}

.header-title-warp .breadcrumb ul {
    display: flex;
}

.header-title-warp .breadcrumb span.breadcrumb-span {
    color: #666;
}

.header-title-warp .breadcrumb > ul > li:last-child span.breadcrumb-span {
    color: #999;
}

.header-title-warp .breadcrumb .breadcrumb-separator {
    margin: 0 8px;
    color: rgba(0, 0, 0, 0.45);
}

.header-title-warp .breadcrumb > span:last-child .breadcrumb-separator {
    display: none;
}

.header-title-warp .page-header-heading {
    display: flex;
    justify-content: space-between;
}

.header-title-warp .breadcrumb + .page-header-heading {
    margin-top: 8px;
}

.header-title-warp .page-header-heading-left {
    display: flex;
    align-items: center;
    margin: 4px 0;
    overflow: hidden;
}

.header-title-warp .page-header-heading-title {
    margin-right: 12px;
    margin-bottom: 0;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
    font-size: 18px;
    line-height: 32px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

@media only screen and (max-width: 767px) {
    .header-title-warp {
        padding-top: 20px;
    }
}
</style>
