<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '等级名称不能为空!' }]" label="等级名称" prop="rankName">
                        <TigInput classType="tig-form-input" v-model="formState.rankName"/>
                    </el-form-item>
                    <el-form-item label="等级标志" prop="rankIco">
                        <FormAddGallery v-model:photo="formState.rankIco"></FormAddGallery>
                        <div class="extra">请统一上传比例为1:1的图片（高清）</div>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '积分下限不能为空!' }]" label="积分下限" prop="minGrowthPoints">
                        <TigInput classType="tig-form-input" v-model="formState.minGrowthPoints" type="integer"/>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '积分上限不能为空!' }]" label="积分上限" prop="maxGrowthPoints">
                        <TigInput classType="tig-form-input" v-model="formState.maxGrowthPoints" type="integer"/>
                    </el-form-item>
                    <el-form-item label="是否显示价格" prop="showPrice">
                        <el-radio-group v-model="formState.showPrice">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="等级类型" prop="rankType">
                        <el-radio-group v-model="formState.rankType" style="width: 100%">
                            <el-radio :value="1">根据成长值变化</el-radio>
                            <el-radio :value="2">固定等级</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '初始折扣率不能为空!' }]" label="初始折扣率" prop="discount">
                        <TigInput classType="tig-form-input" v-model="formState.discount" type="decimal"/>
                    </el-form-item>
                    <el-form-item label="背景颜色" prop="rankBg">
                        <SelectColor v-model:color="formState.rankBg"></SelectColor>
                    </el-form-item>
<!--                    会员权益-->
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
import {FormAddGallery} from '@/components/gallery'
import {UserRankFormState} from '@/types/user/userRank';
import {getUserRank, updateUserRank} from "@/api/user/userRank";
import {SelectColor} from "@/components/select/index"
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
const formState = ref<UserRankFormState>({
    showPrice:0,
    rankType:2
});
const fetchUserRank = async () => {
    try {
        const result = await getUserRank(action.value, {id: id.value});
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
        fetchUserRank();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateUserRank(operation, {id: id.value, ...formState.value});
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
