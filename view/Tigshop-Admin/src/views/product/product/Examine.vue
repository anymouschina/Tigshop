<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="处理申请" prop="checkStatus">
                        <el-radio-group style="width: 100%" v-model="formState.checkStatus">
                            <el-radio :value="1">审核通过</el-radio>
                            <el-radio :value="2">审核不通过</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-if="formState.checkStatus == 2" label="审核失败原因" prop="checkReason" :rules="[{ required: true, message: '审核失败原因不能为空!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.checkReason" cols="40" :rows="2" type="textarea"></TigInput>
                    </el-form-item>
                    <el-form-item v-show="!isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交 </el-button>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { AuditProductFormState } from "@/types/product/product.d";
import { AuditProduct } from "@/api/product/product";
import { useConfigStore } from "@/store/config";
const config = useConfigStore().config;

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    isDialog: Boolean
});
const loading = ref<boolean>(false);
const query = useRouter().currentRoute.value.query;
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const formRef = shallowRef();
const formState = ref<AuditProductFormState>({
    id: id.value,
    checkStatus: 1,
    checkReason: "",
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await AuditProduct({ ...formState.value });
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
.content_wrapper {
    padding: 10px 28px;
}
</style>
