<template>
    <up-loading-page :font-size="fontSize" :loading="modelValue" :image="image" :loading-text="$t(loadingText)" :loading-mode="mode" />
</template>

<script setup lang="ts">
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: true,
        required: true
    },
    loadingText: {
        type: String,
        default: "加载中"
    },
    mode: {
        type: String,
        default: "circle"
    },
    image: {
        type: String,
        default: ""
    },
    fontSize: {
        type: String,
        default: "16"
    }
});
const emit = defineEmits(["update:modelValue"]);
</script>

<style lang="scss" scoped></style>
