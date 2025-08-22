<template>
    <div class="container">
        <div class="content_wrapper">
            <a-spin :spinning="loading">
                <el-form ref="formRef" :model="formState" label-width="auto" style="display: flex; gap: 12px; flex-direction: column">
                    <div class="content_wrapper">
                        <el-form-item label="客服选择" prop="status">
                            <el-radio-group v-model="formState.status" class="itemWidth">
                                <el-radio-button :value="1">正常</el-radio-button>
                                <el-radio-button :value="2">暂停供应</el-radio-button>
                            </el-radio-group>
                            <div class="extra">设置暂停供应后，供应商所有商品将变为断供状态，所有商家上架的商品将会自动下架，请谨慎操作</div>
                        </el-form-item>
                        <el-form-item label="客服电话" prop="kefuPhone">
                            <TigInput classType="tig-form-input" v-model="formState.kefuPhone"></TigInput>
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
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { onMounted, ref, shallowRef } from "vue";
import { message } from "ant-design-vue";
import { VendorConfig } from "@/types/vendor/setting";
import { vendorSetting, saveVendorSetting } from "@/api/vendor/setting";
import { useConfigStore } from "@/store/config";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useRoute } from "vue-router";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const route = useRoute();
const configStore = useConfigStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<VendorConfig>>({
    status: undefined,
    kefuPhone: "",
});
// 加载列表
onMounted(async () => {
    await loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await vendorSetting();
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
        const result = await saveVendorSetting(formState.value);
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
.content {
    padding: 0 20px;
}

.content_wrapper {
    min-height: calc(100vh - 260px);
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
