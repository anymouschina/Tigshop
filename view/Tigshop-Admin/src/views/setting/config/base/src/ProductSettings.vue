<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form ref="formRef" :model="formState" label-width="140px" style="display: flex;gap:12px;flex-direction: column">
                <div class="content_wrapper">
                    <div class="title">商品货币设置</div>
                    <el-form-item label="商品货币符" prop="dollarSign">
                        <div>
                            <TigInput v-model="formState.dollarSign" width="200px" />
                            <div class="extra">货币符号 ，如：¥、€、$</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="商品货币中文" prop="dollarSignCn">
                        <div>
                            <TigInput v-model="formState.dollarSignCn" width="200px" />
                            <div class="extra">货币符号中文，如：元、美元、欧元等</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">商品录入设置</div>
                    <el-form-item label="商品货号前缀" prop="snPrefix">
                        <TigInput v-model="formState.snPrefix" width="200px" />
                    </el-form-item>
                    <el-form-item label="市场价换算" prop="marketPriceRate">
                        <div>
                            <TigInput v-model="formState.marketPriceRate" :decimalPlaces="1" width="200px" type="decimal" />
                            <div class="extra">输入商品价格时将自动根据该比例计算市场价格，推荐：1.2</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">商品信息显示设置</div>
                    <el-form-item label="显示销量" prop="showSelledCount">
                        <el-radio-group v-model="formState.showSelledCount" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">是否在商品详情页显示商品销量</div>
                    </el-form-item>
                    <el-form-item label="显示市场价" prop="showMarketprice">
                        <el-radio-group v-model="formState.showMarketprice" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">是否在商品详情页价格栏目中显示市场价</div>
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
import { onMounted, ref, shallowRef, nextTick, watch } from "vue";
import { message } from "ant-design-vue";
import { BasicProductConfig } from "@/types/setting/config";
import { getConfigProduct, saveConfigProduct } from "@/api/setting/config";
import { useConfigStore } from "@/store/config";
import { useRoute } from "vue-router";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const route = useRoute();
const configStore = useConfigStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<BasicProductConfig>>({
    dollarSign: "",
    dollarSignCn: "",
    snPrefix: "",
    showSelledCount: undefined,
    showMarketprice: undefined,
    marketPriceRate: 0
});
// 加载列表
onMounted(async () => {
    await loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getConfigProduct();
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
        const result = await saveConfigProduct(formState.value);
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
