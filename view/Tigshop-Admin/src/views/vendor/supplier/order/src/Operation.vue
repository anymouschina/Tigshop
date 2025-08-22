<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="备注">
                        <TigInput classType="tig-form-input" v-model="formState.description" :rows="4" placeholder="请输入备注" type="textarea" show-word-limit :maxlength="200" />
                    </el-form-item>
                    <el-form-item v-if="false" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交 </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { ProductOperation } from "@/types/order/order.d";
import { operationOrder } from "@/api/order/order";

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0,
    },
    act: {
        type: String,
        default: "",
    },
});
const loading = ref<boolean>(false);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.act);
const id = ref<number>(props.id);
const formRef = shallowRef();
const formState = ref<ProductOperation>({});

onMounted(() => {});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await operationOrder(action.value, { id: id.value, ...formState.value });
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
