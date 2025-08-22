<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item prop="name" label="区号地区：" :rules="[{ required: true, message: '区号地区不能为空!' }]">
                        <TigInput classType="tig-form-input" type="text" :maxlength="60" v-model="formState.name" />
                    </el-form-item>
                    <el-form-item prop="code" label="区号：" :rules="[{ required: true, message: '区号不能为空!' }]">
                        <TigInput classType="tig-form-input" type="integer" :maxlength="60" v-model="formState.code" />
                    </el-form-item>
                    <el-form-item prop="isDefault" label="是否默认：">
                        <el-radio-group v-model="formState.isDefault">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item prop="isDefault" label="是否启用：">
                        <el-radio-group v-model="formState.isAvailable">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交</el-button>
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
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
import type { AreaCodeFormState } from "@/types/multilingual/areaCode.d";
import { getAreaCode, updateAreaCode } from "@/api/multilingual/areaCode";
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    promotionType: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    isDialog: {
        type: Boolean,
        default: false
    }
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<AreaCodeFormState>({
    name: '',
    code: '',
    isDefault: 0,
    isAvailable: 1
});
onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        _getLocales();
    } else {
        loading.value = false;
    }
});
const _getLocales = async () => {
    try {
        const result = await getAreaCode(action.value, {
            id: id.value
        });
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateAreaCode(operation, { id: id.value, ...formState.value });
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
