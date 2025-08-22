<template>
    <a-spin :spinning="loading">
        <el-form ref="formRef" :model="formState" label-width="160px" >
            <div class="content">
                <div class="title">支付宝设置</div>
                <el-form-item label="是否开启" prop="useAlipay">
                    <el-radio-group v-model="formState.useAlipay" class="itemWidth">
                        <el-radio :value="1">开启</el-radio>
                        <el-radio :value="0">关闭</el-radio>
                    </el-radio-group>
                    <div class="extra">是否开启支付宝支付，如关闭则不显示支付宝支付选项</div>
                </el-form-item>
                <el-form-item label="应用私钥" prop="alipayRsaPrivateKey">
                    <div>
                        <div class="flex flex-align-center" style="gap: 10px">
                            <div class="secret-txt line1" style="max-width: 380px">
                                {{ formState.alipayRsaPrivateKey }}
                            </div>
                            <DialogForm
                                :maskClose="false"
                                :isDrawer="false"
                                :params="{ title: '应用私钥', content: formState.alipayRsaPrivateKey }"
                                path="setting/config/src/EditSecret"
                                title="应用私钥"
                                width="600px"
                                @okCallback="formState.alipayRsaPrivateKey = $event"
                            >
                                <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                            </DialogForm>
                        </div>
                        <div class="extra">编辑完成后，点击下方提交按钮确认修改，请确保填写正确的应用私钥</div>
                    </div>
                </el-form-item>
                <el-form-item label="支付宝公钥" prop="alipayRsaPublicKey">
                    <div>
                        <div class="flex flex-align-center" style="gap: 10px">
                            <div class="secret-txt line1">
                                {{ formState.alipayRsaPublicKey }}
                            </div>
                            <DialogForm
                                :maskClose="false"
                                :isDrawer="false"
                                :params="{ title: '支付宝公钥', content: formState.alipayRsaPublicKey }"
                                path="setting/config/src/EditSecret"
                                title="支付宝公钥"
                                width="600px"
                                @okCallback="formState.alipayRsaPublicKey = $event"
                            >
                                <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                            </DialogForm>
                        </div>
                        <div class="extra">编辑完成后，点击下方提交按钮确认修改，请确保填写正确的支付宝公钥</div>
                    </div>
                </el-form-item>
                <div class="title">网页应用支付</div>
                <el-form-item label="支付APPID" prop="alipayAppid">
                    <TigInput classType="tig-form-input" v-model="formState.alipayAppid" />
                </el-form-item>
                <div class="title">移动应用支付</div>
                <el-form-item label="支付APPID" prop="alipayMobileAppid">
                    <TigInput classType="tig-form-input" v-model="formState.alipayMobileAppid" />
                </el-form-item>
            </div>
        </el-form>
        <div style="height: 20px"></div>
        <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
            <div class="selected-action">
                <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
            </div>
        </div>
    </a-spin>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import type { AliPaySettingsForm } from "@/types/setting/payment";
import { getAliPaySettings, updateAliPaySettings } from "@/api/setting/payment";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<AliPaySettingsForm>>({
    useAlipay: undefined,
    alipayAppid: "",
    alipayMobileAppid: "",
    alipayRsaPrivateKey: "",
    alipayRsaPublicKey: ""
});

// 加载列表
onMounted(async () => {
    loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getAliPaySettings();
        Object.assign(formState.value, convertNullsToEmptyStrings(result));
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
// 表单通过验证后提交
const onSubmit = async () => {
    confirmLoading.value = true;
    try {
        const result = await updateAliPaySettings({
            ...formState.value
        });
        message.success("修改成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
</script>
<style lang="less" scoped>
.content {
    padding: 10px;

    .title {
        font-weight: bold;
        // padding-top: 20px;
        padding-bottom: 20px;
        font-size: 14px;
    }

    .subtitle {
        color: #999;
        font-weight: normal;
        font-size: 12px;
    }
    :deep(.el-tabs--border-card > .el-tabs__content) {
        padding: 0;
    }
}

.mr8 {
    margin-right: 8px;
}

.width60 {
    width: 60px;
}

.ml8 {
    margin-left: 8px;
}
.secret-txt{
    max-width: 380px;
}
@media (max-width: 768px) {
   .secret-txt{
    max-width: 180px;
}
}
</style>
<style>
.itemWidth {
    width: 100%;
}
</style>
