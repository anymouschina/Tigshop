<template>
    <div>
        <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
            <el-form-item>
                <div class="extra">
                    什么是转移商品分类?
                    <br />
                    如果需要对商品的分类进行变更,那么你可以通过此功能,正确管理你的商品分类。
                </div>
            </el-form-item>
            <el-form-item label="" prop="id">
                <SelectCategory v-if="!loading" v-model:categoryId="formState.id" :multiple="false" disabled></SelectCategory>
                <div class="extra" style="margin: 0 20px;">转移至</div>
                <SelectCategory v-if="!loading" v-model:categoryId="formState.targetCatId" :multiple="false"></SelectCategory>
            </el-form-item>
            <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交 </el-button>
            </el-form-item>
        </el-form>
    </div>
</template>
<script lang="ts" setup>
import { SelectCategory } from "@/components/select";
import { onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { moveCategory } from "@/api/product/category";
import { useRouter } from "vue-router";
import { CategoryMoveState } from "@/types/product/category";

const loading = ref<boolean>(true);

//获取来自父组件的参数
const props = defineProps({
    id: {
        type: Number,
        required: true
    },
    isDialog: Boolean
});
// 表单参数初使化
const formRef = ref(); //表单Ref
const query = useRouter().currentRoute.value.query;
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const formState = ref<CategoryMoveState>({
    id: props.isDialog ? props.id : Number(query.id),
    targetCatId: 0
}); //表单数据
// 父组件回调
const emit = defineEmits([
    "submitCallback", //确认后回调
    "update:confirmLoading", //确认按钮的loading状态
    "close" //关闭弹窗
]);

onMounted(async () => {
    loading.value = false;
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        console.log(formState.value);
        const result = await moveCategory({ ...formState.value });
        emit("submitCallback", result);
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        emit("update:confirmLoading", false);
    }
};

// 处理

const onFormSubmit = () => {
    // 模拟点击提交Form表单
    onSubmit();
};

defineExpose({
    onFormSubmit
});
</script>
<style lang="less" scoped></style>
