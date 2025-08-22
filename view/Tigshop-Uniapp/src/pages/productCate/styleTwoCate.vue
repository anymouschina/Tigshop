<template>
    <view>
        <tig-navbar title="产品分类" :show-left="false" />
        <search :needMenu="true" @menu="handleMenu" @search="handleSearch" />
        <view class="scroll-box">
            <view class="content-box">
                <view class="side">
                    <menuBox v-model:current-cate-id="currentCateId" @change="reset" />
                </view>
                <view class="list-box">
                    <selectCate
                        v-model:menu-list="menuList"
                        v-model:sub-current-cate-id="subCurrentCateId"
                        :current-cate-id="currentCateId"
                        @change="handleChange"
                    />
                    <view class="list-content">
                        <template v-if="!isLoading && total > 0">
                            <scroll-view :scroll-y="true" class="list-scroll" @scrolltolower="reachBottom">
                                <masonry :commodity-list="list" />
                            </scroll-view>
                        </template>
                        <template v-if="!isLoading && total === 0">
                            <view class="empty-box">
                                <up-empty :icon="staticResource('salesman/no_order.png')" :text="$t('暂无数据')" />
                            </view>
                        </template>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import search from "./src/search.vue";
import menuBox from "./src/menu.vue";
import selectCate from "./src/selectCate.vue";
import masonry from "@/components/masonry/masonry.vue";
import { getCateProduct } from "@/api/home/home";
import { useList } from "@/hooks";
import { staticResource, redirect } from "@/utils";
import type { filterSeleted } from "@/types/productCate/productCate";

const currentCateId = ref(0);

const subCurrentCateId = ref(0);

const menuList = ref<filterSeleted[]>([]);

const props = defineProps({
    height: {
        type: [Number, String],
        default: 0
    }
});

const params = reactive({
    categoryId: 0,
    page: 1,
    size: 10
});

const {
    data: list,
    getList,
    reachBottom,
    isLoading,
    total
} = useList(getCateProduct, {
    params,
    path: {
        dataKey: "records"
    },
    needReachBottom: false
});

const handleChange = () => {
    list.value = [];
    params.page = 1;
    if (subCurrentCateId.value === 0) {
        params.categoryId = currentCateId.value;
    } else {
        params.categoryId = subCurrentCateId.value;
    }
    getList();
};

const reset = () => {
    subCurrentCateId.value = 0;
    list.value = [];
    menuList.value = [];
    params.page = 1;
};

const handleMenu = () => {
    redirect({
        url: "/pages/index/index",
        success: function success() {}
    });
};
const handleSearch = () => {
    redirect({
        url: "/pages/search/index"
    });
};

const height = computed(() => {
    return `calc(${props.height} - 90rpx)`;
});
</script>
<style>
/* 兼容小程序 */
page {
    background-color: #fff !important;
}
</style>
<style lang="scss" scoped>
.scroll-box {
    height: v-bind("height");
    overflow: hidden;
}

.content-box {
    height: 100%;
    width: 100%;
    display: flex;

    .side {
        width: 90px;
        height: 100%;
        background-color: #f7f7f7;
    }

    .list-box {
        width: calc(100% - 90px);
        height: 100%;

        .list-content {
            height: calc(100% - 100rpx);

            .list-scroll {
                height: 100%;
            }

            .empty-box {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
            }
        }
    }
}
</style>
