<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="新手机号：" prop="mobile" :rules="[{ required: true, validator: validateMobile, trigger: 'blur' }]">
                        <TigInput classType="tig-form-input" v-model="formState.mobile" placeholder="请输入新手机号" />
                    </el-form-item>
                    <el-form-item label="获取验证码：" prop="code" :rules="[{ required: true, message: '验证码不能为空!', trigger: 'blur' }]">
                        <TigInput classType="tig-form-input" v-model="formState.code">
                            <template #append>
                                <div v-if="ableSend" class="code-btn" @click.stop="onCode">{{ btnText }}</div>
                                <div v-if="!ableSend" class="code-text">{{ codeText }}</div>
                            </template>
                        </TigInput>
                    </el-form-item>
                </el-form>
                <Verify ref="verify" mode="pop" captchaType="blockPuzzle" :imgSize="{ width: '310px', height: '155px' }" @okCallback="okCallback"></Verify>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, computed } from "vue"
import { useRouter } from 'vue-router'
import { message } from "ant-design-vue";
import { AccountMobileEditingFormState } from "@/types/authority/accountEditing";
import { modifyManageAccounts, getAdminCode } from "@/api/authority/accountEditing";
import Verify from "@/components/verifition/Verify.vue";
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    form: {
        type: Object,
        default: {}
    },
    isDialog: Boolean
});
const formRef = shallowRef();
const formState = ref<AccountMobileEditingFormState>({
    mobile: "",
    code: ""
});
const btnText = ref('获取验证码')
const ableSend = ref(true)
const countdown = ref(60)
const verify = ref();
const verifyToken = ref(null);
const okCallback = (e: any) => {
    verifyToken.value = e.verifyToken;
    onCode();
};
// 获取验证码
const onCode = async () => {
    await formRef.value.validateField('mobile');
    if (!verifyToken.value) {
        verify.value.show();
        return;
    }
    try {
        const result = await getAdminCode({ type: 'code', ...formState.value, verifyToken: verifyToken.value });
        message.success("验证码发送成功");
        ableSend.value = false
        verifyToken.value = null
        startCountdown()
    } catch (error:any) {
        message.error(error.message);
    }
};
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await modifyManageAccounts({modifyType: 3, ...formState.value});
        emit('submitCallback', result);
        message.success("修改成功");
    } catch (error:any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit()
};
const validateMobile = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error('手机号不能为空'))
        return;
    }
    const internationalRegex = /^(\+?[1-9]\d{1,14})$/;// 定义支持的国际手机号格式正则表达式
    const regex = /^(?:\+?86)?1[3-9]\d{9}$/; // 国内手机号正则表达式
    // 判断是否符合国际手机号格式
    if (regex.test(value)) {
        callback()
    } else {
        callback('手机号格式错误')
        // 判断是否符合国内手机号格式  需增加设置项
        // return internationalRegex.test(phoneNumber);
    }
}
const codeText = computed(() => {
    return countdown.value + '秒后重发'
})
const timer = ref();
const startCountdown = () => {
    timer.value = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(timer.value);
            ableSend.value = true
            countdown.value = 60
        }
    }, 1000);
};

defineExpose({ onFormSubmit });
</script>

<style lang="less" scoped>
.code-btn {
    cursor: pointer;
}
</style>
