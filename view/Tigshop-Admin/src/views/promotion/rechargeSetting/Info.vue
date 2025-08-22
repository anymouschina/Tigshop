<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item prop="money" label="充值金额" :rules="[{ required: true, validator: validateMoney, trigger: 'blur' }]">
                        <TigInput classType="tig-form-input" type="decimal" v-model="formState.money" :min="0" />
                    </el-form-item>
                    <el-form-item prop="discountMoney" label="赠送金额" :rules="[{ required: true, validator: validateMoney, trigger: 'blur' }]">
                        <TigInput classType="tig-form-input" type="decimal" v-model="formState.discountMoney" :min="0" />
                    </el-form-item>
                    <el-form-item prop="sortOrder" label="排序">
                        <TigInput classType="tig-form-input" type="integer" v-model="formState.sortOrder" />
                    </el-form-item>
                    <el-form-item prop="isShow" label="是否显示">
                        <el-radio-group v-model="formState.isShow">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { FormAddGallery } from "@/components/gallery";
import { RechargeSettingFormState } from "@/types/promotion/rechargeSetting.d";
import { getRechargeSetting, updateRechargeSetting } from "@/api/promotion/rechargeSetting";

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
const formState = ref<RechargeSettingFormState>({
    discountMoney: "",
    money: "",
    sortOrder: 1,
    isShow: 1
});

onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchRechargeSetting();
    } else {
        loading.value = false;
    }
});
const fetchRechargeSetting = async () => {
    try {
        const result = await getRechargeSetting(action.value, { id: id.value });
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};
const validateMoney = (rule: any, value: any, callback: any) => {
    console.log(value);
    if (Number(value) === 0 || value === "") {
        callback(new Error("金额不能为0或者为空！"));
        return
    } else if (Number(value) < 0) {
        callback(new Error("金额必须大于0！"));
        return
    } else {
        callback();
    }
};
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateRechargeSetting(operation, { id: id.value, ...formState.value });
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
