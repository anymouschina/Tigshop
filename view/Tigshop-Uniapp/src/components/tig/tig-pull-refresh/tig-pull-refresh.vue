<template>
    <view class="pull">
        <view
            ref="pullBox"
            class="pull-container"
            :class="{ 'pull-transition': is_end }"
            :style="pullInfo.style"
            @touchstart="handlerStart"
            @touchmove="handlerMove"
            @touchend="handlerEnd"
        >
            <view class="pull-head">
                <view class="pull-text-box">
                    <up-loading-icon v-if="is_end" mode="circle" size="18" /><view class="pull-text">{{ pullInfo.tipText }}</view>
                </view>
            </view>
            <view class="pull-body">
                <slot />
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useConfigStore } from "@/store/config";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
    threshold: {
        type: Number,
        default: 60
    },
    scrollTop: {
        type: Number,
        default: 0
    }
});
const configStore = useConfigStore();
const thresholdVal = computed(() => {
    // #ifdef MP-WEIXIN
    return props.threshold + configStore.safeAreaInsets.top;
    // #endif
    return props.threshold;
});
// #ifdef MP-WEIXIN
const paddingTop = computed(() => {
    return configStore.safeAreaInsets.top + "px";
});
// #endif
interface IPullInfo {
    style: string;
    tipText: string;
    startY: number;
    deltaY: number;
    slowY: number;
    resetTimer: number | null;
    resetTime: number;
}
const emit = defineEmits(["load"]);
const pullInfo = reactive<IPullInfo>({
    style: "",
    tipText: "",
    startY: 0,
    deltaY: 0,
    slowY: 0,
    resetTimer: null,
    resetTime: 500
});
const is_end = ref(false);
const handlerStart = (e: any) => {
    // console.log("handlerStart", e);
    pullInfo.startY = e.touches[0].pageY;
    pullInfo.style = "transition: transform 0s";
};
const handlerMove = (e: any) => {
    // console.log("handlerMove", e);
    // console.log('props.scrollTop', props.scrollTop)
    if (props.scrollTop === 0) {
        pullInfo.deltaY = e.touches[0].pageY - pullInfo.startY;
        if (pullInfo.deltaY > 0) {
            e.preventDefault();
            pullInfo.tipText = t("下拉刷新");
            if (pullInfo.deltaY > thresholdVal.value) {
                pullInfo.tipText = t("释放刷新");
                pullInfo.slowY = (pullInfo.deltaY - thresholdVal.value) * 0.2 + thresholdVal.value;
            } else {
                pullInfo.slowY = pullInfo.deltaY;
            }
            pullInfo.style = `transform: translateY(${pullInfo.slowY * 2}rpx)`;
        }
    }
};
const handlerEnd = (e: any) => {
    // console.log("handlerEnd", e);
    if (pullInfo.deltaY > thresholdVal.value) {
        pullInfo.tipText = t("正在加载中");
        pullInfo.style = `transform: translateY(${thresholdVal.value}px)`;
        is_end.value = true;
        emit("load");
    } else {
        Object.assign(pullInfo, {
            style: "",
            tipText: "",
            startY: 0,
            deltaY: 0,
            slowY: 0,
            resetTimer: null,
            resetTime: 500
        });
    }
};

const reset = () => {
    pullInfo.resetTimer = setTimeout(() => {
        is_end.value = false;
        pullInfo.tipText = t("刷新成功!");
        pullInfo.resetTimer = setTimeout(() => {
            clearTimeout(pullInfo.resetTimer!);
            Object.assign(pullInfo, {
                style: "",
                tipText: "",
                startY: 0,
                deltaY: 0,
                slowY: 0,
                resetTimer: null,
                resetTime: 500
            });
        }, pullInfo.resetTime);
    }, pullInfo.resetTime);
};

defineExpose({
    reset
});
</script>

<style lang="scss" scoped>
.pull {
    position: relative;
    width: 100%;
    height: 100%;

    .pull-container {
        position: relative;
        width: 100%;
        height: 100%;

        &.pull-transition {
            transition: all 0.3s ease-in-out;
        }
        .pull-head {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            text-align: center;
            transform: translateY(-100%);

            .pull-text-box {
                padding: 30rpx 0;
                color: #999;
                font-size: 26rpx;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                height: v-bind("thresholdVal + 'px'");
                // #ifdef MP-WEIXIN
                padding-top: v-bind("paddingTop");
                // #endif
                .pull-text {
                    margin-left: 15rpx;
                }
            }
        }
    }
}
</style>
