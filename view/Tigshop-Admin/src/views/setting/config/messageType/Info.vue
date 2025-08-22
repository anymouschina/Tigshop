<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-tabs v-model="activeKey" class="lyecs-tabs" tab-position="top" @tab-change="onTabChange">
                    <template v-for="item in tabs">
                        <el-tab-pane v-if="(formState as any)[item.prop] > -1" :label="item.label" :name="item.label"></el-tab-pane>
                    </template>

                    <!--                    <el-tab-pane v-if="formState.isMessage>-1" label="站内信" name="站内信"></el-tab-pane>-->
                    <!--                    <el-tab-pane v-if="formState.isMsg>-1" label="短信通知" name="短信通知"></el-tab-pane>-->
                    <!--                    <el-tab-pane v-if="formState.isWechat>-1" label="微信模板消息" name="微信模板消息"></el-tab-pane>-->
                    <!--                    <el-tab-pane v-if="formState.isMiniProgram>-1" label="小程序订阅消息" name="小程序订阅消息"></el-tab-pane>-->
                    <!--                    <el-tab-pane v-if="formState.isApp>-1" label="APP" name="APP"></el-tab-pane>-->
                    <!--                    <el-tab-pane v-if="formState.isDing>-1" label="钉钉" name="钉钉"></el-tab-pane>-->
                </el-tabs>
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <div v-if="activeKey==='站内信'">
                        <el-form-item label="通知标题" prop="templateName">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.messageData.templateName"/>
                        </el-form-item>
                        <el-form-item label="通知内容" prop="content">
                            <div class="tznr">
                                <TigInput classType="tig-form-input" v-model="formState.templateMessage.messageData.content" :autosize="{ minRows: 9, maxRows: 60 }" class="fl1" type="textarea"/>
                                <div class="fl1 right-div">
                                    <p>请输入模板消息详细内容对应的变量，关键字个数需与添加的模板一致。可以使用如下变量：</p>
                                    <template v-if="formState.templateMessage.messageData.messageId==3">
                                        <p>{orderSn}订单编号</p>
                                        <p>{logisticsName}物流公司</p>
                                        <p>{trackingNo}物流单号</p>
                                    </template>
                                    <template v-else>
                                        <p> {orderSn}订单编号</p>
                                    </template>
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item label="是否开启" prop="isMessage">
                            <el-radio-group v-model="formState.isMessage">
                                <el-radio :value="1">是</el-radio>
                                <el-radio :value="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                    <div v-if="activeKey==='短信通知'">
                        <el-form-item label="短信模板ID" prop="templateId">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.msgData.templateId"/>
                        </el-form-item>
                        <el-form-item label="通知内容" prop="content">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.msgData.content" :autosize="{ minRows: 9, maxRows: 60 }" class="fl1" disabled type="textarea"/>
                        </el-form-item>
                        <el-form-item label="是否开启" prop="isMsg">
                            <el-radio-group v-model="formState.isMsg">
                                <el-radio :value="1">是</el-radio>
                                <el-radio :value="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                    <div v-if="activeKey==='微信模板消息'">
                        <el-form-item label="通知标题" prop="templateName">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.wechatData.templateName" disabled/>
                        </el-form-item>
                        <el-form-item label="模板ID" prop="templateId">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.wechatData.templateId" disabled />
                        </el-form-item>
                        <el-form-item label="模板" prop="content">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.wechatData.content" :autosize="{ minRows: 9, maxRows: 60 }" class="fl1" disabled type="textarea"/>
                        </el-form-item>
                        <el-form-item label="是否开启" prop="isWechat">
                            <el-radio-group v-model="formState.isWechat">
                                <el-radio :value="1">是</el-radio>
                                <el-radio :value="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                    <div v-if="activeKey==='小程序订阅消息'">
                        <el-form-item label="通知标题" prop="templateName">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.miniProgramData.templateName" disabled/>
                        </el-form-item>
                        <el-form-item label="模板ID" prop="templateId">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.miniProgramData.templateId" disabled />
                        </el-form-item>
                        <el-form-item label="模板" prop="content">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.miniProgramData.content" :autosize="{ minRows: 9, maxRows: 60 }" class="fl1" disabled type="textarea"/>
                        </el-form-item>
                        <el-form-item label="是否开启" prop="isMiniProgram">
                            <el-radio-group v-model="formState.isMiniProgram">
                                <el-radio :value="1">是</el-radio>
                                <el-radio :value="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                    <div v-if="activeKey==='APP'">
                        <el-form-item label="通知标题" prop="templateName">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.appData.templateName"/>
                        </el-form-item>
                        <el-form-item label="通知内容" prop="content">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.appData.content" :autosize="{ minRows: 9, maxRows: 60 }" class="fl1" type="textarea"/>
                        </el-form-item>
                        <el-form-item label="是否开启" prop="isApp">
                            <el-radio-group v-model="formState.isApp">
                                <el-radio :value="1">是</el-radio>
                                <el-radio :value="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                    <div v-if="activeKey==='钉钉'">
                        <el-form-item label="选择钉钉成员" prop="templateName">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.dingData.templateName"/>
                        </el-form-item>
                        <el-form-item label="通知内容" prop="content">
                            <TigInput classType="tig-form-input" v-model="formState.templateMessage.dingData.content" :autosize="{ minRows: 9, maxRows: 60 }" class="fl1" type="textarea"/>
                        </el-form-item>
                        <el-form-item label="是否开启" prop="isApp">
                            <el-radio-group v-model="formState.isDing">
                                <el-radio :value="1">是</el-radio>
                                <el-radio :value="0">否</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
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
import type {MessageTypeFormState} from '@/types/setting/messageType.d';
import {getMessageType, updateMessageType} from "@/api/setting/messageType";
import { AnyCnameRecord } from "dns";
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
const formState = ref<MessageTypeFormState>({
    templateMessage: {
        wechatData: {},
        appData: {},
        dingData: {},
        messageData: {},
        miniProgramData: {},
        msgData: {},
    }
});
const activeKey = ref<string>('站内信')
const onTabChange = (val: number) => {
    console.log(val);
}
let tabs = ref([
    {prop: 'isMessage', label: '站内信'},
    {prop: 'isMsg', label: '短信通知'},
    {prop: 'isWechat', label: '微信模板消息'},
    {prop: 'isMiniProgram', label: '小程序订阅消息'},
    // {prop: 'isApp', label: 'APP'},
    // {prop: 'isDing', label: '钉钉'},
]);
const fetchMessageType = async () => {
    try {
        const result = await getMessageType(action.value, {id: id.value});
        Object.assign(
          formState.value,
          result
        )
        for (const item of tabs.value) {
            const propValue = (formState.value as any)[item.prop];
            if (typeof propValue === "number" && propValue > -1) {
                activeKey.value = item.label;
                break;
            }
        }

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
        fetchMessageType();
    } else {
        loading.value = false;
    }
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateMessageType(operation, {id: id.value, ...formState.value});
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
.tznr {
    display: flex;
    flex-direction: row;

    width: 100%;

    .fl1 {
        flex: 1;
    }

    .right-div {
        margin-left: 20px;
        background-color: #f2f2f2;
        padding: 10px;
        border-radius: 3px;
        color: #999999;
        line-height: 2;
    }
}

</style>
