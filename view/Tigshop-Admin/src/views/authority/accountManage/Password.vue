<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="账号名称">
                        {{ formState.username }}
                    </el-form-item>
                    <el-form-item label="修改密码" prop="password" :rules="[{ required: true, message: '请输入密码' }]">
                        <TigInput classType="tig-form-input" v-model="formState.password" type="password"></TigInput>
                    </el-form-item>
                    <el-form-item label="确认密码" prop="pwdConfirm" :rules="[{ required: true, validator: validatePwdConfirm }]">
                        <div>
                            <div>
                                <TigInput classType="tig-form-input" v-model="formState.pwdConfirm" type="password"></TigInput>
                            </div>
                            <div class="extra">注意：修改密码会影响到此账号登录后台的所有角色账号（比如管理员、店铺、门店、供应商等）</div>
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
import { getMainAccount, updateMainAccountPwd } from "@/api/authority/accountManage";
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    adminId: {
        type: Number,
        default: 0
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
    }
};
_getMainAccount();

const validatePwdConfirm = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("请输入确认密码"));
        return;
    } else if(value !== formState.value.password){
        callback(new Error("两次密码输入不一致"));
        return;
    }else {
        callback();
    }
};

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateMainAccountPwd(formState.value);
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
