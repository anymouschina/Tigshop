<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="联系方式" prop="mobile">
                        <div>{{ formState.mobile }}</div>
                    </el-form-item>
                    <el-form-item label="询价内容" prop="content">
                        <div>{{ formState.content }}</div>
                    </el-form-item>
                    <el-form-item label="创建时间" prop="createTime">
                        <div>{{ formState.createTime }}</div>
                    </el-form-item>
                    <el-form-item label="回复内容" prop="remark" v-if="formState.status === 1" >
                        <TigInput classType="tig-form-input" v-model="formState.remark" :rows="6" type="textarea" disabled placeholder="请输入回复内容"/>
                    </el-form-item>
                    <el-form-item label="回复内容" prop="remark" v-if="formState.status === 0" :rules="[{ required: true, message: '请输入回复内容' }]">
                        <TigInput classType="tig-form-input" v-model="formState.remark" :rows="6" type="textarea" placeholder="请输入回复内容"/>
                    </el-form-item>
                    <el-form-item label=" " v-if="formState.status === 0">
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
import {FormAddGallery} from '@/components/gallery'
import {getPriceInquiry, updatePriceInquiryReply} from "@/api/product/enquiry";
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
const formState = ref<any>({
  
});
const fetchBrand  = async () => {
    try {
        const result = await getPriceInquiry(action.value, { id: id.value });
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
    if (action.value === "detail") {
        // 获取详情数据
        fetchBrand();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updatePriceInquiryReply({ id: id.value, remark:formState.value.remark });
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

defineExpose({ onFormSubmit });
</script>
