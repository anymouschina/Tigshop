<template>
    <div class="user" v-if="userValue!=''">
        {{ userValue }}
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps({
    user: {
        type: String,
        default: ""
    }
});
const showMobile = ref(false);

const isDemo = ref(import.meta.env.VITE_IS_DEMO || 0);

const toggleVisibility = () => {
    showMobile.value = !showMobile.value;
};

const userValue = computed(() => {
    if (showMobile.value) {
        return props.user;
    } else {
        if (typeof props.user === "string") {
            if (props.user === "") {
                return "";
            } else {
                // 添加手机号码有效性检查
                const regex = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
                if (regex.test(props.user)) {
                    return props.user.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
                } else {
                    return props.user; // 不是标准手机号，返回原值
                }
            }
        } else {
            return "";
        }
    }
});
</script>

<style scoped lang="less">

.user {
    width: 100px;
    line-height: 12px;
}
</style>

