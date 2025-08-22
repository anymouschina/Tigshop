<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form ref="formRef" :model="formState" label-width="auto" style="display: flex; gap: 12px; flex-direction: column">
                <div class="content_wrapper">
                    <div class="title flex flex-align-center mb20">
                        <div class="txt">启用协议</div>
                        <div class="switch ml10" v-if="!loading">
                            <el-switch v-model="formState.show" :active-value="1" :inactive-value="0" />
                        </div>
                    </div>
                    <div class="tips">
                        <p>
                            目前用户端会获取用户头像、昵称、手机号等个人信息，并会请求获取用户的相机、定位等系统权限，为了符合国家相关法律规定，要先获得用户同意用户协议内容和隐私政策协议内容。
                        </p>
                        <p>
                            您可以上传或编写自定义协议，设置协议并保存后，用户端会展示您新的协议内容。您再次更新协议后，需要请求用户重新确认并同意最新协议内容，为避免影响用户体验，请谨慎设置您的协议内容，请您知晓。
                        </p>
                    </div>
                </div>
                <div class="content_wrapper">
                    <el-form-item label="内容" prop="content">
                        <Editor v-if="!loading" v-model:html="formState.content"></Editor>
                    </el-form-item>
                </div>
            </el-form>
            <div style="height: 20px"></div>
            <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
                <div class="selected-action">
                    <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交 </el-button>
                </div>
            </div>
        </a-spin>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { shallowRef } from "vue";
import { AgreementConfig } from "@/types/content/agreement";
import { useThemeStore } from "@/store/theme";
import { Editor } from "@/components/editor/index";
const { themeInfo } = useThemeStore();
const formRef = shallowRef();
// 基本参数定义
const props = defineProps({
    confirmLoading: Boolean,
    loading: Boolean
});
const emit = defineEmits(["submitCallback"]);
const formState = defineModel<AgreementConfig>("formState", { default: {} });
// 表单通过验证后提交
const onSubmit = async () => {
    emit("submitCallback");
};
</script>
<style lang="less" scoped>
.tips {
    line-height: 20px;
}
</style>
