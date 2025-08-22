<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '权限名称不能为空!' }]" label="权限名称" prop="authorityName">
                        <TigInput classType="tig-form-input" v-model="formState.authorityName" />
                    </el-form-item>
                    <el-form-item
                        :rules="[
                            { required: true, message: '唯一编号不能为空!' },
                            { validator: validateEnglish, trigger: 'blur' }
                        ]"
                        label="唯一编号"
                        prop="authoritySn"
                    >
                        <TigInput classType="tig-form-input" v-model="formState.authoritySn" />
                        <div class="extra">只能为英文字母，推荐小驼峰，非目录权限则以Manage结尾，如：productManage</div>
                    </el-form-item>
                    <!-- <el-form-item :rules="[{ required: true, message: '路由地址不能为空!' }]" label="路由地址" prop="routeLink">
                        <TigInput classType="tig-form-input" v-model="formState.routeLink" />
                        <div class="extra">格式为 product/list/ 或 product/brand/list/</div>
                    </el-form-item> -->
                    <el-form-item label="上级分类" prop="parentId">
                        <SelectAuthority
                            v-if="!loading"
                            v-model:authorityId="formState.parentId"
                            :multiple="false"
                            style="width: 100%"
                            :disabled="action == 'add' && !parentId"
                            :adminType="formState.adminType"
                        ></SelectAuthority>
                    </el-form-item>
                    <el-form-item label="ICO编码" prop="authorityIco">
                        <SelectIco v-model="formState.authorityIco"></SelectIco>
                        <div class="extra">请先在Tigshop设置中的"接口设置"中设置"ico图标库地址"</div>
                    </el-form-item>
                    <el-form-item label="排序" prop="sortOrder">
                        <TigInput classType="tig-form-input" TigInput type="integer" v-model="formState.sortOrder" />
                    </el-form-item>
                    <el-form-item label="权限所属系统" prop="adminType">
                        <el-radio-group v-model="formState.adminType" disabled>
                            <el-radio value="admin">管理后台</el-radio>
                            <el-radio value="shop">店铺后台</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="是否显示" prop="isShow">
                        <el-radio-group v-model="formState.isShow">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="细分权限">
                        <DynamicList v-model="formState.childAuth" :templateList="['authName', 'authSn']" buttonName="新增细分权限">
                            <template #dynamicSlot="item">
                                <el-space :size="16">
                                    <el-space :size="0">
                                        权限名称：
                                        <TigInput v-model="item.item.authName" placeholder="权限名称" style="width: 100px" />
                                    </el-space>
                                    <el-space :size="0">
                                        权限编码：
                                        <TigInput v-model="item.item.authSn" placeholder="权限编码" style="width: 100px" />
                                    </el-space>
                                </el-space>
                            </template>
                        </DynamicList>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交 </el-button>
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
import { SelectAuthority } from "@/components/select";
import type { AuthorityFormState } from "@/types/authority/authority";
import { getAuthority, updateAuthority } from "@/api/authority/authority";
import { DynamicList } from "@/components/list";
import SelectIco from "@/components/select/src/SelectIco.vue";
import { useMenusStore } from "@/store/menu";
import { updateMenu } from "@/utils/menus";
import type { MainMenu } from "@/types/common/common.d";
const menusStore = useMenusStore();
// 父组件回调
const emit = defineEmits([
    "submitCallback", //确认后回调
    "update:confirmLoading", //确认按钮的loading状态
    "close" //关闭弹窗
]);
//获取来自父组件的参数
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    parentId: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    adminType: {
        type: String,
        default: "admin"
    },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<AuthorityFormState>({
    childAuth: [],
    adminType: (props.isDialog ? props.adminType : String(query.adminType)),
    isShow:1,
});

const fetchAuthority = async () => {
    try {
        const result = await getAuthority(action.value, { id: id.value });
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchAuthority();
    } else {
        loading.value = false;
    }
    if (operation === "create") {
        formState.value.parentId = props.parentId;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateAuthority(operation, { id: id.value, ...formState.value });
        emit("submitCallback", result);
        message.success("操作成功");
        menusStore.mainMenu = await updateMenu() as MainMenu[];
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

const validateEnglish = (rule: any, value: any, callback: any) => {
    const regex = /^[a-zA-Z]+$/;
    if (!regex.test(value)) {
        callback(new Error("只能输入英文字母"));
    } else {
        callback();
    }
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.cascader {
    width: 100%;
}
</style>
