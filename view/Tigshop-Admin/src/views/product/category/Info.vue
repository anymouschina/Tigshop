<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '分类名称不能为空!' }]" label="分类名称" prop="categoryName">
                        <BusinessData v-model:modelValue="formState.categoryName" placeholder="请输入分类名称" :dataType="3" :dataId="id"></BusinessData>
                    </el-form-item>
                    <el-form-item label="分类短名" prop="shortName">
                        <TigInput classType="tig-form-input" v-model="formState.shortName" />
                    </el-form-item>
                    <el-form-item label="上级分类" prop="parentId">
                        <SelectCategory v-if="!loading" v-model:categoryId="formState.parentId" :multiple="false"></SelectCategory>
                    </el-form-item>
                    <el-form-item label="分类图片" prop="categoryPic">
                        <FormAddGallery v-model:photo="formState.categoryPic"></FormAddGallery>
                        <div class="extra">请统一上传比例为2:1的图片，宽200px，高100px（高清）</div>
                    </el-form-item>
                    <el-form-item label="数量单位" prop="measureUnit">
                        <TigInput classType="tig-form-input" v-model="formState.measureUnit" />
                    </el-form-item>
                    <!-- <el-form-item label="ICO图标" prop="categoryIco">
                        <TigInput classType="tig-form-input" v-model="formState.categoryIco" />
                        <div class="extra">请先在Tigshop设置中的"接口设置"中设置"ico图标库地址"</div>
                    </el-form-item> -->
                    <el-form-item label="SEO标题" prop="seoTitle">
                        <TigInput classType="tig-form-input" v-model="formState.seoTitle" />
                        <div class="extra">如果不填，则该分类页的标题则为默认标题；如果该项不为空，则该分类页的标题显示此项的内容。</div>
                    </el-form-item>
                    <el-form-item label="热门搜索词" prop="searchKeywords" v-if="false">
                        <TigInput classType="tig-form-input" v-model="formState.searchKeywords" />
                    </el-form-item>
                    <el-form-item label="关键字" prop="keywords">
                        <TigInput classType="tig-form-input" v-model="formState.keywords" />
                    </el-form-item>
                    <el-form-item label="分类描述" prop="categoryDesc">
                        <TigInput classType="tig-form-input" v-model="formState.categoryDesc" :row="2" type="textarea" />
                    </el-form-item>
                    <el-form-item label="排序" prop="sortOrder">
                        <TigInput classType="tig-form-input" type="integer" v-model="formState.sortOrder" />
                    </el-form-item>
                    <el-form-item label="是否热门" prop="isHot">
                        <el-radio-group v-model="formState.isHot">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="是否显示" prop="isShow">
                        <el-radio-group v-model="formState.isShow">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交 </el-button>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { FormAddGallery } from "@/components/gallery";
import { SelectCategory } from "@/components/select";
import { useAppStore } from "@/store/app";
import { CategoryFormState } from "@/types/product/category";
import { getCategory, updateCategory } from "@/api/product/category";
import { AnyObject } from "ant-design-vue/es/_util/type";
import { useCategoryStore } from "@/store/category";
import BusinessData from "@/components/multilingual/BusinessData.vue"
const appStore = useAppStore();
// 父组件回调
const emit = defineEmits([
    "submitCallback", //确认后回调
    "update:confirmLoading", //确认按钮的loading状态
    "close" //关闭弹窗
]);
//获取来自父组件的参数
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    isDialog: Boolean,
    parentId: Number
});

const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<CategoryFormState>({
    isShow: 1,
    sortOrder: 50
});
const fetchCategory = async () => {
    try {
        const result = await getCategory(action.value, { id: id.value });
        // const additionalData = action.value === 'add' ? {parentId: props.parentId} : {};
        Object.assign(
            formState.value,
            result
            // additionalData
        );
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
        fetchCategory();
    } else {
        loading.value = false;
    }
    if (operation === "create") {
        formState.value.parentId = props.parentId;
        console.log(formState.value.parentId);
    }
});

// 表单通过验证后提交

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateCategory(operation, { id: id.value, ...formState.value });
        emit("submitCallback", result);
        message.success("操作成功");
        const categoryStore = useCategoryStore();
        categoryStore.clearCategory();
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
