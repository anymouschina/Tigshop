<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="账号名称" prop="username" :rules="[{ required: true, message: '请输入账号名称!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.username" />
                    </el-form-item>
                    <el-form-item label="手机号" prop="mobile" :rules="[{ required: true, message: '请输入手机号!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.mobile" type="integer"></TigInput>
                    </el-form-item>
                    <el-form-item label="邮箱">
                        <div>
                            <div>
                                <TigInput classType="tig-form-input" v-model="formState.email" type="integer"></TigInput>
                            </div>
                            <div class="extra">注意：修改账号名称或手机会影响到此账号登录后台的所有角色账号（比如管理员、店铺、门店、供应商等）</div>
                        </div>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { getMainAccount, updateMainAccount } from "@/api/authority/accountManage";
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    adminId: {
        type: String,
        default: ""
    },
    act: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        default: ""
    },
    isDialog: Boolean
});
const loading = ref<boolean>(false);
const query = useRouter().currentRoute.value.query;
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const formRef = shallowRef();
const formState = ref<any>({});

const _getMainAccount = async () => {
    try {
        const result = await getMainAccount({ id: id.value, adminId: props.adminId, type: props.type });
        formState.value = result;
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};

_getMainAccount();

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateMainAccount(formState.value);
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
<style lang="less" scoped></style>
