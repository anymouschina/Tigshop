<template>
    <a-spin :spinning="loading">
        <el-form ref="formRef" :model="formState" label-width="160px" >
            <div class="content">
                <div class="title">微信支付设置</div>
                <el-form-item label="是否开启" prop="useWechat">
                    <el-radio-group v-model="formState.useWechat" class="itemWidth">
                        <el-radio :value="1">开启</el-radio>
                        <el-radio :value="0">关闭</el-radio>
                    </el-radio-group>
                    <div class="extra">是否开启微信支付，如关闭则不显示微信支付选项</div>
                </el-form-item>
                <div v-show="formState.useWechat === 1">
                    <el-form-item label="微信商户类型" prop="wechatMchidType">
                        <el-radio-group v-model="formState.wechatMchidType" class="itemWidth">
                            <el-radio :value="1">普通商户模式</el-radio>
                            <el-radio :value="2">服务商模式</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="微信商户号" prop="wechatPayMchid">
                        <TigInput classType="tig-form-input" v-model="formState.wechatPayMchid" />
                    </el-form-item>
                    <el-form-item label="微信子商户号" prop="wechatPaySubMchid" v-if="formState.wechatMchidType === 2">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.wechatPaySubMchid" />
                            <div class="extra">请填写由服务商提供的子商户号</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="商户API密钥" prop="wechatPayKey">
                        <div>
                            <div class="flex flex-align-center" style="gap: 10px">
                                <div class="secret-txt line1" style="max-width: 380px">
                                    {{ formState.wechatPayKey }}
                                </div>
                                <DialogForm
                                    :maskClose="false"
                                    :isDrawer="false"
                                    :params="{ title: '商户API密钥', content: formState.wechatPayKey }"
                                    path="setting/config/src/EditSecret"
                                    title="商户API密钥"
                                    width="600px"
                                    @okCallback="formState.wechatPayKey = $event"
                                >
                                    <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                                </DialogForm>
                            </div>
                            <div class="extra">请使用APIv3密钥，编辑完成后，点击下方提交按钮确认修改，请确保填写正确的商户API密钥</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="商户证书序列号" prop="wechatPaySerialNo" v-if="formState.wechatPayCheckType === 1">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.wechatPaySerialNo" />
                            <div class="extra">请使用API证书序列号</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="商户API证书" prop="wechatPayCertificate">
                        <div style="width: 100%">
                            <Upload
                                name="file"
                                :action="requestUrl.prefix + '/setting/config/uploadFile?type=1'"
                                :headers="requestUrl.headers() as any"
                                @change="handleChange"
                                :showUploadList="false"
                                :multiple="false"
                            >
                                <el-button>{{ formState.wechatPayCertificate ? "重新上传" : "点击上传" }}</el-button>
                                <span class="ml10">apiclient_cert.pem</span>
                            </Upload>
                        </div>
                        <div class="extra">调用微信商户接口时需要用到的API证书，文件名称一般为apiclient_cert.pem，具体操作请参考教程</div>
                    </el-form-item>
                    <el-form-item label="商户API证书密钥" prop="wechatPayPrivateKey">
                        <div style="width: 100%">
                            <Upload
                                name="file"
                                :action="requestUrl.prefix + '/setting/config/uploadFile?type=2'"
                                :headers="requestUrl.headers() as any"
                                @change="handleChange"
                                :showUploadList="false"
                                :multiple="false"
                            >
                                <el-button>{{ formState.wechatPayPrivateKey ? "重新上传" : "点击上传" }}</el-button>
                                <span class="ml10">apiclient_key.pem</span>
                            </Upload>
                        </div>
                        <div class="extra">调用微信商户接口时需要用到的API证书密钥，文件名称一般为apiclient_key.pem，具体操作请参考教程</div>
                    </el-form-item>
                    <el-form-item label="验证微信支付方式" prop="wechatMchidType">
                        <el-radio-group v-model="formState.wechatPayCheckType" class="itemWidth">
                            <el-radio :value="1">平台证书</el-radio>
                            <el-radio :value="2">微信支付公钥</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="平台证书" prop="" v-if="formState.wechatPayCheckType === 1">
                        <div style="width: 100%">
                            <el-button :loading="confirmLoading" class="form-submit-btn" type="success" @click="getPlatformCertificate">
                                {{ formState.wechatPayPlatformCertificate ? "更新证书" : "生成证书" }}
                            </el-button>
                        </div>
                        <div class="extra">调用微信商户接口时需要用到的平台证书,上传API证书后需要更新平台证书，具体操作请参考教程</div>
                    </el-form-item>
                    <el-form-item label="微信支付公钥ID" prop="wechatPayPublicKeyId" v-if="formState.wechatPayCheckType === 2">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.wechatPayPublicKeyId" />
                            <div class="extra">请使用微信支付公钥ID</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="微信支付公钥文件" prop="wechatPayPublicKey" v-if="formState.wechatPayCheckType === 2">
                        <div style="width: 100%">
                            <Upload
                                name="file"
                                :action="requestUrl.prefix + '/setting/config/uploadFile?type=3'"
                                :headers="requestUrl.headers() as any"
                                @change="handleChange"
                                :showUploadList="false"
                                :multiple="false"
                            >
                                <el-button>{{ formState.wechatPayPublicKey ? "重新上传" : "点击上传" }}</el-button>
                                <span class="ml10">微信支付公钥文件（如：pub_key.pem）</span>
                            </Upload>
                        </div>
                        <div class="extra">调用微信商户接口时需要用到的公钥证书，文件名称一般为public.pem，具体操作请参考教程</div>
                    </el-form-item>
                    <div class="title">微信小程序支付</div>
                    <el-form-item label="微信小程序AppID" prop="wechatMiniProgramAppId">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.wechatMiniProgramAppId" />
                            <div class="extra">微信小程序公众平台->设置->开发设置中获取，开通小程序必填</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="微信小程序AppSecret" prop="wechatMiniProgramSecret">
                        <div>
                            <div class="flex flex-align-center" style="gap: 10px">
                                <div class="secret-txt line1" style="max-width: 380px">
                                    {{ formState.wechatMiniProgramSecret }}
                                </div>
                                <DialogForm
                                    :maskClose="false"
                                    :isDrawer="false"
                                    :params="{ title: '微信小程序AppSecret', content: formState.wechatMiniProgramSecret }"
                                    path="setting/config/src/EditSecret"
                                    title="微信小程序AppSecret"
                                    width="600px"
                                    @okCallback="formState.wechatMiniProgramSecret = $event"
                                >
                                    <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                                </DialogForm>
                            </div>
                            <div class="extra">微信小程序公众平台->设置->开发设置中获取，开通小程序必填</div>
                            <div class="extra">编辑完成后，点击下方提交按钮确认修改，请确保填写正确的微信小程序AppSecret</div>
                        </div>
                    </el-form-item>
                    <div class="title">微信APP支付</div>
                    <el-form-item label="应用APP ID" prop="wechatPayAppId">
                        <div>
                            <TigInput classType="tig-form-input" v-model="formState.wechatPayAppId" />
                            <div class="extra">需开通微信开发者平台，创建APP应用（未开通Tigshop APP商城可忽略）</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="应用APP SECRET" prop="wechatPayAppSecret">
                        <div>
                            <div class="flex flex-align-center" style="gap: 10px">
                                <div class="secret-txt line1" style="max-width: 380px">
                                    {{ formState.wechatPayAppSecret }}
                                </div>
                                <DialogForm
                                    :maskClose="false"
                                    :isDrawer="false"
                                    :params="{ title: '应用APP SECRET', content: formState.wechatPayAppSecret }"
                                    path="setting/config/src/EditSecret"
                                    title="应用APP SECRET"
                                    width="600px"
                                    @okCallback="formState.wechatPayAppSecret = $event"
                                >
                                    <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                                </DialogForm>
                            </div>
                            <div class="extra">需通微信开发者平台获取（未开通Tigshop APP商城可忽略）</div>
                            <div class="extra">编辑完成后，点击下方提交按钮确认修改，请确保填写正确的应用APP SECRET</div>
                        </div>
                    </el-form-item>
                </div>
            </div>
        </el-form>
        <div style="height: 20px"></div>
        <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
            <div class="selected-action">
                <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
            </div>
        </div>
    </a-spin>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, ref, shallowRef } from "vue";
