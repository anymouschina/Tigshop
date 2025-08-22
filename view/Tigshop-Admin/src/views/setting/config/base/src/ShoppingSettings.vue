<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form ref="formRef" :model="formState" label-width="170px" style="display: flex; gap: 12px; flex-direction: column">
                <div class="content_wrapper">
                    <div class="title">购物全局设置</div>
                    <el-form-item label="运费模板地区设置机制" prop="childAreaNeedRegion">
                        <el-radio-group v-model="formState.childAreaNeedRegion" class="itemWidth">
                            <el-radio :value="1">仅设置的地区可配送</el-radio>
                            <el-radio :value="0">未设置的地区皆可配送(使用默认运费设置)</el-radio>
                        </el-radio-group>
                        <div>
                            <div class="extra">
                                运费模板一旦增加指定地区运费，如果该设置为“仅设置的地区可配送”，将不再默认全国都可配送，而是只能配送到增加的地区（如果收货地址不在设置范围，该配送类型不可用）；
                            </div>
                            <div class="extra">
                                如果设置为“未设置的地区使用默认运费设置”，收货地址如果是设置的地区范围内，则按该地区的运费计费，如果不在这范围内，则按默认计费（相当于不会存在不能配送的区域）；
                            </div>
                            <div class="extra">
                                如何选择？如果所有商品可全国配送，就选“未设置的地区使用默认运费设置”，如果有的商品只配送给部分区域，则选前者，该设置会对全站商品生效，慎重设置！
                            </div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">积分设置</div>
                    <el-form-item label="积分自定义名称" prop="integralName">
                        <div class="flex flex-align-center" style="gap: 5px">
                            将积分名称自定义为
                            <TigInput width="120px" v-model="formState.integralName" :maxlength="5" showWordLimit />
                        </div>
                    </el-form-item>
                    <el-form-item label="积分换算比例" prop="integralScale">
                        <div class="flex flex-align-center" style="gap: 5px">
                            每 100 积分，可抵扣
                            <TigInput type="decimal" width="90px" :decimalPlaces="1" v-model="formState.integralScale"> </TigInput>
                            {{ config.amountUnit }}现金
                        </div>
                    </el-form-item>
                    <el-form-item label="下单送积分" prop="orderSendPoint">
                        <div class="flex flex-align-center" style="gap: 5px">
                            每消费 1 {{ config.amountUnit }}，可获得
                            <TigInput width="90px" type="integer" v-model="formState.orderSendPoint" />
                            积分
                        </div>
                    </el-form-item>
                    <el-form-item label="积分支付比例" prop="integralPercent">
                        <div class="flex flex-align-center" style="gap: 5px">
                            每 100 {{ config.amountUnit }}商品，最多可使用
                            <TigInput width="90px" type="decimal" :decimalPlaces="1" v-model="formState.integralPercent" />
                            积分
                        </div>
                    </el-form-item>
                    <el-form-item label="评论商品赠送积分" prop="commentSendPoint">
                        <div class="flex flex-align-center" style="gap: 5px">
                            每次有效评论，赠送
                            <TigInput width="90px" type="integer" v-model="formState.commentSendPoint" />
                            积分
                        </div>
                    </el-form-item>
                    <el-form-item label="晒单赠送积分" prop="showSendPoint">
                        <div class="flex flex-align-center" style="gap: 5px">
                            每次有效晒单，赠送
                            <TigInput width="90px" type="integer" v-model="formState.showSendPoint" />
                            积分
                        </div>
                    </el-form-item>
                    <el-form-item label="签到赠送积分" prop="useQiandaoPoint">
                        <el-radio-group v-model="formState.useQiandaoPoint" class="itemWidth">
                            <el-radio :value="1">开启</el-radio>
                            <el-radio :value="0">关闭</el-radio>
                        </el-radio-group>
                        <div class="extra">
                            开启后，用户可通过签到获取积分。
                            <el-popover :width="275" placement="right" trigger="click">
                                <template #reference>
                                    <a>查看示例</a>
                                </template>
                                <template #default>
                                    <img src="@/style/images/useQiandaoPoint.png" style="width: 250px" />
                                </template>
                            </el-popover>
                        </div>
                    </el-form-item>
                </div>

                <div class="content_wrapper">
                    <div class="title">发票设置</div>
                    <el-form-item label="是否能开发票" prop="canInvoice">
                        <el-radio-group v-model="formState.canInvoice" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">如果为否，订单结算时将不显示发票</div>
                    </el-form-item>
                    <el-form-item label="是否支持增值税专用发票" prop="invoiceAdded">
                        <el-radio-group v-model="formState.invoiceAdded" class="itemWidth">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                        <div class="extra">开启增值税专用发票会同步开启发票资质提交和审核，关闭则只显示“普通发票”</div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">退换货设置</div>
                    <el-form-item label="回寄联系人设置" prop="returnConsignee">
                        <TigInput classType="tig-form-input" v-model="formState.returnConsignee" />
                    </el-form-item>
                    <el-form-item label="回寄电话设置" prop="returnMobile">
                        <TigInput classType="tig-form-input" v-model="formState.returnMobile" />
                    </el-form-item>
                    <el-form-item label="回寄地址设置" prop="returnAddress">
                        <TigInput classType="tig-form-input" v-model="formState.returnAddress" />
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
import { onMounted, ref, shallowRef, nextTick, watch } from "vue";
import { message } from "ant-design-vue";
import { BaseShoppingConfig, Regions } from "@/types/setting/config";
import { getConfigShopping, saveConfigShopping } from "@/api/setting/config";
import { useRoute } from "vue-router";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useConfigStore } from "@/store/config";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
const config = useConfigStore().config;
const route = useRoute();
const configStore = useConfigStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<BaseShoppingConfig>>({
    childAreaNeedRegion: undefined,
    integralName: "",
    integralScale: "",
    orderSendPoint: "",
    integralPercent: "",
    commentSendPoint: "",
    showSendPoint: "",
    useQiandaoPoint: undefined,
    canInvoice: undefined,
    invoiceAdded: undefined,
    returnConsignee: "",
    returnMobile: "",
    returnAddress: ""
});
// 加载列表
onMounted(async () => {
    await loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getConfigShopping();
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
        const result = await saveConfigShopping(formState.value);
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
