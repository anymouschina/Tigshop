<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <div class="negotiation-box">
                    <el-form ref="formRef" :model="formState" label-width="auto">
                        <el-form-item label="售后方式：">
                            <p>{{ formData.aftersalesTypeName }}</p>
                        </el-form-item>
                        <el-form-item label="售后状态：">
                            <p>{{ formData.statusName }}</p>
                        </el-form-item>
                        <el-form-item
                            label="退款金额："
                            prop="refundAmount"
                            v-if="status == 2"
                            :rules="[
                                { required: true, message: '退款金额不能为空' },
                                { validator: validateRefundAmount, trigger: 'blur' }
                            ]"
                        >
                            <TigInput classType="tig-form-input" v-model="formState.refundAmount" type="decimal" placeholder="请输入退款金额" />
                            <div class="extra">最大退款金额{{ priceFormat(formData.suggestRefundAmount) || "0" }}</div>
                        </el-form-item>
                        <el-form-item
                            label="退货地址："
                            prop="returnAddress"
                            v-if="formData.aftersaleType == 1 && status == 2"
                            :rules="[{ required: status == 2 ? true : false, message: '退货地址不能为空' }]"
                        >
                            <TigInput classType="tig-form-input" v-model="formState.returnAddress" :rows="6" type="textarea" placeholder="请输入退货地址" />
                        </el-form-item>
                        <el-form-item
                            label="拒绝说明："
                            prop="reply"
                            v-if="status == 3"
                            :rules="[{ required: status == 3 ? true : false, message: '拒绝说明不能为空' }]"
                        >
                            <TigInput classType="tig-form-input" v-model="formState.reply" :rows="6" type="textarea" placeholder="请输入拒绝说明" />
                            <div>
                                <el-tag v-for="item in formData.refuseReason" :key="item" type="info" style="margin-right: 5px" @click="onChangeReason">
                                    {{ item }}
                                </el-tag>
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <div class="btn-box">
                                <el-button type="primary" v-if="formData.aftersaleType == 1" @click="onSubmit">{{
                                    status == 2 ? "同意并发送退货地址" : "拒绝退款"
                                }}</el-button>
                                <el-button type="primary" v-if="formData.aftersaleType == 2" @click="onSubmit">{{
                                    status == 2 ? "同意仅退款" : "拒绝仅退款"
                                }}</el-button>
                                <el-button @click="close">取消</el-button>
                            </div>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef, PropType } from "vue";
import { message } from "ant-design-vue";
import { FormState } from "@/types/order/aftersales";
import { updateAftersales } from "@/api/order/aftersales";
import { priceFormat } from "@/utils/format";

// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    formData: {
        type: Object as PropType<FormState>,
        default: 0
    },
    status: {
        type: Number,
        default: 2
    }
});
const loading = ref<boolean>(true);
const formRef = shallowRef();
const formState = ref<any>({
    status: props.status,
    refundAmount: null,
    reply: "",
    returnAddress: ""
});
const validateRefundAmount = (rule: any, value: any, callback: any) => {
    if (Number(value) > Number(props.formData.suggestRefundAmount)) {
        callback(new Error("退款金额不能大于最大退款金额"));
    } else {
        callback();
    }
};
const close = () => {
    emit("close");
};
const onChangeReason = (e: any) => {
    formState.value.reply = e.target.innerText;
};

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateAftersales({
            id: props.formData.aftersaleId,
            ...formState.value
        });
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
.negotiation-box {
    cursor: pointer;
}
.btn-box {
    display: flex;
    justify-content: flex-end;
    width: 100%;
}
</style>
