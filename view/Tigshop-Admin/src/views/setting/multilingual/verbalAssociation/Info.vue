<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item prop="name" label="所属地区：" :rules="[{ required: true, message: '所属地区不能为空!' }]">
                        <TigInput classType="tig-form-input" type="text" :maxlength="60" v-model="formState.name" />
                        <div class="extra">例如：中国、中国香港、中国台湾、英国、法国</div>
                    </el-form-item>
                    <el-form-item prop="code" label="语言识别码：" :rules="[{ required: true, message: '语言识别码不能为空!' }]">
                        <TigInput classType="tig-form-input" type="text" :maxlength="60" v-model="formState.code" />
                        <div class="extra">浏览器语言识别码</div>
                    </el-form-item>
                    <el-form-item prop="localesId" label="关联语言：" :rules="[{ required: true, message: '请选择关联语言!' }]">
                        <el-select
                            v-model="formState.localesId"
                            placeholder="请选择关联语言"
                            size="default"
                            >
                            <el-option
                                v-for="item in filterState"
                                :key="item.id"
                                :label="item.language"
                                :value="item.id"
                            />
                        </el-select>
                        <div class="extra">请选择关联语言，语言类型是由您自行添加的</div>
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
import type { LocalesRelationFormState } from "@/types/multilingual/verbalAssociation.d";
import { getLocalesRelation, updateLocalesRelation, getLocalesRelationConfig } from "@/api/multilingual/verbalAssociation";
import { FormAddGallery } from "@/components/gallery";
import type { LocalesFilterState, LocalesFilterParams } from "@/types/multilingual/languagesList.d";
import { getLocalesList, batchSubmit, updateLocalesFiled, delLocales } from "@/api/multilingual/languagesList";
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
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
const filterState = ref<LocalesFilterState[]>();
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<LocalesRelationFormState>({
    code: '',
    name: '',
    localesId: 0,
});
const filterParams = reactive<LocalesFilterParams>({
    page: 1,
    size: 99999,
    sortField: '',
    sortOrder: '',
    keyword: '',
});
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getLocalesList({ ...filterParams });
        filterState.value = result.records;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}
// const _getLocalesRelationConfig = async () => {
//     try {
//         const result = await getLocalesRelationConfig();
//         codeList.value = result.codeList;
//         console.log(result);
//     } catch (error: any) {
//         message.error(error.message);
//     } finally {
//         loading.value = false;
//     }
// }
onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        _getLocales();
    } else {
        loading.value = false;
    }
    loadFilter()
});
const _getLocales = async () => {
    try {
        const result = await getLocalesRelation(action.value, {
            id: id.value
        });
        Object.assign(formState.value, result);
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
        const result = await updateLocalesRelation(operation, { id: id.value, ...formState.value });
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
<style lang="less" scoped>
.container{
    .tig-radio{
        :deep(.el-radio-group){
            display: block;
            font-size: 12px;
        }
        :deep(.el-radio){
            margin-right: 0px;
        }
        .check-box{
            cursor: pointer;
            :deep(.el-input-group__append){
                background-color: #fff !important;
                padding: 0;
                box-shadow: none;
            }
            .item{
                width: 35px;
                height: 25px;
                line-height: 25px;
                text-align: center;
                border: 1px solid #b8b8b8;
            }
            .active{
                border: 1px solid var(--tig-primary);
                color: var(--tig-primary);
                background-color: #e6efff;
            }
            .disabled{
                .item{
                    background-color: #f7f7f7;
                    color: #ccc;
                }
                .active{
                    border: 1px solid #b8b8b8;
                    background-color: #e0e0e0;
                }
            }
        }
    }
    .itemWidth{
        margin-bottom: 3px;
        margin-left: 10px;
    }
    .red{
        color: var(--el-color-danger);
    }
}

</style>
