<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :rules="rules" :model="formState" label-width="auto">
                    <el-form-item prop="language" label="语言名称：" :rules="[{ required: true, message: '语言名称不能为空!' }]">
                        <TigInput classType="tig-form-input" type="text" :maxlength="60" v-model="formState.language" />
                    </el-form-item>
                    <!-- <el-form-item prop="localeCode" label="语言识别码：">
                        <TigInput classType="tig-form-input" type="text" :maxlength="60" v-model="formState.localeCode" />
                    </el-form-item> -->
                    <el-form-item prop="localeCode" label="语言识别码：" :rules="[{ required: true, message: '请选择语言识别码!' }]">
                        <SelectLocaleCode v-model:modelValue="formState.localeCode"></SelectLocaleCode>
                        <div class="extra">请选择关联语言，语言类型是由您自行添加的</div>
                    </el-form-item>
                    <!-- <el-form-item prop="flagPicture" label="语言图标：" :rules="[{ required: true, message: '语言图标不能为空!' }]">
                        <FormAddGallery v-model:photo="formState.flagPicture" style="width: 100%"/>
                    </el-form-item> -->
                    <el-form-item prop="isEnabled" label="是否启用：">
                        <el-radio-group v-model="formState.isEnabled">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item prop="isDefault" label="是否默认：">
                        <el-radio-group v-model="formState.isDefault">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import type { FormRules } from "element-plus";
import type { LocalesFormState } from "@/types/multilingual/languagesList.d";
import { getLocales, updateLocales } from "@/api/multilingual/languagesList";
import { FormAddGallery } from "@/components/gallery";
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
import type { LocalesRelationFilterState, LocalesRelationFilterParams } from "@/types/multilingual/verbalAssociation.d";
import { getLocalesRelationList } from "@/api/multilingual/verbalAssociation";
import { SelectLocaleCode } from "@/components/select";

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    promotionType: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    isDialog: {
        type: Boolean,
        default: false
    }
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<LocalesFormState>({
    language: '',
    localeCode: '',
    isEnabled: 0,
    isDefault: 0,
});
const filterParams = reactive<LocalesRelationFilterParams>({
    page: 1,
    size: 9999,
    sortField: '',
    sortOrder: '',
    keyword: '',
});

onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        _getLocales();
    } else {
        loading.value = false;
    }
});
const _getLocales = async () => {
    try {
        const result = await getLocales(action.value, {
            id: id.value
        });
        formState.value = result
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateLocales(operation, { id: id.value, ...formState.value });
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
const validateSendTime = (rule: any, value: any, callback: any) => {
    if(!formState.value.language && !formState.value.language){
        callback(new Error("请输入用券时间"));
        return
    }
    callback();
}
interface RuleForm {
    promotionName: string;
    sendType: number;
}
const rules = reactive<FormRules<RuleForm>>({
    promotionName: [{ required: true, message: "请输入活动名称", trigger: "blur" }],
    sendType: [{ required: true,  validator: validateSendTime, trigger: "blur" }]
});
defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>


</style>
