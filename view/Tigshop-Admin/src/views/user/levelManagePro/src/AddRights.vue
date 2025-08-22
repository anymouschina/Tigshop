<template>
    <div class="container">
        <el-form ref="formRef" :rules="rules" :model="formState" label-width="auto">
            <el-form-item prop="name" label="权益名称" :rules="rules.name">
                <TigInput width="100%" v-model="formState.name"></TigInput>
            </el-form-item>
            <el-form-item prop="showName" label="展示名称" :rules="rules.showName">
                <TigInput width="100%" v-model="formState.showName"></TigInput>
            </el-form-item>
            <el-form-item prop="icon" label="权益图标" :rules="rules.icon">
                <FormAddGallery v-model:photo="formState.icon"></FormAddGallery>
            </el-form-item>
            <el-form-item prop="describe" label="权益简介" :rules="rules.describe">
                <TigInput width="100%" type="textarea" :rows="4" v-model="formState.describe" placeholder="请输入权益简介"></TigInput>
            </el-form-item>
            <el-form-item prop="value" label="权益价值">
                该权益价值&nbsp;&nbsp;<TigInput style="width: 100px" type="decimal" :min="0" v-model="formState.value" placeholder="请输入"></TigInput
                >&nbsp;&nbsp;元
            </el-form-item>
            <el-form-item label="服务方式"> 商家线下核销 </el-form-item>
        </el-form>
    </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, reactive, onMounted } from "vue";
import type { FormRules } from "element-plus";
import { FormAddGallery } from "@/components/gallery";
// 父组件回调
const emit = defineEmits(["submitCallback", "editCallback"]);
const props = defineProps({
    act: {
        type: String,
        default: "add"
    },
    rowIndex: {
        type: Number,
        default: 0
    },
    data: {
        type: Object,
        default: {}
    }
});

const formRef = shallowRef();
const formState = ref<any>({
    name: "",
    showName: "", // 展示名称
    icon: "", // 权益图标
    value: 0, // 权益价值
    describe: "", // 权益描述
    isChecked: 0 // 权益是否选中
});
interface RuleForm {
    name: string;
    showName: string;
    icon: string;
    describe: string;
}
const rules = reactive<FormRules<RuleForm>>({
    name: [{ required: true, message: "请输入权益名称", trigger: "blur" }],
    showName: [{ required: true, message: "请输入权益显示", trigger: "blur" }],
    icon: [{ required: true, message: "请输入权益图标", trigger: "blur" }],
    describe: [{ required: true, message: "请输入权益简介", trigger: "blur" }]
});
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    emit("submitCallback", { row: formState.value, act: props.act, index:props.rowIndex });
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};
onMounted(() => {
    if(props.act === "edit"){
        formState.value = props.data;
    }
});

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped></style>
