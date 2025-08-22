<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form ref="formRef" :model="formState" label-width="auto">
                    <el-form-item>
                        <template #label> <span class="required">*</span>绑定账号 </template>
                        <div class="one-item" style="width: 100%">
                            <div class="to-time" style="width: 100%">
                                <el-radio-group v-model="formState.adminData.type">
                                    <el-radio :value="1">会&nbsp;&nbsp;&nbsp;&nbsp;员</el-radio>
                                </el-radio-group>
                                <el-form-item
                                    style="width: 100%"
                                    :rules="formState.adminData.type == 1 ? [{ required: true, message: '请选择会员!' }] : []"
                                    prop="adminData.userId"
                                >
                                    <el-select
                                        style="width: 100%"
                                        v-model="formState.adminData.userId"
                                        :disabled="formState.adminData.type == 2"
                                        filterable
                                        remote
                                        reserve-keyword
                                        placeholder="可输入手机号查询绑定会员"
                                        :remote-method="remoteMethod"
                                        :loading="loadingVal"
                                    >
                                        <el-option v-for="item in userInfo" :key="item.key" :label="item.label" :value="item.value" />
                                    </el-select>
                                </el-form-item>
                            </div>
                            <div class="to-time" style="width: 100%">
                                <el-radio-group v-model="formState.adminData.type">
                                    <el-radio :value="2">管理员</el-radio>
                                </el-radio-group>
                                <el-form-item
                                    style="width: 100%"
                                    :rules="formState.adminData.type == 2 ? [{ required: true, message: '请选择管理员!' }] : []"
                                    prop="adminData.adminId"
                                >
                                    <el-select
                                        style="width: 100%"
                                        v-model="formState.adminData.adminId"
                                        :disabled="formState.adminData.type == 1"
                                        filterable
                                        remote
                                        reserve-keyword
                                        placeholder="可输入手机号查询绑定管理员"
                                        :remote-method="remoteMethod"
                                        :loading="loadingVal"
                                    >
                                        <el-option v-for="item in userInfo" :key="item.key" :label="item.label" :value="item.value" />
                                    </el-select>
                                </el-form-item>
                            </div>
                        </div>
                        <div class="extra" style="width: 100%; margin-top: 16px">必须绑定一位{{ formState.adminData.type == 2 ? "「管理员」" : "「会员」" }}。</div>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import { bindMainAccount } from "@/api/authority/accountManage";
import { getAdminUserList } from "@/api/authority/adminUser";
import { getUserList } from "@/api/user/user";
const adminType = ref(true);
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const props = defineProps({
    id: {
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
const formRef = shallowRef();
const formState = ref<any>({
    id: props.id,
    type: props.type,
    adminData: {
        type: 1,
        userId: null,
        adminId: null
    }
});
const loadingVal = ref(false);
const userInfo = ref<any>([]);
const remoteMethod = async (query: string) => {
    try {
        if (query) {
            loadingVal.value = true;
            const params = { keyword: query };
            // 使用公共方法来获取数据
            const result = await getUserFetch(params);
            // 设置用户信息
            result.records.forEach((item: any) => {
                if (formState.value.adminData.type === 2) {
                    item.value = item.adminId;
                    item.key = item.adminId;
                } else {
                    item.value = item.userId;
                    item.key = item.userId;
                }
                item.label = item.username;
            });
            userInfo.value = result.records;
        } else {
            userInfo.value = [];
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loadingVal.value = false;
    }
};

const getUserFetch = async (params: { keyword: string }) => {
    if (formState.value.adminData.type === 2) {
        return await getAdminUserList(params);
    } else {
        return await getUserList(params);
    }
};

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await bindMainAccount(formState.value);
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
.required {
    color: var(--el-color-danger);
    margin-right: 4px;
}
.one-item {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .to-time {
        display: flex;
        align-items: center;
        gap: 20px;
    }
}
</style>
