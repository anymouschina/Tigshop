<template>
    <div class="container">
        <div class="lyecs-form-table">
            <h2>
                <span>类型:{{ formData.typeName }} </span>
                <span v-if="formData.productId">【 {{ formData.product.productName }} 】</span>
            </h2>
        </div>
        <el-divider />
        <div class="lyecs-form-table">
             <p>主题:{{formData.title}} </p>
            <p>内容: {{ formData.content }}</p>
            <p style="text-align: end;">【 留言板 】{{ formData.username }} @ {{ formData.addTime }}</p>
        </div>
        <el-divider />
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="回复内容" prop="content">
                        <TigInput classType="tig-form-input" type="textarea" :rows="5" v-model="formState.content"/>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {onMounted, ref, shallowRef} from "vue"
import {useRouter} from 'vue-router'
import {message} from "ant-design-vue";
import {FeedbackFormState} from '@/types/user/feedback';
import {getFeedback, updateFeedback} from "@/api/user/feedback";
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
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formData = ref<FeedbackFormState>({
    product:{
        productId: 0,
        productName: ''
    }
});
const formState = ref<FeedbackFormState>({
    product:{
        productId: 0,
        productName: ''
    }
});
const fetchUserRank = async () => {
    try {
        const result = await getFeedback(action.value, {id: id.value});
        Object.assign(
          formData.value,
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
    fetchUserRank();
});
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        let parentId:any = 0;
        if(formData.value.status == 1){
            parentId = formData.value.id
        }
        const result = await updateFeedback(operation, {id: id.value,parentId:parentId, ...formState.value});
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
<style lang="less" scoped>
.lyecs-form-table{
    h2{
        line-height: 30px;
    }
    p{
        line-height: 20px;
    }
}
</style>
