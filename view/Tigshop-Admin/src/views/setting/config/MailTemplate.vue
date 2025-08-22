<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <a-spin :spinning="loading">
                    <el-form ref="formRef" :model="formState" label-width="auto">
                        <el-form-item label="邮件模板" prop="selTemplate">
                            <el-select v-model="formState.templateId" style="width: 100%">
                                <el-option v-for="item in filterState" :key="item.templateId" :label="item.templateName" :value="item.templateId" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="邮件主题" prop="templateSubject">
                            <TigInput width="100%" v-model="formState.templateSubject" type="text" />
                        </el-form-item>
                        <el-form-item label="邮件内容" prop="templateContent">
                            <Editor v-model:html="formState.templateContent"></Editor>
                        </el-form-item>
                    </el-form>
                </a-spin>
            </div>
        </div>
    </div>
    <div v-if="!loading" class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
        <div class="selected-action">
            <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import { onMounted, ref, shallowRef, watch } from "vue";
import { message } from "ant-design-vue";
import type { MailTemplateFilterState } from "@/types/setting/mailTemplate.d";
import { getMailTemplateList, updateMailTemplate } from "@/api/setting/mailTemplate";
import { Editor } from "@/components/editor/index";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const confirmLoading = ref(false);

const loading = ref<boolean>(true);
const formRef = shallowRef();
const formState = ref<MailTemplateFilterState>({
    templateName: "",
    templateId: ""
});
const filterState = ref<MailTemplateFilterState[]>([]);
const loadFilter = async () => {
    try {
        const result = await getMailTemplateList();
        Object.assign(filterState.value, convertNullsToEmptyStrings(result));
        if (filterState.value && filterState.value?.length > 0) {
            formState.value.templateId = filterState.value[0].templateId;
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
watch(
    () => formState.value.templateId,
    (newTemplateId) => {
        // 从邮件模板数据中找到被选择的模板
        const template = filterState.value.find((item: MailTemplateFilterState) => item.templateId == newTemplateId);
        // 将模板数据更新到 formState 中
        if (template) {
            Object.assign(formState.value, template);
        }
    }
);

onMounted(() => {
    // 获取详情数据
    loadFilter();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateMailTemplate({ id: formState.value.templateId, ...formState.value });
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
