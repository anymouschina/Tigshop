<template>
    <template v-for="(item, index) in modules" :key="index">
        <template v-if="item.type === 'bannerList' && item.module.bannerList.picUrl">
            <advertising :data="item.module.bannerList" />
        </template>
        <template v-else-if="item.type === 'menus'">
            <myService :menu-type="item.module.menuType" :data="item.module.menuList" />
        </template>
    </template>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import myService from "./myService/index.vue";
import advertising from "./advertising/index.vue";

const props = defineProps({
    modules: {
        type: Array as PropType<any[]>,
        default: () => []
    }
});
</script>

<style lang="scss" scoped></style>
