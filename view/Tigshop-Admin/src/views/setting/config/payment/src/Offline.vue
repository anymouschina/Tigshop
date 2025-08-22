<template>
    <a-spin :spinning="loading">
        <el-form ref="formRef" :model="formState" label-width="160px" >
            <div class="content">
                <div class="title">线下支付设置</div>
                <el-form-item label="是否开启" prop="useOffline">
                    <el-radio-group v-model="formState.useOffline">
                        <el-radio :value="1">开启</el-radio>
                        <el-radio :value="0">关闭</el-radio>
                    </el-radio-group>
                    <div class="extra">是否开启线下支付，如关闭则不显示线下支付选项</div>
                </el-form-item>
                <el-form-item label="汇款说明">
                    <el-tabs type="border-card" v-model="activeName" v-if="!loading">
                        <el-tab-pane label="银行汇款" :name="1">
                            <Editor v-model:html="formState.offlinePayBank" :border="false"></Editor>
                        </el-tab-pane>
                        <el-tab-pane label="企业汇款" :name="2">
                            <Editor v-model:html="formState.offlinePayCompany" :border="false"></Editor>
                        </el-tab-pane>
                    </el-tabs>
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
import { onMounted, ref, shallowRef } from "vue";
import { Editor } from "@/components/editor/index";
import { message } from "ant-design-vue";
import type { OfflinePaySettingsForm } from "@/types/setting/payment";
import { getOfflinePaySettings, updateOfflinePaySettings } from "@/api/setting/payment";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const formRef = shallowRef();
// 基本参数定义
const activeName = ref<number>(1);
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<OfflinePaySettingsForm>>({
    useOffline: undefined,
    offlinePayBank: "offlinePayBank_72fb45670fda",
    offlinePayCompany: "offlinePayCompany_0f283b8c7a4b"
});

// 加载列表
onMounted(async () => {
    loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getOfflinePaySettings();
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
        const result = await updateOfflinePaySettings({
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
</style>
