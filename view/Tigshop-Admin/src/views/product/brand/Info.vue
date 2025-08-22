<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '品牌名称不能为空!' }]" label="品牌名称" prop="brandName">
                        <BusinessData
                            v-model:modelValue="formState.brandName"
                            placeholder="请输入品牌名称"
                            :dataType="4"
                            :dataId="id"
                            :disabled="examine == 1"
                        ></BusinessData>
                    </el-form-item>
                    <el-form-item label="品牌LOGO" prop="brandLogo">
                        <FormAddGallery v-model:photo="formState.brandLogo" :disabled="examine == 1"></FormAddGallery>
                        <div class="extra">请统一上传比例为2:1的图片，宽200px，高100px（高清）</div>
                    </el-form-item>
                    <el-form-item label="品牌描述" prop="brandDesc">
                        <TigInput classType="tig-form-input" v-model="formState.brandDesc" :row="2" type="textarea" :disabled="examine == 1" />
                    </el-form-item>
                    <el-form-item label="排序" prop="sortOrder" v-if="adminType === 'admin'">
                        <TigInput classType="tig-form-input" type="integer" v-model="formState.sortOrder" :disabled="examine == 1" />
                    </el-form-item>
                    <el-form-item label="首字母" prop="firstWord">
                        <TigInput classType="tig-form-input" v-model="formState.firstWord" :disabled="examine == 1" />
                        <div class="extra">如果不填则自动生成，不过有些多音字无法准确判断，如“重”字系统则无法确认是Z还是C</div>
                    </el-form-item>
                    <el-form-item label="是否显示" prop="isShow">
                        <el-radio-group v-model="formState.isShow" :disabled="examine == 1">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="是否热门品牌" prop="brandIsHot" v-if="adminType === 'admin'">
                        <el-radio-group v-model="formState.brandIsHot" :disabled="examine == 1">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
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
import { BrandFormState } from "@/types/product/brand";
import { getBrand, updateBrand } from "@/api/product/brand";
import BusinessData from "@/components/multilingual/BusinessData.vue";
import { getAdminType } from "@/utils/storage";
const adminType = getAdminType();
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
    examine: {
        type: Number,
        default: 0
    },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<BrandFormState>({
    sortOrder: 50,
    isShow: 1,
    brandIsHot: 0
});
const fetchBrand = async () => {
    try {
        const result = await getBrand(action.value, { id: id.value });
        Object.assign(formState.value, result);
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
        fetchBrand();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateBrand(operation, { id: id.value, ...formState.value });
        emit("submitCallback", result);
        message.success(result);
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
