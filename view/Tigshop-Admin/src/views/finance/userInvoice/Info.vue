<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                        <el-form-item label="申请会员" prop="username">
                            {{formState.username}}
                        </el-form-item>
                        <el-form-item label="公司名称" prop="companyName">
                            {{formState.companyName}}
                        </el-form-item>
                        <el-form-item label="纳税人识别码" prop="companyCode">
                            {{formState.companyCode}}
                        </el-form-item>
                        <el-form-item label="注册地址" prop="companyAddress">
                            {{formState.companyAddress}}
                        </el-form-item>
                        <el-form-item label="注册电话" prop="companyPhone">
                            {{formState.companyPhone}}
                        </el-form-item>
                        <el-form-item label="开户银行" prop="companyBank">
                            {{formState.companyBank}}
                        </el-form-item>
                        <el-form-item label="银行账户" prop="companyAccount">
                            {{formState.companyAccount}}
                        </el-form-item>
<!--                        <el-form-item label="税务登记证副本" prop="postscript">-->
<!--                        </el-form-item>-->
                        <el-form-item label="申请状态" prop="status">
                            <el-radio-group v-model="formState.status">
                                <el-radio :value="1">审核通过</el-radio>
                                <el-radio :value="2">待审核</el-radio>
                                <el-radio :value="3">审核未通过</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="申请未通过原因" prop="applyReply">
                            <TigInput classType="tig-form-input" v-model="formState.applyReply" :row="2" type="textarea"/>
                            <div class="extra">若通过可不写</div>
                        </el-form-item>
                        <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                            <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
                        </el-form-item>


                </el-form>
                <a-spin :spinning="loading" style="width:100%;margin-top:100px"/>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {onMounted, ref, shallowRef} from "vue"
import {useRouter} from 'vue-router'
import {message} from "ant-design-vue";
import type {UserInvoiceFormState} from '@/types/finance/userInvoice.d';
import {getUserInvoice, updateUserInvoice} from "@/api/finance/userInvoice";
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ''
    },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<UserInvoiceFormState>({
});
const fetchUserInvoice = async () => {
    try {
        const result = await getUserInvoice(action.value, {id: id.value});
        Object.assign(
          formState.value,
          result
        )
    } catch (error:any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};


onMounted(() => {
    // 获取详情数据
    fetchUserInvoice();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateUserInvoice(operation, {id: id.value, ...formState.value});
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error:any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit()
};

defineExpose({onFormSubmit});
</script>
<style scoped lang="less">

</style>
