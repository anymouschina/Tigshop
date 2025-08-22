<template>
    <view :style="{ height, background }">
        <up-empty :mode="mode" :text="text" />
    </view>
</template>

<script setup lang="ts">
const props = defineProps({
    mode: {
        type: String,
        default: "search"
    },
    height: {
        type: String,
        default: "300rpx"
    },
    background: {
        type: String,
        default: "#fff"
    },
    text: {
        type: String,
        default: "暂无数据"
    }
});
</script>

<style lang="scss" scoped></style>
