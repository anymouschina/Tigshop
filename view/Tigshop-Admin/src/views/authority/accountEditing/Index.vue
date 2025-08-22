<template>
    <div class="container">
        <div class="content_wrapper">
            <a-spin :spinning="loading">
                <el-form ref="formRef" :model="formState" label-width="100px" style="max-width: 500px">
                    <el-form-item label="管理员名称" prop="username">
                        <p>{{ formState.username }}</p>
                        <DialogForm
                            v-if="formState.mobile"
                            :title="'修改密码'"
                            isDrawer
                            :params="{ id: userInfo.adminId, form: userInfo }"
                            path="authority/accountEditing/Info"
                            width="550px"
                            @okCallback="loadFilter"
                        >
                            <el-button key="primary" type="primary" link>修改密码</el-button>
                        </DialogForm>
                    </el-form-item>
                    <el-form-item label="手机号" prop="mobile">
                        <MobileCard v-if="formState.mobile" :mobile="formState.mobile"></MobileCard>
                        <DialogForm
                            :title="'修改手机号'"
                            isDrawer
                            :params="{ id: userInfo.adminId, form: userInfo }"
                            path="authority/accountEditing/EditMobile"
                            width="550px"
                            @okCallback="loadFilter"
                        >
                            <el-button key="primary" type="primary" link>{{ formState.mobile ? "修改手机号" : "绑定手机号" }}</el-button>
                        </DialogForm>
                    </el-form-item>
                    <el-form-item label="用户头像" prop="avatar">
                        <UploadAvatar v-model:avatar="formState.avatar" :avatarType="avatarType" :loading="loading"></UploadAvatar>
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email" v-if="adminType != 'shop'">
                        <TigInput classType="tig-form-input" v-model="formState.email" />
                    </el-form-item>
                    <el-form-item>
                        <el-button :loading="confirmLoading" size="large" type="primary" @click="onSubmit">提 交</el-button>
                    </el-form-item>
                </el-form>
            </a-spin>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { onMounted, reactive, ref, shallowRef } from "vue";
import { DefaultAvatar, FormAddGallery, UploadAvatar } from "@/components/gallery";
import { DialogForm } from "@/components/dialog";
import { message } from "ant-design-vue";
import { AccountEditingFormState } from "@/types/authority/accountEditing.d";
import { useUserStore } from "@/store/user";
import { getAdminInfo, adminInfoSubmit } from "@/api/authority/accountEditing";
import { extractContent } from "@/utils/util";
import MobileCard from "@/components/list/src/MobileCard.vue";
const adminType = ref(localStorage.getItem("adminType"));
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const loading = ref<boolean>(false);
const userStore = useUserStore();
const userInfo = reactive<any>(JSON.parse(localStorage.getItem("user") || "{}").userInfo);
const formState = ref<AccountEditingFormState>({
    avatar: "",
    defAvatar: "",
    username: "",
    email: "",
    id: "",
    mobile: ""
});
const avatarType = ref(true);
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getAdminInfo({
            id: userInfo.adminId
        });
        formState.value.mobile = String(adminType.value != "shop" ? result.mobile : result.adminUser?.mobile || "");
        formState.value.username = String(adminType.value != "shop" ? result.username : result.adminUser?.username || "");
        formState.value.email = String(result.email);
        formState.value.id = String(result.id);
        formState.value.avatar = adminType.value != "shop" ? userInfo.avatar : result.avatar;
        let temp = extractContent(String(formState.value.avatar));
        if (temp == "one") {
            avatarType.value = true;
        } else if (temp == "def") {
            avatarType.value = false;
        }
        userStore.setUserInfo(adminType.value != "shop" ? result : result.adminUser || result);
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

// 表单通过验证后提交
const onSubmit = async () => {
    confirmLoading.value = true;
    try {
        const result = await adminInfoSubmit({ ...formState.value });
        message.success("修改成功");
        await loadFilter();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};

    
loadFilter();
</script>

<style lang="less" scoped>
p {
    line-height: 16px;
    margin-right: 20px;
}

.el-button {
    margin-right: 15px;
}

.avatar-type {
    display: flex;
    flex-direction: row;
    gap: 10px;
    width: 100%;
    align-items: center;
}
.tips {
    color: #1456f0;
    margin-right: 2px;
    cursor: pointer;
}
</style>
