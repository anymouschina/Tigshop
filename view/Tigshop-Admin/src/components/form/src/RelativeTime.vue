<template>
    <span>{{ formattedTime }}</span>
</template>

<script lang="ts" setup>
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { ref, computed, watchEffect } from "vue";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const props = defineProps({
    time: {
        type: String,
        default: ""
    }
});

const now = ref(dayjs()); // 当前时间的响应式引用

// 计算相对时间
const formattedTime = computed(() => {
    return dayjs(props.time).from(now.value);
});

watchEffect((onCleanup) => {
    const diffInSeconds = dayjs().diff(dayjs(props.time), 'second');
    let refreshInterval;

    // 设置刷新间隔时间
    if (diffInSeconds < 60) {
        refreshInterval = 10000; // 1分钟以内，每10秒刷新
    } else if (diffInSeconds < 3600) {
        refreshInterval = 60000; // 1小时以内，每分钟刷新
    } else if (diffInSeconds < 86400) {
        refreshInterval = 600000; // 1小时到24小时，每10分钟刷新
    } else if (diffInSeconds < 604800) {
        refreshInterval = 3600000; // 1天到1周，每小时刷新
    } else {
        refreshInterval = 86400000; // 超过1周，每天刷新
    }

    // 设置定时器来更新 `now`，从而触发 `formattedTime` 的重新计算
    const intervalId = setInterval(() => {
        now.value = dayjs(); // 更新当前时间
    }, refreshInterval);

    // 在组件卸载时清除定时器
    onCleanup(() => clearInterval(intervalId));
});
</script>

<style lang="less" scoped></style>
