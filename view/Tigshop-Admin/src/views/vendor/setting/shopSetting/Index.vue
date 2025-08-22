<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form ref="formRef" :model="formState" label-width="140px" style="display: flex; gap: 12px; flex-direction: column">
                <div class="content_wrapper">
                    <div class="title">价格设置</div>
                    <el-form-item label="供应商设价方式" prop="vendorSetPriceType">
                        <div>
                            <div>
                                <el-radio-group v-model="formState.vendorSetPriceType" class="itemWidth">
                                    <el-radio :value="1">按比例</el-radio>
                                    <el-radio :value="2">按固定数值加价</el-radio>
                                    <el-radio :value="3">默认售价</el-radio>
                                </el-radio-group>

                                <TigInput
                                    v-if="formState.vendorSetPriceType === 1"
                                    class="mt10"
                                    type="decimal"
                                    width="110px"
                                    v-model="formState.vendorSetPriceAutoValue"
                                >
                                    <template #append> % </template>
                                </TigInput>
                                <TigInput
                                    v-if="formState.vendorSetPriceType === 2"
                                    class="mt10"
                                    type="decimal"
                                    width="110px"
                                    v-model="formState.vendorSetPriceAutoValue"
                                >
                                    <template #append>
                                        {{ config.dollarSign }}
                                    </template>
                                </TigInput>
                            </div>
                            <div class="extra" v-if="formState.vendorSetPriceType === 1">选择按比例价，供应商商品将会自动按照加价比例设置销售价，系统会自动计算您设置比例后售卖的最终价格，若您设置的最终价格大于供应商限制的价格，系统会自动取供应商设置的最高比例进行售卖。</div>
                            <div class="extra" v-if="formState.vendorSetPriceType === 2">选择按固定数值加价，供应商商品在导入时计算出供货价+您设定的价格。</div>
                            <div class="extra" v-if="formState.vendorSetPriceType === 3">默认售价，供应商商品在导入时默认填入供应商设置的最大售卖价格。</div>
                        </div>
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
import { onMounted, ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import { BaseAdminVendorConfig } from "@/types/vendor/setting";
import { vendorShopSettings, saveShopVendor } from "@/api/vendor/setting";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useRoute } from "vue-router";
import { useThemeStore } from "@/store/theme";
import { useConfigStore } from "@/store/config";
const config = useConfigStore().config;
const { themeInfo } = useThemeStore();
const route = useRoute();
const configStore = useConfigStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<BaseAdminVendorConfig>>({
    vendorSetPriceType: 1,
    vendorSetPriceAutoValue: ""
});
// 加载列表
onMounted(async () => {
    await loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await vendorShopSettings();
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
        const result = await saveShopVendor(formState.value);
        message.success("修改成功");
        configStore.updateConfig();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
</script>
<style lang="less" scoped>
.content_wrapper {
    min-height: calc(100vh - 260px);
}

.content {
    padding: 0 20px;
}

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
