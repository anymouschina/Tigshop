<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form ref="formRef" :model="formState" label-width="auto" style="display: flex; gap: 12px; flex-direction: column">
                <div class="content_wrapper">
                    <div class="title">快递发货设置</div>
                    <el-form-item label="自定义名称" prop="defaultLogisticsName" :rules="[{ required: true, message: '自定义名称不能为空' }]">
                        <div>
                            <TigInput width="260px" v-model="formState.defaultLogisticsName" :maxlength="10" showWordLimit />
                            <div class="extra">该名称会显示在买家可选择的配送方式中，默认名称“商家配送”</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">快递接口设置</div>
                    <el-form-item label="快递鸟API Key" prop="kdniaoApiKey">
                        <div>
                            <div class="flex flex-align-center" style="gap: 10px">
                                <div class="secret-txt line1" style="max-width: 380px;">
                                    {{ formState.kdniaoApiKey }}
                                </div>
                                <DialogForm
                                    :maskClose="false"
                                    :isDrawer="false"
                                    :params="{ title: '快递鸟API Key', content: formState.kdniaoApiKey }"
                                    path="setting/config/src/EditSecret"
                                    title="快递鸟API Key"
                                    width="600px"
                                    @okCallback="formState.kdniaoApiKey=$event"
                                >
                                    <el-button style="margin-top: 3px" link type="primary"> 编辑 </el-button>
                                </DialogForm>
                            </div>
                            <div class="extra">编辑完成后，点击下方提交按钮确认修改，请确保填写正确的API Key</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="快递鸟服务ID" prop="kdniaoBusinessId">
                        <TigInput classType="tig-form-input" v-model="formState.kdniaoBusinessId" type="text" />
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">发货信息设置</div>
                    <el-form-item label="发货人" prop="sender">
                        <TigInput classType="tig-form-input" v-model="formState.sender" type="text" />
                    </el-form-item>
                    <el-form-item label="发货人联系方式" prop="mobile">
                        <TigInput classType="tig-form-input" v-model="formState.mobile" type="text" />
                    </el-form-item>
                    <el-form-item label="发货地省份" prop="provinceName">
                        <TigInput classType="tig-form-input" v-model="formState.provinceName" type="text" />
                    </el-form-item>
                    <el-form-item label="发货城市" prop="cityName">
                        <TigInput classType="tig-form-input" v-model="formState.cityName" type="text" />
                    </el-form-item>
                    <el-form-item label="发货地区" prop="areaName">
                        <TigInput classType="tig-form-input" v-model="formState.areaName" type="text" />
                    </el-form-item>
                    <el-form-item label="发货详细地址" prop="address">
                        <TigInput classType="tig-form-input" v-model="formState.address" type="text" />
                    </el-form-item>
                </div>
            </el-form>
            <div style="height: 20px"></div>
            <div v-if="!loading" class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
                <div class="selected-action">
                    <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
                </div>
            </div>
        </a-spin>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import type { BaseLogistics } from "@/types/setting/baseLogistics.d";
import { getShippingSettings, updateShippingSettings } from "@/api/setting/baseLogistics";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const confirmLoading = ref(false);

const loading = ref<boolean>(true);
const formRef = shallowRef();
const formState = ref<BaseLogistics>({
    defaultLogisticsName: "",
    kdniaoApiKey: "",
    kdniaoBusinessId: "",
    mobile: "",
    provinceName: "",
    cityName: "",
    areaName: "",
    address: "",
    sender: ""
});
const loadFilter = async () => {
    try {
        const result = await getShippingSettings();
        Object.assign(formState.value, convertNullsToEmptyStrings(result));
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // 获取详情数据
    loadFilter();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateShippingSettings(formState.value);
        emit("submitCallback", result);
        message.success("保存成功");
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
.title {
    font-weight: bold;
    padding-bottom: 30px;
    font-size: 16px;
    line-height: 24px;
}
.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}
</style>
