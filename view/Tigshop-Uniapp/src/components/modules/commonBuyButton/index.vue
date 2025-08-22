<template>
    <div>
        <div
            class="goods-btn"
            :style="
                `height: ${styleOptions.paddingTopBottom + 24}px; padding-right: ${
                    styleOptions.text ? `${styleOptions.paddingLeftRight + 10}px` : 0
                }; border-radius: ${styleOptions.radius}px; color: ${styleOptions.textColor}; font-weight: 400;` +
                background +
                paddingLeft
            "
        >
            <div
                v-if="styleOptions.btnType"
                class="btn-icon"
                :style="`margin-left: ${styleOptions.text ? '5px' : 0}; margin-right: ${
                    styleOptions.text ? '-2px' : 0
                }px; width: 24px; background: none; color: ${styleOptions.iconColor}; font-weight: 400;`"
            >
                <template v-if="styleOptions.btnType == 1">
                    <span class="iconfont-h5 icon-gouwuche" />
                </template>
                <template v-if="styleOptions.btnType == 2">
                    <span class="iconfont-h5 icon-gouwuche1" />
                </template>
                <template v-if="styleOptions.btnType == 3">
                    <span class="iconfont-h5 icon-jia" />
                </template>
                <template v-if="styleOptions.btnType == 4">
                    <span class="iconfont-h5 icon-jia1" />
                </template>
            </div>
            <div v-if="styleOptions.text" class="btn-text">{{ $t(styleOptions.text) }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { gradientMap } from "@/components/modules/index";
import { computed } from "vue";
const props = defineProps({
    styleOptions: {
        type: Object,
        default: () => ({
            showBtn: 1, //是否显示按钮
            btnType: 1, //按钮类型
            text: "", //按钮文字
            textColor: "#ffffff", //按钮文字颜色
            iconColor: "#ffffff", //按钮图标颜色
            gradientType: "leftRight", //按钮背景渐变类型
            gradientColorA: "#333333", //按钮背景渐变颜色A
            gradientColorB: "#333333", //按钮背景渐变颜色B
            radius: 16, //按钮圆角
            paddingTopBottom: 0, //按钮高度
            paddingLeftRight: 10 //按钮宽度
        })
    }
});

const background = computed(() => {
    let str = "";
    if (props.styleOptions.gradientType !== "purity") {
        str = `background-image: linear-gradient(${gradientMap[props.styleOptions.gradientType]}, ${props.styleOptions?.gradientColorA}, ${
            props.styleOptions.gradientColorB
        });`;
    } else {
        str = `background-color:${props.styleOptions?.gradientColorA};`;
    }
    return str;
});

const paddingLeft = computed(() => {
    let str = "padding-left:0";
    if (props.styleOptions.text) {
        str = `padding-left: ${props.styleOptions.paddingLeftRight}px;`;
        if (!props.styleOptions.btnType) {
            str = `padding-left: ${props.styleOptions.paddingLeftRight + 10}px;`;
        }
    }
    return str;
});
</script>

<style lang="scss" scoped>
.goods-btn {
    margin: 0 auto;
    padding-right: 10px;
    min-width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-icon {
    font-size: 14px;
    width: 24px;
}

.btn-text {
    font-size: 12px;
    white-space: nowrap;
}
</style>
