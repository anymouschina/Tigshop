<template>
    <div class="container">
        <a-spin :spinning="loading">
            <el-form
                ref="formRef"
                :model="formState"
                label-width="150px"
                style="display: flex; gap: 12px; flex-direction: column"
                require-asterisk-position="right"
            >
                <div class="content_wrapper">
                    <div class="title">分账基础设置</div>
                    <el-form-item prop="billingNode" :rules="[{ required: true, message: '请选择出账节点' }]">
                        <template #label>
                            <el-tooltip class="box-item" effect="light" placement="right" show-after="300">
                                <template #content>
                                    <div style="width: 300px; padding: 5px 10px">订单支付成功或售后单退款完成，分账方能查看可获得的分账金额</div>
                                </template>
                                <div class="flex flex-align-center">
                                    <div>出账节点</div>
                                    <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                </div>
                            </el-tooltip>
                        </template>
                        <div>
                            <el-radio-group v-model="formState.billingNode" class="itemWidth" :disabled="true">
                                <el-radio :value="1">下单成功/售后申请</el-radio>
                                <!-- <el-radio :value="2">售后申请</el-radio> -->
                            </el-radio-group>
                        </div>
                    </el-form-item>
                    <el-form-item prop="collectionNode" :rules="[{ required: true, message: '请选择入账节点' }]">
                        <template #label>
                            <el-tooltip class="box-item" effect="light" placement="right" show-after="300">
                                <template #content>
                                    <div style="width: 100px; padding: 5px 10px">分账方获得金额的节点</div>
                                </template>
                                <div class="flex flex-align-center">
                                    <div>入账节点</div>
                                    <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                </div>
                            </el-tooltip>
                        </template>
                        <div>
                            <el-radio-group v-model="formState.collectionNode" class="itemWidth" :disabled="true">
                                <el-radio :value="1">订单完成/确认收货</el-radio>
                                <!-- <el-radio :value="2">确认收货</el-radio> -->
                            </el-radio-group>
                        </div>
                    </el-form-item>
                    <el-form-item prop="collectionTimeSetting" :rules="[{ required: true, validator: validateCollectionTimeSetting }]">
                        <template #label>
                            <el-tooltip class="box-item" effect="light" placement="right" show-after="300">
                                <template #content>
                                    <div style="width: 300px; padding: 5px 10px">
                                        入账时间满足，对应分账账单 触发入账结算
                                        入账节点是订单完成（确认收货），入账时间设置10天，则代表结算时间是订单完成10天后结算
                                    </div>
                                </template>
                                <div class="flex flex-align-center">
                                    <div>入账时间</div>
                                    <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                </div>
                            </el-tooltip>
                        </template>
                        <div>
                            <TigInput type="integer" v-model="formState.collectionTimeSetting" width="120px" :min="0" :max="15">
                                <template #append>天</template>
                            </TigInput>
                            <div class="extra">限制 0-15 天，默认0天</div>
                        </div>
                    </el-form-item>
                    <el-form-item prop="collectionMethod" :rules="[{ required: true }]">
                        <template #label>
                            <el-tooltip class="box-item" effect="light" placement="right" show-after="300">
                                <template #content>
                                    <div style="width: 150px; padding: 5px 10px">入账时间设置周期结束，资金会自动入账结算</div>
                                </template>
                                <div class="flex flex-align-center">
                                    <div>入账方式</div>
                                    <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                </div>
                            </el-tooltip>
                        </template>
                        <div>
                            <div v-if="formState.collectionNode === 1">自动入账</div>
                        </div>
                    </el-form-item>
                    <el-form-item prop="collectionAccountType" :rules="[{ required: true }]">
                        <template #label>
                            <el-tooltip class="box-item" effect="light" placement="right" show-after="300">
                                <template #content>
                                    <div style="width: 150px; padding: 5px 10px">资金会通过店铺/门店/供应商账户余额结算</div>
                                </template>
                                <div class="flex flex-align-center">
                                    <div>入账账户类型</div>
                                    <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                </div>
                            </el-tooltip>
                        </template>
                        <div>
                            <div v-if="formState.collectionAccountType === 1">余额</div>
                        </div>
                    </el-form-item>
                    <el-form-item prop="splitPaymentMethod" :rules="[{ required: true }]">
                        <template #label>
                            <el-tooltip class="box-item" effect="light" placement="right" show-after="300">
                                <template #content>
                                    <div style="width: 150px; padding: 5px 10px">商家通过对账单线下对账结算</div>
                                </template>
                                <div class="flex flex-align-center">
                                    <div>分账方式</div>
                                    <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                </div>
                            </el-tooltip>
                        </template>
                        <div>
                            <div v-if="formState.splitPaymentMethod === 1">线下分账</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper">
                    <div class="title">店铺分账设置</div>
                    <el-form-item label="通用平台服务费率" prop="storeGeneralServiceFeeRate" :rules="[{ required: true, validator: validateGeneralSetting }]">
                        <div>
                            <TigInput type="integer" v-model="formState.storeGeneralServiceFeeRate" width="150px" :min="0" :max="100">
                                <template #append>%</template>
                            </TigInput>
                            <div class="extra">店铺订单资金入账时，平台将抽取的服务费，单个店铺也可在店铺管理栏目中独立设置（独立会设置覆盖通用费率）</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="店铺提现手续费率" prop="storeWithdrawalFeeRate" :rules="[{ required: true, validator: validateGeneralSetting }]">
                        <div>
                            <TigInput type="integer" v-model="formState.storeWithdrawalFeeRate" width="150px" :min="0" :max="100">
                                <template #append>%</template>
                            </TigInput>
                            <div class="extra">店铺提现时，平台将抽取的提现手续费</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper" v-if="false">
                    <div class="title">门店分账设置</div>
                    <el-form-item label="通用平台服务费率" prop="storefrontGeneralServiceFeeRate" :rules="[{ required: true, validator: validateGeneralSetting }]">
                        <div>
                            <TigInput type="integer" v-model="formState.storefrontGeneralServiceFeeRate" width="150px" :min="0" :max="100">
                                <template #append>%</template>
                            </TigInput>
                            <div class="extra">门店订单资金入账时，平台将抽取的服务费，单个门店也可在门店管理栏目中独立设置（独立会设置覆盖通用费率）</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="门店提现手续费率" prop="storefrontWithdrawalFeeRate" :rules="[{ required: true, validator: validateGeneralSetting }]">
                        <div>
                            <TigInput type="integer" v-model="formState.storefrontWithdrawalFeeRate" width="150px" :min="0" :max="100">
                                <template #append>%</template>
                            </TigInput>
                            <div class="extra">门店提现时，平台将抽取的提现手续费</div>
                        </div>
                    </el-form-item>
                </div>
                <div class="content_wrapper" v-if="isS2b2c()">
                    <div class="title">供应商分账设置</div>
                    <el-form-item label="通用平台服务费率" prop="supplierGeneralServiceFeeRate" :rules="[{ required: true, validator: validateGeneralSetting }]">
                        <div>
                            <TigInput type="integer" v-model="formState.supplierGeneralServiceFeeRate" width="150px" :min="0" :max="100">
                                <template #append>%</template>
                            </TigInput>
                            <div class="extra">订单资金入账时，平台将抽取的服务费</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="供应商提现手续费率" prop="supplierWithdrawalFeeRate" :rules="[{ required: true, validator: validateGeneralSetting }]">
                        <div>
                            <TigInput type="integer" v-model="formState.supplierWithdrawalFeeRate" width="150px" :min="0" :max="100">
                                <template #append>%</template>
                            </TigInput>
                            <div class="extra">供应商提现时，平台将抽取的提现手续费</div>
                        </div>
                    </el-form-item>
                </div>
            </el-form>
            <div style="height: 20px"></div>
            <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '370px' : '270px' }">
                <div class="selected-action">
                    <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交 </el-button>
                </div>
            </div>
        </a-spin>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { Rank, QuestionFilled } from "@element-plus/icons-vue";
