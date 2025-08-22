<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="notice-warp">
                <p>提示：推荐使用QQ的域名邮箱（免费），设置流程请看Tigshop教程，另外请确保服务器防火墙未拦截邮箱发送，且对应的端口开放。</p>
            </div>
            <a-spin :spinning="loading" style="width: 100%; margin-top: 100px">
                <el-form ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="邮件服务" prop="mailService">
                        <el-radio-group v-model="formState.mailService" class="itemWidth">
                            <el-radio :value="0">本地邮件服务器</el-radio>
                            <el-radio :value="1">SMTP服务</el-radio>
                        </el-radio-group>
                        <div class="extra">如果您选择了采用服务器内置的 Mail 服务，您不需要填写下面的内容。</div>
                    </el-form-item>
                    <el-form-item label="是否加密连接(SSL)" prop="smtpSsl">
                        <el-radio-group v-model="formState.smtpSsl" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">SMTP一般要求加密</div>
                    </el-form-item>
                    <el-form-item label="发送邮件服务器地址(SMTP)" prop="smtpHost">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.smtpHost" type="text" />
                            <div class="extra">邮件服务器主机地址。如果本机可以发送邮件则设置为localhost</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="服务器端口" prop="smtpPort">
                        <TigInput classType="tig-form-input" TigInput type="integer" v-model="formState.smtpPort" />
                    </el-form-item>
                    <el-form-item label="邮件发送帐号" prop="smtpUser">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.smtpUser" type="text" />
                            <div class="extra">发送邮件所需的认证帐号，如果没有就为空着</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="帐号密码" prop="smtpPass">
                        <TigInput classType="tig-form-input" v-model="formState.smtpPass" type="password" />
                    </el-form-item>
                    <el-form-item label="邮件回复地址" prop="smtpMail">
                        <TigInput classType="tig-form-input" v-model="formState.smtpMail" type="text" />
                    </el-form-item>
                    <el-form-item label="邮件编码" prop="mailCharset">
                        <el-radio-group v-model="formState.mailCharset">
                            <el-radio label="UTF8">国际编码(UTF8)</el-radio>
                            <el-radio label="GB2312">简体中文(GB2312)</el-radio>
                            <el-radio label="BIG5">繁体中文(BIG5)</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="测试邮件地址" prop="testMailAddress">
                        <TigInput classType="tig-form-input" v-model="formState.testMailAddress" type="text">
                            <template #append>
                                <el-button :loading="confirmLoading" @click="onSendTestEmail">发送测试邮件 </el-button>
                            </template>
                        </TigInput>
                    </el-form-item>
                </el-form>
            </a-spin>
        </div>
    </div>
    <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
        <div class="selected-action">
            <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import { onMounted, ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import type { MailFormState } from "@/types/setting/mail.d";
import { getMailSettings, saveMail, sendTestEmail } from "@/api/setting/mail";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();

// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const confirmLoading = ref(false);

const loading = ref<boolean>(true);
const formRef = shallowRef();
const formState = ref<Partial<MailFormState>>({
    mailService: undefined,
    smtpSsl: undefined,
    mailCharset: undefined,
});
const loadFilter = async () => {
    try {
        const result = await getMailSettings();
        Object.assign(formState.value, convertNullsToEmptyStrings(result));
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // 获取详情数据
    loadFilter();
});

const onSendTestEmail = async () => {
    confirmLoading.value = true;
    try {
        const result = await sendTestEmail({
            testMailAddress: formState.value.testMailAddress
        });
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};

// 表单通过验证后提交
const onSubmit = async () => {
    confirmLoading.value = true;
    try {
        const result = await saveMail(formState.value);
        message.success("修改成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.itemWidth {
    width: 100%;
}

.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}
</style>
