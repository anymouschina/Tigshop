<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="服务商"prop="">
                        <el-radio-group :modelValue="1">
                            <el-radio :value="1">飞鹅云打印</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '名称不能为空!' }]" label="名称"
                                  prop="printName">
                        <TigInput classType="tig-form-input" v-model="formState.printName" />
                    </el-form-item>
                    <el-form-item label="USER" prop="thirdAccount" :rules="[{ required: true, message: 'USER不能为空!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.thirdAccount" />
                        <div class="extra">飞鹅云后台账号</div>
                    </el-form-item>
                    <el-form-item label="UYEK" prop="thirdKey" :rules="[{ required: true, message: 'UYEK不能为空!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.thirdKey" />
                        <div class="extra">
                            飞鹅云后台生成的UYEK，
                            <el-popover :width="400" placement="right-end" trigger="hover">
                                <template #reference>
                                    <a>查看示例</a>
                                </template>
                                <template #default>
                                    <img src="https://oss.tigshop.com/img/gallery/202507/1753684560T8OSH0XHLs8kXZKODe.jpeg" style="width: 380px" />
                                </template>
                            </el-popover>
                        </div>
                    </el-form-item>
                    <el-form-item label="打印机SN" prop="printSn" :rules="[{ required: true, message: '打印机SN不能为空!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.printSn" />
                        <div class="extra">
                            飞鹅云打印机标签上SN，
                            <el-popover :width="400" placement="right-end" trigger="hover">
                                <template #reference>
                                    <a>查看示例</a>
                                </template>
                                <template #default>
                                    <img src="https://oss.tigshop.com/img/gallery/202507/1753768520lp0CnlW3J9YOgwBS1P.jpg" style="width: 380px" />
                                </template>
                            </el-popover>
                        </div>
                    </el-form-item>
                    <el-form-item label="打印机KEY" prop="printKey" :rules="[{ required: true, message: '打印机KEY不能为空!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.printKey" />
                        <div class="extra">
                            飞鹅云打印机标签上KEY，
                            <el-popover :width="400" placement="right-end" trigger="hover">
                                <template #reference>
                                    <a>查看示例</a>
                                </template>
                                <template #default>
                                    <img src="https://oss.tigshop.com/img/gallery/202507/1753768520XcpUlaVT9k5Gdp5SD5.jpg" style="width: 380px" />
                                </template>
                            </el-popover>
                        </div>
                    </el-form-item>
                    <el-form-item label="订单支付自动打印"prop="">
                        <el-radio-group v-model="formState.autoPrint">
                            <el-radio :value="1">开启</el-radio>
                            <el-radio :value="2">关闭</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="打印机状态"prop="">
                        <el-radio-group v-model="formState.status">
                            <el-radio :value="1">启用</el-radio>
                            <el-radio :value="2">关闭</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <!-- <el-form-item label="打印联数" prop="printNumber">
                        <TigInput classType="tig-form-input" v-model="formState.printNumber" />
                        <div class="extra">打印机单次打印张数</div>
                    </el-form-item> -->
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
import { getPrintDetail, printCreateAndUpdate } from "@/api/setting/receiptPrint";
import type { PrintCreateParams } from "@/types/setting/receiptPrint";

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
const formState = ref<Omit<PrintCreateParams, 'printId'>>({
    printNumber: 1
} as PrintCreateParams);
const fetchGetPrintDetail = async () => {
    try {
        const result = await getPrintDetail({ id: id.value });
        let { addTime,platformText,shopId,statusText,updateTime, printNumber, platform, ...form } = result;
        Object.assign(formState.value, form);
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
        fetchGetPrintDetail();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await printCreateAndUpdate(operation, { printId: operation == 'create' ? undefined : id.value, ...formState.value });
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
