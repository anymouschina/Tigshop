<template>
    <view class="menu-content">
        <scroll-view scroll-y="true" class="menu-scroll">
            <template v-for="(item, index) in menuList" :key="item.categoryId">
                <view class="menu-item" :class="{ active: currentCateId === item.categoryId }" @click="handleClick(item.categoryId)">{{
                    item.categoryName
                }}</view>
            </template>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { getCategoryList } from "@/api/productCate/productCate";
import type { filterSeleted } from "@/types/productCate/productCate";
import { shallowRef } from "vue";

const currentCateId = defineModel<number>("currentCateId");

const emit = defineEmits(["change"]);

const menuList = shallowRef<filterSeleted[]>([]);

const getMenuList = async () => {
    try {
        const result = await getCategoryList(0);
        menuList.value = result;
        currentCateId.value = result[0].categoryId;
    } catch (error) {
        console.error(error);
    }
};

getMenuList();

const handleClick = (id: number) => {
    if (id === currentCateId.value) return;
    currentCateId.value = id;
    emit("change", id);
};
</script>

<style lang="scss" scoped>
.menu-content {
    height: 100%;
    width: 100%;
    .menu-scroll {
        height: 100%;

        .menu-item {
            min-height: 50px;
            padding-left: 6px;
            width: 100%;
            font-size: 13px;
            color: #424242;
            text-align: center;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;

            &.active {
                color: var(--general);
                background-color: #fff;

                &::after {
                    content: "";
                    width: 3px;
                    height: 18px;
                    background-color: var(--general);
                    border-radius: 2px;
                    position: absolute;
                    left: 0;
                }
            }
        }
    }
}
</style>
