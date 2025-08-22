<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <a-spin :spinning="loading">
                    <el-form ref="formRef" :model="formState" label-width="auto">
                        <el-form-item label="售后服务" prop="templateContent">
                            <Editor v-if="!loading" v-model:html="formState.templateContent"></Editor>
                        </el-form-item>
                    </el-form>
                    <div v-if="!loading" class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '370px' : '270px' }">
                        <div class="selected-action">
                            <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
                        </div>
                    </div>
                </a-spin>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import { onMounted, ref, shallowRef, reactive } from "vue";
import { message } from "ant-design-vue";
import type { AfterSalesServiceFilterState } from "@/types/setting/afterSalesService.d";
import { getAfterSalesSettings, updateAfterSalesSettings } from "@/api/setting/afterSalesService";
import { Editor } from "@/components/editor/index";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const confirmLoading = ref(false);
const loading = ref<boolean>(true);
const formRef = shallowRef();
const formState = ref<AfterSalesServiceFilterState>({
    templateContent: '' // 设置默认值
});
const loadFilter = async () => {
    try {
        const result = await getAfterSalesSettings();
        if (result.templateContent !== '') {
            formState.value = result;
        }
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

// 表单通过验证后提交
const onSubmit = async () => {
    console.log(formState.value);
    try {
        emit("update:confirmLoading", true);
        const result = await updateAfterSalesSettings(formState.value);
        emit("submitCallback", result);
        message.success("修改成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        emit("update:confirmLoading", false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}
</style>
