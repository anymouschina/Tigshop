<template>
    <el-form ref="formRef" :model="formState" class="form-body" label-suffix="：" label-width="auto">
        <el-form-item v-show="page" label="供应商管理Logo">
            <FormAddGallery v-model:photo="formState.vendorLogo" :isMultiple="false"></FormAddGallery>
        </el-form-item>
        <el-form-item :rules="[{ required: true, message: '请输入供应商管理名称!' }]" label="供应商管理名称" prop="vendorName">
            <TigInput classType="tig-form-input" v-model="formState.vendorName" :maxlength="15" placeholder="请输入供应商管理名称" />
            <div class="extra">供应商管理名称应尽量简洁易记, 建议15字以内</div>
        </el-form-item>
        <el-form-item label="创建时间" prop="addTime">
            <p>{{ vendorInfo.addTime }}</p>
        </el-form-item>
    </el-form>
</template>
<script lang="ts" setup>
import { ref, shallowRef, reactive } from "vue";
import { FormAddGallery } from "@/components/gallery";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { saveVendorUpdateInfo } from "@/api/vendor/setting";
import { AdminUserFormState } from "@/types/vendor/setting.d";
// 父组件回调
const emit = defineEmits([
    "submitCallback", //确认后回调
    "update:confirmLoading", //确认按钮的loading状态
    "close" //关闭弹窗
]);
const props = defineProps({
    act: {
        type: String,
        default: ""
    },
    id: {
        type: Number,
        default: 0
    },
    type: {
        type: Number,
        default: 1
    },
    page: {
        type: Number,
        default: 1
    },
    isDialog: Boolean
});
const vendorId = localStorage.getItem("vendorId") || "";
const vendorInfo = reactive(JSON.parse(JSON.stringify(useUserStore().vendorInfo)));
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<AdminUserFormState>({
    vendorId: vendorId,
    vendorName: vendorInfo.vendorName,
    vendorLogo: vendorInfo.vendorLogo
});

const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await saveVendorUpdateInfo({ ...formState.value });
        await formRef.value.resetFields();
        message.success("操作成功");
        emit("submitCallback", result);
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
<style lang="less" scoped></style>
