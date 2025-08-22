<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '物流公司名称不能为空!' }]" label="物流公司名称"
                                  prop="logisticsName">
                        <TigInput classType="tig-form-input" v-model="formState.logisticsName" />
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '物流代号不能为空!' }]" label="物流代号"
                                  prop="logisticsCode">
                        <TigInput classType="tig-form-input" v-model="formState.logisticsCode" />
                    </el-form-item>
                    <el-form-item label="物流公司描述" prop="logisticsDesc">
                        <TigInput classType="tig-form-input" v-model="formState.logisticsDesc" :row="3"
                                  type="textarea" />
                    </el-form-item>
                    <el-form-item label="客户编码" prop="customerName">
                        <TigInput classType="tig-form-input" v-model="formState.customerName" />
                        <div class="extra">请联系合作快递网点获取客户编码，允许为空。</div>
                    </el-form-item>
                    <el-form-item label="密码" prop="customerPwd">
                        <TigInput classType="tig-form-input" v-model="formState.customerPwd" />
                        <div class="extra">请联系合作快递网点获取密码</div>
                    </el-form-item>
                    <el-form-item label="月结号" prop="monthCode">
                        <TigInput classType="tig-form-input" v-model="formState.monthCode" />
                        <div class="extra">请联系合作快递网点获取月结号</div>
                    </el-form-item>
                    <el-form-item label="网点编码" prop="sendSite">
                        <TigInput classType="tig-form-input" v-model="formState.sendSite" />
                        <div class="extra">请联系合作快递网点获取网点编码</div>
                    </el-form-item>
                    <el-form-item label="网点名称" prop="sendStaff">
                        <TigInput classType="tig-form-input" v-model="formState.sendStaff" />
                        <div class="extra">请联系合作快递网点获取网点名称</div>
                    </el-form-item>
                    <el-form-item label="快递业务类型" prop="expType">
                        <TigInput classType="tig-form-input" v-model="formState.expType" type="number" />
                        <div class="extra">请联系合作快递网点获取快递业务类型,（例如：顺丰特快填1，顺丰标快填2）</div>
                    </el-form-item>
                    <el-form-item label="排序" prop="sortOrder">
                        <TigInput classType="tig-form-input" type="integer" v-model="formState.sortOrder" />
                    </el-form-item>
                    <el-form-item label="是否显示" prop="isShow">
                        <el-radio-group v-model="formState.isShow">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交
                        </el-button>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width:100%;margin-top:100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import type { LogisticsCompanyFormState } from "@/types/setting/logisticsCompany";
import { getLogisticsCompany, updateLogisticsCompany } from "@/api/setting/logisticsCompany";

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
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<LogisticsCompanyFormState>({
    sortOrder: 50,
    isShow: 1
});
const fetchLogisticsCompany = async () => {
    try {
        const result = await getLogisticsCompany(action.value, { id: id.value });
        Object.assign(
            formState.value,
            result
        );
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
        fetchLogisticsCompany();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateLogisticsCompany(operation, { id: id.value, ...formState.value });
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
