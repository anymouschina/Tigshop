<template>
    <div class="mobile" v-if="mobileValue != '--'">
        {{ mobileValue }}
        <i v-if="mobileValue" @click="toggleVisibility" class="iconfont-admin icon-cu" :class="[showMobile ? 'icon-yanjing-kai' : 'icon-yanjing-guan']"></i>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { message } from "ant-design-vue";

const props = defineProps<{ mobile: string | undefined }>();
const showMobile = ref(false);

const isDemo = ref(import.meta.env.VITE_IS_DEMO || 0);

const toggleVisibility = () => {
    if (isDemo.value == 1) {
        console.log("====", isDemo.value);
        message.error("您无权限查看");
    } else {
        showMobile.value = !showMobile.value;
    }
};
const mobileValue = computed(() => {
    if (showMobile.value) return props.mobile;
    if (typeof props.mobile !== "string") return "--";
    
    // 去除非数字字符用于长度判断
    const numericMobile = props.mobile.replace(/\D/g, "");
    if (numericMobile.length <= 6) return props.mobile;

    // 智能判断号码类型
    const isLandline = /^0\d{2,3}-\d{7,8}$/.test(props.mobile);
    let digitCount = 0;
    let masked = "";
    let hideCount = 0;
    let hideStart = 0;

    // 设置不同的加密策略
    if (isLandline) {
        // 座机号：区号不加密，主号保留前2后2位
        const [areaCode, mainNumber] = props.mobile.split('-');
        if (mainNumber.length > 4) {
            const hideCount = mainNumber.length - 4;
            const regex = new RegExp(`(.{2})(.{${hideCount}})(.{2})`);
            masked = areaCode + '-' + mainNumber.replace(regex, '$1' + '*'.repeat(hideCount) + '$3');
        } else {
            masked = props.mobile;
        }
    } else {
        // 手机号/其他号码：保留前3后4位
        for (const char of props.mobile) {
            if (/[0-9]/.test(char)) {
                digitCount++;
                // 从第4位开始隐藏 (保留前3后4)
                const shouldHide = digitCount > 3 && digitCount <= numericMobile.length - 4;
                masked += shouldHide ? '*' : char;
            } else {
                masked += char; // 保留非数字字符
            }
        }
    }

    return masked;
});
</script>

<style scoped lang="less">
.mobile {
    display: inline-flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;

    .icon-cu {
        cursor: pointer;
    }
}
</style>
