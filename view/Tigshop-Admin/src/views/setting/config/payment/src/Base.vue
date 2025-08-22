<template>
    <a-spin :spinning="loading">
        <el-form ref="formRef" :model="formState" label-width="160px">
            <div class="content">
                <div class="title">基础支付设置</div>
                <el-form-item label="余额支付" prop="useSurplus">
                    <el-radio-group v-model="formState.useSurplus" class="itemWidth">
                        <el-radio :value="1">支持</el-radio>
                        <el-radio :value="0">不支持</el-radio>
                    </el-radio-group>
                    <div class="extra">订单结算页面是否支持余额支付功能，不支持则不显示</div>
                </el-form-item>
                <el-form-item label="积分抵扣" prop="usePoints">
                    <el-radio-group v-model="formState.usePoints" class="itemWidth">
                        <el-radio :value="1">支持</el-radio>
                        <el-radio :value="0">不支持</el-radio>
                    </el-radio-group>
                    <div class="extra">订单结算页面是否支持积分抵扣功能，不支持则不显示</div>
                </el-form-item>
                <el-form-item label="优惠券" prop="useCoupon">
                    <el-radio-group v-model="formState.useCoupon" class="itemWidth">
                        <el-radio :value="1">支持</el-radio>
                        <el-radio :value="0">不支持</el-radio>
                    </el-radio-group>
                    <div class="extra">订单结算页面是否支持优惠券功能，不支持则不显示</div>
                </el-form-item>
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
import { onMounted, ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import type { BasicPaySettingsForm } from "@/types/setting/payment";
import { getBasicSettings, updateBasicSettings } from "@/api/setting/payment";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<BasicPaySettingsForm>>({
    useSurplus: undefined,
    usePoints: undefined,
    useCoupon: undefined
});

// 加载列表
onMounted(async () => {
    loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getBasicSettings();
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
        const result = await updateBasicSettings(formState.value);
        message.success("修改成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
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
}
</style>
