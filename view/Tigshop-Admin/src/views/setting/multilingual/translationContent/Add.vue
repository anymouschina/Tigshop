<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item prop="dataType" label="翻译类型：" :rules="[{ required: true, message: '请选择翻译类型!' }]">
                        <el-checkbox-group v-model="formState.dataType">
                            <el-checkbox label="页面文字" :value="0" />
                            <el-checkbox label="接口文字" :value="1" />
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item prop="translationName" label="翻译原文：" :rules="[{ required: true, message: '翻译原文不能为空!' }]">
                        <TigInput width="100%" type="textarea" :rows="10" v-model="formState.translationName" class="mr10"/>
                        <div class="extra">输入需要翻译的原文句子, 每输入完成一句用Enter键换行, 继续输入下一句</div>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close", "closeConfirm"]);
import type { TranslationsFilterState } from "@/types/multilingual/translationContent.d";
import { updateTranslations } from "@/api/multilingual/translationContent";
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    dataType: {
        type: Number,
        default: 0
    },
    translationName: {
        type: String,
        default: ""
    },
    isDialog: {
        type: Boolean,
        default: false
    }
});
const loading = ref<boolean>(false);
const query = useRouter().currentRoute.value.query;
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = "batchCreate";
const formRef = shallowRef();
const formState = ref<TranslationsFilterState>({
    translationName: props.translationName,
    dataType: [props.dataType],
    items:[]
});
onMounted(() => { 
    setTimeout(() => {
        emit("closeConfirm", true);
    }, 10000);
});
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateTranslations(operation, formState.value);
        emit("submitCallback", result);
        message.success("操作成功");
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


</style>
