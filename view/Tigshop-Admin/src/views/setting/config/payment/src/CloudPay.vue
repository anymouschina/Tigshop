<template>
    <a-spin :spinning="loading">
        <el-form ref="formRef" :model="formState" label-width="160px" >
            <div class="content">
                <div class="title">云支付设置</div>
                <el-form-item label="是否开启" prop="useYunpay">
                    <el-radio-group v-model="formState.useYunpay" class="itemWidth">
                        <el-radio :value="1">开启</el-radio>
                        <el-radio :value="0">关闭</el-radio>
                    </el-radio-group>
                    <div class="extra">是否开启云支付，如关闭则不显示云支付选项</div>
                </el-form-item>
                <el-form-item label="商户号" prop="yunpayUid">
                    <TigInput classType="tig-form-input" v-model="formState.yunpayUid" />
                </el-form-item>
                <el-form-item label="商户秘钥" prop="yunpaySecretKey">
                    <div>
                        <div class="flex flex-align-center" style="gap: 10px">
                            <div class="secret-txt line1" style="max-width: 380px">
                                {{ formState.yunpaySecretKey }}
                            </div>
                            <DialogForm
                                :maskClose="false"
                                :isDrawer="false"
                                :params="{ title: '商户秘钥', content:formState.yunpaySecretKey }"
                                path="setting/config/src/EditSecret"
                                title="商户秘钥"
                                width="600px"
                                @okCallback="formState.yunpaySecretKey = $event"
                            >
                                <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                            </DialogForm>
                        </div>
                        <div class="extra">编辑完成后，点击下方提交按钮确认修改，请确保填写正确的商户秘钥</div>
                    </div>
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
import type { YunPaySettingsForm } from "@/types/setting/payment";
import { getYunPaySettings, updateYunPaySettings } from "@/api/setting/payment";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<YunPaySettingsForm>>({
    useYunpay: undefined,
    yunpayUid: "yunpayUid_b254bd1793f9",
    yunpaySecretKey: "yunpaySecretKey_e5ab30a9934a"
});

// 加载列表
onMounted(async () => {
    loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getYunPaySettings();
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
        const result = await updateYunPaySettings({
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
</style>
<style>
.itemWidth {
    width: 100%;
}
</style>
