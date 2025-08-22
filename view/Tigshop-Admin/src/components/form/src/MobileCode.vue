<template>
    <TigInput width="100%" size="large" :class="class" placeholder="请输入验证码" v-model="mobileCode" @input="onInput">
        <template #suffix>
            <div v-if="ableSend" class="code-btn" @click.stop="onClick">{{ btnText }}</div>
            <div v-if="!ableSend" class="code-text">{{ codeText }}</div>
        </template>
    </TigInput>
    <Verify ref="verify" mode="pop" captchaType="blockPuzzle" :imgSize="{ width: '310px', height: '155px' }" @okCallback="okCallback"></Verify>
</template>
<script setup lang="ts">
// 不使用a-switch，增加表格渲染速度
import { ref, toRefs, onUnmounted, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import Verify from "@/components/verifition/Verify.vue";
import { result } from "lodash-es";
const props = defineProps({
    class: String,
    mobileCode: { type: String, default: "" },
    mobile: { type: String, default: "" },
    requestApi: { type: Function, default: result },
});
const { mobile } = toRefs(props);
const emit = defineEmits(["update:mobileCode", "mobileErrorCallback"]);
const btnText = ref("获取验证码");
const mobileCode = ref("");
const sendType = ref(0);
const ableSend = ref(true);
const verify = ref();
const verifyToken = ref(null);
const countdown = ref(60);
const onInput = () => {
    emit("update:mobileCode", mobileCode.value);
};
const onClick = async () => {
    if (mobile.value == "") {
        emit("mobileErrorCallback", "手机号不能为空！");
        return false;
    }
    if (!validatePhoneNumber(mobile.value)) {
        emit("mobileErrorCallback", "手机号格式错误");
        return;
    }
    if (!verifyToken.value) {
        verify.value.show();
        return;
    }
    try {
        const result = await props.requestApi({
            mobile: mobile.value,
            verifyToken: verifyToken.value,
            event:"login"
        });
        ableSend.value = false;
        verifyToken.value = null;
        startCountdown();
    } catch (error: any) {
        emit("mobileErrorCallback", error.message);
        return;
    } finally {
    }
};
const validatePhoneNumber = (phoneNumber: any) => {
    const internationalRegex = /^(\+?[1-9]\d{1,14})$/; // 定义支持的国际手机号格式正则表达式
    const regex = /^(?:\+?86)?1[3-9]\d{9}$/; // 国内手机号正则表达式
    // 判断是否符合国际手机号格式
    if (regex.test(phoneNumber)) {
        return true;
    } else {
        return false;
        // 判断是否符合国内手机号格式  需增加设置项
        // return internationalRegex.test(phoneNumber);
    }
};
const codeText = computed(() => {
    return countdown.value + "秒后重发";
});
const timer = ref();
const startCountdown = () => {
    timer.value = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(timer.value);
            ableSend.value = true;
            countdown.value = 60;
        }
    }, 1000);
};
const okCallback = (e: any) => {
    verifyToken.value = e.verifyToken;
    onClick();
};
onUnmounted(() => {
    clearInterval(timer.value);
});
</script>
<style lang="less" scoped>
.code-btn {
    color: #333;
    cursor: pointer;
}
</style>
