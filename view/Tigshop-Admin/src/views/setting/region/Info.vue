<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '地区名称不能为空!' }]" label="地区名称" prop="regionName">
                        <TigInput classType="tig-form-input" v-model="formState.regionName"/>
                    </el-form-item>
                    <el-form-item label="上级地区" prop="parentName">
                        <TigInput classType="tig-form-input" disabled v-model="formState.parentName"/>
                    </el-form-item>
                    <el-form-item label="是否热门" prop="isHot">
                        <el-radio-group v-model="formState.isHot" style="width: 100%">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
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
import type {RegionFormState} from '@/types/setting/region';
import {getRegion, getRegionList, updateRegion} from "@/api/setting/region";
import {SelectRegion} from "@/components/select";
import { useRegionStore } from "@/store/region";
const region:any = useRegionStore();
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
    isDialog: Boolean,
    regionId:{
        type: Number,
        default: 0
    }
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));

const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<RegionFormState>({
    isHot:0
});
const fetchRegion = async () => {
    try {
        const result = await getRegion(action.value, {id: id.value});
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
const fetchRegionList = async () => {
    try {
        const result = await getRegionList({regionId: props.regionId});
        if(result.records&&result.records.length>0){
            formState.value.parentId = result.records[0].regionId
            formState.value.parentName = result.records[0].regionName
        }else{
            formState.value.parentId = 0
            formState.value.parentName = '顶级地区'
        }
    } catch (error:any) {
        message.error(error.message);
    }
}

onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchRegion()
    } else {
        loading.value = false;
    }
    fetchRegionList()
});
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateRegion(operation, {id: id.value, ...formState.value});
        region.clearRegion()
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
