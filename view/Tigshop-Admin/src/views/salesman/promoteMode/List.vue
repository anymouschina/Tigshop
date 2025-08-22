<template>
    <div class="container">
        <div class="content_wrapper">
            <a-spin :spinning="loading">
                <RadioType
                    v-if="!loading"
                    width="250px"
                    v-model:modelValue="formState.saleType"
                    :radioList="[
                        { key: 1, title: '一级分销', desc: '分销员在客户下单后获得佣金' },
                        { key: 2, title: '二级分销', desc: '分销员在客户下单、下级卖货后可均可获得邀请奖励' }
                    ]"
                >
                </RadioType>
                <div class="tit" v-if="!loading">
                    <h2>分销员等级方案</h2>
                </div>
                <div class="promote-table">
                    <stepTable v-if="!loading" ref="stepTableRef" :distributionLevel="formState.saleType" :typeData="formState.level"> </stepTable>
                </div>
            </a-spin>
        </div>
        <div style="height: 20px"></div>
        <div class="selected-action-warp selected-warp-left" v-if="!loading" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
            <div class="selected-action">
                <el-button :loading="loading" class="form-submit-btn" size="large" type="primary" @click="handleSubmit">保 存</el-button>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import stepTable from "./src/stepTable.vue";
import RadioType from "@/components/radio/src/RadioType.vue";
import { ref, onMounted, shallowRef } from "vue";
import { message } from "ant-design-vue";
import type { SalesmanConfigFormState } from "@/types/salesman/promoteMode.d";
import { getSalesmanConfig, saveSalesmanConfig } from "@/api/salesman/promoteMode";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const loading = ref<boolean>(true);
const stepTableRef = shallowRef();
const formState = ref<SalesmanConfigFormState>({
    saleType: 1,
    level: []
});
const handleSubmit = async () => {
    await stepTableRef.value.formRef.validate();
    formState.value.level = stepTableRef.value.form.typeData;
    console.log(formState.value);
    try {
        const result = await saveSalesmanConfig({ ...formState.value });
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    }
};
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getSalesmanConfig();
        // formState.value = result;
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    loadFilter();
});
</script>
<style lang="less" scoped>
.container {
    :deep(.radio-style .triangle) {
        &::after {
            right: 3px;
            top: 19px;
            font-size: 18px;
        }
    }
    .tit {
        margin-top: 40px;
        margin-bottom: 20px;
    }
}
.footer {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    justify-content: center;
    height: 30px;
    line-height: 30px;
    background-color: #fff;
    box-shadow: 0 -2px 8px 0 rgba(200, 201, 204, 0.2);
    z-index: 10;
}
</style>
