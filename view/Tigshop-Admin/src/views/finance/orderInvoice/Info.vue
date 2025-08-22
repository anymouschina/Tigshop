<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="申请会员" prop="username">
                        {{ formState.username || "--" }}
                    </el-form-item>
                    <el-form-item label="发票类型" prop="invoiceTypeName">
                        {{ formState.invoiceTypeName || "--" }}
                    </el-form-item>
                    <template v-if="formState.invoiceType === 2 && formState.userInvoice">
                        <el-form-item label="增票资质状态" prop="companyName">
                            <DialogForm
                                :showOnOk="false"
                                :params="{ act: 'detail', id: formState.userInvoice.invoiceId }"
                                isDrawer
                                path="finance/userInvoice/Info"
                                title="编辑增票资质申请"
                                width="600px"
                            >
                                {{ formState.userInvoice.statusName }} <a class="btn-link">[查看]</a>
                            </DialogForm>
                        </el-form-item>
                        <el-form-item label="公司名称" prop="companyName">
                            {{ formState.companyName || "--" }}
                        </el-form-item>
                        <el-form-item label="纳税人识别码" prop="companyCode">
                            {{ formState.companyCode || "--" }}
                        </el-form-item>
                        <el-form-item label="注册地址" prop="companyAddress">
                            {{ formState.companyAddress || "--" }}
                        </el-form-item>
                        <el-form-item label="注册电话" prop="companyPhone">
                            {{ formState.companyPhone || "--" }}
                        </el-form-item>
                        <el-form-item label="开户银行" prop="companyBank">
                            {{ formState.companyBank || "--" }}
                        </el-form-item>
                        <el-form-item label="银行账户" prop="companyAccount">
                            {{ formState.companyAccount || "--" }}
                        </el-form-item>
                    </template>
                    <template v-else>
                        <el-form-item label="发票抬头" prop="titleType">
                            {{ formState.titleType == 1 ? "个人" : "企业" }}
                        </el-form-item>
                        <el-form-item label="企业税号" prop="companyCode">
                            {{ formState.companyCode || "--" }}
                        </el-form-item>
                        <el-form-item label="发票内容" prop="invoiceContent">
                            {{ formState.invoiceContent || "--" }}
                        </el-form-item>
                    </template>
                    <el-form-item label="收票人姓名" prop="companyName">
                        {{ formState.companyName || "--" }}
                    </el-form-item>
                    <el-form-item label="收票人电话" prop="mobile">
                        {{ formState.mobile || "--" }}
                    </el-form-item>
                    <el-form-item label="收票人邮箱" prop="email">
                        {{ formState.email || "--" }}
                    </el-form-item>
                    <el-form-item label="收票人地址" prop="companyAddress">
                        {{ formState.companyAddress || formState.userAddress }}
                    </el-form-item>
                    <el-form-item label="申请状态" prop="status">
                        <el-radio-group v-model="formState.status">
                            <el-radio :value="0">待处理</el-radio>
                            <el-radio :value="1">已开</el-radio>
                            <el-radio :value="2">失败/作废</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="发票金额" prop="amount">
                        <TigInput classType="tig-form-input" type="decimal" v-model="formState.amount" />
                    </el-form-item>
                    <el-form-item label="上传发票附件" prop="invoiceAttachment">
                        <FormAddGallery v-if="!loading" v-model:photos="formState.invoiceAttachment" :isMultiple="true" :disabled="examine"></FormAddGallery>
                    </el-form-item>
                    <el-form-item label="申请未通过原因" prop="applyReply">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.applyReply" :row="2" type="textarea" />
                            <div class="extra">若通过可不写</div>
                        </div>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { FormAddGallery } from "@/components/gallery";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import type { OrderInvoiceFormState } from "@/types/finance/orderInvoice.d";
import { getOrderInvoice, updateOrderInvoice } from "@/api/finance/orderInvoice";
import { DialogForm } from "@/components/dialog";
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
const formState = ref<OrderInvoiceFormState>({});
const examine = ref<boolean>(false);
const fetchOrderInvoice = async () => {
    try {
        const result = await getOrderInvoice(action.value, { id: id.value });
        if(result.invoiceAttachment && result.invoiceAttachment.length > 0){
            examine.value = true;
        }
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // 获取详情数据
    fetchOrderInvoice();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateOrderInvoice(operation, { id: id.value, ...formState.value });
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
<style scoped lang="less"></style>
