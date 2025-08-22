<template>
    <TigTabs v-model="value" :tabs="options" @onTabChange="onChange"></TigTabs>
</template>
<script setup lang="ts">
import { ref } from "vue";
// 父组件回调
const emit = defineEmits(["callback"]);
const value = ref(0);
const onChange = (status: number) => {
    value.value = status;
    emit("callback", value);
};
const options: any = [
    {
        value: 0,
        label: "全部",
        isShow: true
    },
    {
        value: 1,
        label: "待审核",
        isShow: true
    },
    {
        value: 2,
        label: "审核通过",
        isShow: true
    },
    {
        value: 3,
        label: "审核未通过",
        isShow: true
    }
];
</script>