import { onMounted, ref, shallowRef, nextTick, watch } from "vue";
import { message } from "ant-design-vue";
import { ProfitsharingSetting } from "@/types/finance/profitsharingSetting.d";
import { getProfitsharingConfig, saveProfitsharingConfig } from "@/api/finance/profitsharingSetting";
import { useConfigStore } from "@/store/config";
import { useRoute } from "vue-router";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
import { isS2b2c } from "@/utils/version";
const { themeInfo } = useThemeStore();
const route = useRoute();
const configStore = useConfigStore();
const formRef = shallowRef();
// 基本参数定义
const confirmLoading = ref<boolean>(false);
const formState = ref<Partial<ProfitsharingSetting>>({
    billingNode: undefined, // 出账节点，值为 1（下单成功） 值为 2（售后申请）
    collectionNode: undefined, // 入账节点，值为 1（订单完成） 值为 2（确认收货）
    collectionTimeSetting: undefined, // 入账时间，值为 10 天
    collectionMethod: undefined, // 入账方式 1-自动入账 2-手动入账
    collectionAccountType: undefined, // 入账账户类型 1-余额
    splitPaymentMethod: undefined, // 分账方式 1-线下分账 2-线上分账

    storeGeneralServiceFeeRate: undefined, // 店铺通用平台服务费率，5%
    storeWithdrawalFeeRate: undefined, // 店铺提现手续费率，0%

    storefrontGeneralServiceFeeRate: undefined, // 门店通用平台服务费率，5%
    storefrontWithdrawalFeeRate: undefined, // 门店提现手续费率，0%

    supplierGeneralServiceFeeRate: undefined, // 供应商通用平台服务费率，5%
    supplierWithdrawalFeeRate: undefined // 供应商提现手续费率，0%
});
// 加载列表
onMounted(async () => {
    await loadFilter();
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getProfitsharingConfig();
        Object.assign(formState.value, convertNullsToEmptyStrings(result));
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const validateCollectionTimeSetting = (rule: any, value: number, callback: any) => {
    if (value < 0 || value > 15) {
        callback(new Error("限制 0-15 天"));
    } else {
        callback();
    }
};
const validateGeneralSetting = (rule: any, value: number, callback: any) => {
    if (value < 0 || value > 100) {
        callback(new Error("限制 0-100%"));
    } else {
        callback();
    }
}
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    confirmLoading.value = true;
    try {
        const result = await saveProfitsharingConfig(formState.value);
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
