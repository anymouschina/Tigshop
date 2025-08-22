<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '标题不能为空!' }]" label="标题" prop="messageTitle">
                        <TigInput classType="tig-form-input" v-model="formState.messageTitle"/>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '内容不能为空!' }]" label="内容" prop="messageContent">
                        <TigInput classType="tig-form-input" v-model="formState.messageContent" row="2" type="textarea"/>
                    </el-form-item>
                    <el-form-item label="链接" prop="messageLink">
                        <SelectLink v-model="formState.messageLink"></SelectLink>
                    </el-form-item>
                    <el-form-item label="发送类型" prop="sendUserType">
                        <el-select v-model="formState.sendUserType" style="width: 100%;margin-bottom: 20px">
                            <el-option :value="0" label="全部会员"/>
                            <el-option :value="1" label="单个会员"/>
                            <el-option :value="2" label="会员等级"/>
                            <el-option :value="3" label="部分会员"/>
                        </el-select>
                        <template v-if="formState.sendUserType===1">
                            <SelectUser :multiple="false" v-model:userId="formState.userIds"></SelectUser>
                        </template>
                        <template v-else-if="formState.sendUserType===2">
                            <SelectRankList v-model="formState.userRank"></SelectRankList>
                        </template>
                        <template v-else-if="formState.sendUserType===3">
                            <TigInput classType="tig-form-input" v-model="formState.userIds" :row="2" type="textarea"/>
                            <div class="extra">注意：输入会员名称时，请用英文逗号隔开。</div>
                        </template>
                        <template v-else>

                        </template>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
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
import type {MessageLogFormState} from '@/types/user/messageLog.d';
import {getMessageLog, updateMessageLog} from "@/api/user/messageLog";
import {SelectLink, SelectRankList, SelectUser} from "@/components/select";
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
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<MessageLogFormState>({});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateMessageLog(operation, {id: id.value, ...formState.value});
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