import { message, Upload } from "ant-design-vue";
import type { WechatPaySettingsForm } from "@/types/setting/payment";
import request, { requestUrl } from "@/utils/request";
import { getWechatSettings, updateWechatSettings, createPlatformCertificate } from "@/api/setting/payment";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<WechatPaySettingsForm>>({
    useWechat: undefined,
    wechatMchidType: undefined,
    wechatPayMchid: "wechatPayMchid_46f1aec6bf75",
    wechatPaySubMchid: 0,
    wechatPayKey: "wechatPayKey_de5a4632fe4a",
    wechatPaySerialNo: "wechatPaySerialNo_4a29ab342bc1",
    wechatPayCertificate: 0,
    wechatPayPrivateKey: 0,
    wechatPayCheckType: undefined,
    wechatPayPlatformCertificate: 0,
    wechatPayPublicKeyId: 0,
    wechatPayPublicKey: 0,
    wechatMiniProgramAppId: "",
    wechatMiniProgramSecret: "",
    wechatPayAppId: "",
    wechatPayAppSecret: ""
});
// 加载列表
onMounted(async () => {
    loadFilter();
});
const loading = ref<boolean>(true);
const getPlatformCertificate = async () => {
    try {
        const result = await createPlatformCertificate();
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const loadFilter = async () => {
    try {
        const result = await getWechatSettings();
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
        const result = await updateWechatSettings({
            ...formState.value
        });
        message.success("修改成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
const handleChange = (info: any) => {
    if (info.file.status == "uploading") {
    }
    if (info.file.status !== "uploading") {
    }
    if (info.file.status === "done") {
        // 上传完成
        if (info.file.response.code !== 0) {
            info.file.status = "error";
            message.error(info.file.response.data.message);
        } else {
            for (let index in info.fileList) {
                if (info.file.uid == info.fileList[index].uid) {
                    info.fileList[index] = Object.assign(info.fileList[index], info.fileList[index].response.data);
                }
            }
            message.success("文件上传成功！");
            // loadFilter();
        }
    } else if (info.file.status === "error") {
        message.error(`${info.file.name} 文件上传失败！`);
    }
};
</script>
<style lang="less" scoped>
.content {
    padding: 10px;

    .title {
        font-weight: bold;
        padding-bottom: 20px;
        font-size: 14px;
    }

    .subtitle {
        color: #999;
        font-weight: normal;
        font-size: 12px;
    }
    :deep(.el-tabs--border-card > .el-tabs__content) {
        padding: 0;
    }
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
</style>
<style>
.itemWidth {
    width: 100%;
}
</style>
