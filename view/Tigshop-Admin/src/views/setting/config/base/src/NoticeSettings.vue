<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form ref="formRef" :model="formState" label-width="140px">
                <div class="content_wrapper">
                    <div class="title">短信设置</div>
                    <el-form-item label="服务商" required>
                        <div>
                            <el-radio-group v-model="value" class="itemWidth">
                            <el-radio :value="1">阿里云</el-radio>
                        </el-radio-group>
                        </div>
                    </el-form-item>
                    <el-form-item label="短信帐户用户名" prop="smsKeyId">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.smsKeyId" />
                            <div class="extra">您所申请的短信服务用户名，不填则表示不开通</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="短信帐户密码" prop="smsKeySecret">
                        <div>
                            <div class="flex flex-align-center" style="gap: 10px">
                                <div class="secret-txt line1" style="max-width: 380px">
                                    {{ formState.smsKeySecret }}
                                </div>
                                <DialogForm
                                    :maskClose="false"
                                    :isDrawer="false"
                                    :params="{ title: '短信帐户密码', content: formState.smsKeySecret }"
                                    path="setting/config/src/EditSecret"
                                    title="短信帐户密码"
                                    width="600px"
                                    @okCallback="formState.smsKeySecret = $event"
                                >
                                    <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                                </DialogForm>
                            </div>
                            <div class="extra">您所申请的短信服务密码，编辑完成后，点击下方提交按钮确认修改，请确保填写正确的短信帐户密码</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="短信签名" prop="smsSignName">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.smsSignName" />
                            <div class="extra">阿里短信这里填短信签名，其它的根据具体短信接口填写</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="商家短信号码" prop="smsShopMobile">
                        <div>
                            <TigInput classType="tig-form-input" type="integer" v-model="formState.smsShopMobile" />
                            <div class="extra">用于接收会员订单等信息</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">邮箱通知</div>
                    <el-form-item label="客服收件地址" prop="serviceEmail">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.serviceEmail" />
                            <div class="extra">该客服邮件地址可用于接收下面所设置的通知</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="提交订单发送邮件" prop="sendConfirmEmail">
                        <el-radio-group v-model="formState.sendConfirmEmail" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">订单提交后发送（未支付），建议选“否”</div>
                    </el-form-item>
                    <el-form-item label="订单支付发送邮件" prop="orderPayEmail">
                        <el-radio-group v-model="formState.orderPayEmail" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">会员支付订单成功时，是否给会员发送邮件</div>
                    </el-form-item>
                    <el-form-item label="下单给客服发邮件" prop="sendServiceEmail">
                        <el-radio-group v-model="formState.sendServiceEmail" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">提示：此处为发送给客服，商城信息中的客服邮件地址不为空时，该选项有效</div>
                    </el-form-item>
                    <el-form-item label="发货时发送邮件" prop="sendShipEmail">
                        <el-radio-group v-model="formState.sendShipEmail" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">提示：该邮件是发给客户</div>
                    </el-form-item>
                </div>
            </el-form>
            <div style="height: 20px"></div>
        </a-spin>
    </div>
    <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
        <div class="selected-action">
            <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, ref, shallowRef, nextTick, watch } from "vue";
import { message } from "ant-design-vue";
import { BaseNotice } from "@/types/setting/config";
import { getConfigNotify, saveConfigNotify } from "@/api/setting/config";
import { useRoute } from "vue-router";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const route = useRoute();
const value = 1;
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<BaseNotice>>({
    smsKeyId: "",
    smsKeySecret: "",
    smsSignName: "",
    smsShopMobile: "",
    serviceEmail: "",
    sendConfirmEmail: undefined,
    orderPayEmail: undefined,
    sendServiceEmail: undefined,
    sendShipEmail: undefined
});

// 加载列表
onMounted(async () => {
    await loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getConfigNotify();
        Object.assign(formState.value, convertNullsToEmptyStrings(result));
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
// 表单通过验证后提交
const onSubmit = async () => {
    confirmLoading.value = true;
    try {
        const result = await saveConfigNotify(formState.value);
        message.success("修改成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
</script>
<style lang="less" scoped>
.title {
    font-weight: bold;
    padding-bottom: 30px;
    font-size: 16px;
    line-height: 24px;
}
.subtitle {
    color: #999;
    font-weight: normal;
    font-size: 12px;
}

.mr8 {
    margin-right: 8px;
}

.width60 {
    width: 60px;
}

.ml8 {
    margin-left: 8px;
}

.itemWidth {
    width: 100%;
}
.error {
    color: red;
}
</style>
