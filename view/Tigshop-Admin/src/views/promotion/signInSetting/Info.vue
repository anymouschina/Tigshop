<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item prop="name" label="名称" :rules="[{ required: true, message: '名称不能为空!' }]">
                        <TigInput classType="tig-form-input" v-model="formState.name" />
                    </el-form-item>
                    <el-form-item prop="points" label="赠送积分" :rules="[{ required: true, message: '赠送积分不能为空!' }]">
                        <TigInput classType="tig-form-input" type="integer" v-model="formState.points" />
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
import { ref, shallowRef, onMounted } from "vue"
import { useRouter } from 'vue-router'
import { message } from "ant-design-vue";
import { FormAddGallery } from '@/components/gallery'
import { SignInSettingFormState } from '@/types/promotion/signInSetting.d';
import { getSignInSetting, updateSignInSetting } from "@/api/promotion/signInSetting";

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
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<SignInSettingFormState>({});

onMounted(() => {
    // 获取详情数据
    fetchSignInSetting();
});
const fetchSignInSetting = async () => {
    try {
        const result = await getSignInSetting(action.value, { id: id.value });
        Object.assign(
            formState.value,
            result
        )
    } catch (error: any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};


// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateSignInSetting(operation, { id: id.value, ...formState.value });
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit()
};

defineExpose({ onFormSubmit });
</script>