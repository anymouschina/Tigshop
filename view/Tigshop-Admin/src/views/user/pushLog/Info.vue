<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '标题不能为空!' }]" label="标题" prop="brandName">
                        <TigInput classType="tig-form-input" v-model="formState.brandName"/>
                    </el-form-item>
                    <el-form-item label="内容" :rules="[{ required: true, message: '内容不能为空!' }]" prop="brandDesc">
                        <TigInput classType="tig-form-input" v-model="formState.brandDesc" :row="2" type="textarea"/>
                    </el-form-item>
                    <el-form-item label="发送类型" prop="brandIsHot">
                        <el-select v-model="formState.sendUserType">
                            <el-option :value="0" label="全部会员" />
                            <el-option :value="1" label="单个会员" />
                            <el-option :value="2" label="会员等级" />
                            <el-option :value="3" label="部分会员" />
                        </el-select>
                        <template v-if="formState.brandIsHot===1">

                        </template>
                        <template v-else-if="formState.brandIsHot===2">
                            <SelectRankList v-model="formState.brandDesc"></SelectRankList>
                        </template>
                        <template v-else-if="formState.brandIsHot===3">
                            <TigInput classType="tig-form-input" v-model="formState.brandDesc" :row="2" type="textarea"/>
                            <div class="extra">注意：输入会员名称时，请用英文逗号隔开。</div>
                        </template>
                        <template v-else>

                        </template>
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
import {FormAddGallery} from '@/components/gallery'
import {PushLogFormState} from '@/types/user/pushLog.d';
import {getPushLog, updatePushLog} from "@/api/user/pushLog";
import {SelectRankList} from "@/components/select";
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
const operation = action.value === 'add' ? 'insert' : 'update';
const formRef = shallowRef();
const formState = ref<PushLogFormState>({});
const fetchPushLog  = async () => {
    try {
        const result = await getPushLog(action.value, { id: id.value });
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
    // 获取详情数据
    fetchPushLog();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updatePushLog(operation, { id: id.value, ...formState.value });
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

defineExpose({ onFormSubmit });
</script>
