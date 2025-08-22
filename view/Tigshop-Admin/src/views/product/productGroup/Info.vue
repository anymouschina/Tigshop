<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '分组名称不能为空!' }]" label="分组名称" prop="productGroupName">
                        <TigInput classType="tig-form-input" v-model="formState.productGroupName"/>
                    </el-form-item>
                    <el-form-item label="分组别名" prop="productGroupSn">
                        <TigInput classType="tig-form-input" v-model="formState.productGroupSn"/>
                    </el-form-item>
                    <el-form-item label="分组描述" prop="productGroupDescription">
                        <TigInput classType="tig-form-input" v-model="formState.productGroupDescription" :row="2" type="textarea"/>
                    </el-form-item>
                    <el-form-item label="分组商品" prop="productIds">
                        <SelectProduct v-if="!loading" v-model:ids="formState.productIds"></SelectProduct>
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
import {ProductGroupFormState} from '@/types/product/productGroup';
import {getProductGroup, updateProductGroup} from "@/api/product/productGroup";
import {SelectProduct} from "@/components/select";
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
const formState = ref<ProductGroupFormState>({
    productIds:[]
});
const fetchProductGroup = async () => {
    try {
        const result = await getProductGroup(action.value, {id: id.value});
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


onMounted(() => {
    console.log(action.value);
    if (action.value === "detail") {
        // 获取详情数据
        fetchProductGroup();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateProductGroup(operation, {id: id.value, ...formState.value});
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

defineExpose({onFormSubmit});
</script>
