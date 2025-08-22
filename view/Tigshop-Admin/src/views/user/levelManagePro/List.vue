<template>
    <component :is="AsyncComp"></component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from "vue";
import ErrorComponent from "@/components/ErrorComponent.vue";
const ProList = 'ProList'
const AsyncComp = defineAsyncComponent({
    // 加载函数
    loader: () => import(`./src/${ProList}.vue`),
    errorComponent: ErrorComponent,
    timeout: 3000
});
</script>
