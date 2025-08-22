<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <div class="notice-warp">
                    <p>最终退款金额可根据实际需要填写，该金额会展示在会员用户的订单详情页面中（如果退款类型为商品，订单会统计所有该订单下商品的最终退款总额）；</p>
                    <p>处理状态为未处理或已处理时，佣金等相关功能不会计算最终退款金额；</p>
                    <p>处理状态为取消时，佣金等相关功能会忽略该退款；</p>
                    <p>积分、优惠券等退还与本操作无关，取消订单或商品退货操作确认后会自动退还！</p>
                </div>
                <el-table :data="formState.items" style="width: 100%;margin-bottom: 20px;" border>
                    <el-table-column label="商品信息" width="400">
                        <template #default="{row}">
                            <div class="flex">
                                <ProductCard
                                    :picThumb="row.picThumb"
                                    :productId="row.productId"
                                    :productName="row.productName"
                                    >
                                </ProductCard>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="商品价格" align="center">
                        <template #default="{row}">
                            <div>{{ priceFormat(row.price) }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="quantity" label="商品数量" align="center" />
                    <el-table-column prop="number" label="退货数量" align="center" />
                </el-table>
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :label="'售后编号'" prop="orderSn">
                        <DialogForm :params="{ act: 'detail', id: formState.aftersales?.aftersaleId }" isDrawer
                                    path="order/aftersales/Info" title="查看售后信息"
                                    width="700px" :showClose="false" :showOnOk="false">
                            <a class="btn-link">{{ formState.aftersales?.aftersalesSn }}</a>
                        </DialogForm>
                    </el-form-item>
                    <el-form-item :label="'订单编号'" prop="orderSn">
                        <DialogForm
                            :params="{ act: 'detail', id: formState.orderId }"
                            isDrawer
                            :showClose="false"
                            :showOnOk="false"
                            path="order/order/Info"
                            title="查看订单信息"
                            width="880px">
                            <a class="btn-link">{{ formState.orderSn }}</a>
                        </DialogForm>
                    </el-form-item>
                    <el-form-item :label="'订单金额'" prop="aftersales" v-if="formState.aftersales">
                        <OrderMoney style="width: 100%" v-model="formState.aftersales.orders"></OrderMoney>
                    </el-form-item>
                    <el-form-item label="余额退款金额" prop="refundBalance">
                        <TigInput width="100%" type="decimal" v-model="formState.refundBalance" @input="checkMax('refundBalance', formState.refundAmount)"  :disabled="formState.refundStatus != 0 || formState.isOffline == 1" />
                        <div class="extra">请根据实际情况填写金额, 最多可操作总金额 {{ priceFormat(formState.refundAmount) }}</div>
                    </el-form-item>
                    <el-form-item label="线上退款金额" prop="onlineBalance" v-if="formState.onlinePaidAmount > 0">
                        <TigInput width="100%" type="decimal" v-model="formState.onlineBalance"  @input="checkMax('onlineBalance',formState.onlinePaidAmount  )"  :disabled="formState.refundStatus != 0 || formState.isOffline == 1"/>
                        <div class="extra">请根据实际情况填写金额, 最多可操作金额 {{ priceFormat(formState.onlinePaidAmount  ) }}</div>
                    </el-form-item>
                    <el-form-item label="线下退款金额" prop="offlineBalance">
                        <TigInput width="100%" type="decimal" v-model="formState.offlineBalance" @input="checkMax('offlineBalance',formState.refundAmount)" :disabled="formState.refundStatus != 0 || formState.isOffline == 1"/>
                        <div class="extra">请根据实际情况填写金额, 最多可操作总金额 {{ priceFormat(formState.refundAmount) }}</div>
                    </el-form-item>
                    <el-form-item label="上传附件" prop="paymentVoucher">
                        <FormAddGallery v-if="!loading" v-model:photos="paymentVoucher" :isMultiple="true" :disabled="formState.refundStatus != 0 || formState.isOffline == 1"> </FormAddGallery>
                        <div class="extra">您可以通过拖拽来调整相册图片顺序，第一张图将作为商品主图展示</div>
                    </el-form-item>
                    <el-form-item label="本次操作备注" prop="refundNote">
                        <TigInput width="100%" v-model="formState.refundNote" :rows="4" type="textarea" :disabled="formState.refundStatus != 0 || formState.isOffline == 1"/>
                    </el-form-item>
                    <el-form-item>
                        <div class="btn-box">
                            <el-button v-if="formState.refundStatus == 0 && formState.isOffline != 1" ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit(1)">同意退款</el-button>
                            <el-button v-if="formState.isOffline == 1" ref="submitBtn" class="form-submit-btn" type="primary" @click="offlineAudit()">确认已线下转账</el-button>
                        </div>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width:100%;margin-top:100px"/>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {onMounted, ref, shallowRef} from "vue"
import {useRouter} from 'vue-router'
import {message} from "ant-design-vue";
import {RefundApplyFormState} from '@/types/finance/refundApply.d';
import {getRefundApply, updateRefundApply, updateOfflineAudit} from "@/api/finance/refundApply";
import {DialogForm} from "@/components/dialog";
import {OrderMoney} from "@/components/order";
import {ProductCard} from '@/components/list';
import { priceFormat } from "@/utils/format";
import { FormAddGallery } from "@/components/gallery";
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const paymentVoucher = ref<any[]>([]);
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ''
    },
    isDialog: Boolean
});

const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const formRef = shallowRef();
const formState = ref<RefundApplyFormState>({
    effectiveBalance: 0,
    refundBalance: 0,
    effectiveOnlineBalance: 0,
    onlineBalance: 0,
    offlineBalance: 0,
    refundAmount: 0,
    paidAmount: 0,
    onlinePaidAmount: 0,
});
type FormStateKey = keyof typeof formState.value;
const checkMax = (value: FormStateKey, max: any) => {
    if (Number(formState.value[value]) > Number(max)) {
        message.error("退款金额不能超过最多可操作金额");
    }
}
const fetchRefundApply = async () => {
    try {
        const result = await getRefundApply(action.value, {id: id.value});
        Object.assign(
          formState.value,
          result
        )
        if(result.aftersales && result.aftersales.refundAmount){
            formState.value.refundAmount =result.aftersales.refundAmount
        }
    } catch (error:any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};
const offlineAudit = async () => {
    try {
        const result = await updateOfflineAudit({refundId: id.value});
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error:any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};


onMounted(() => {
    // 获取详情数据
    fetchRefundApply();
});

// 表单通过验证后提交
const onSubmit = async (status: number) => {
     //refundStatus 1同意 2拒绝
     await formRef.value.validate();
     if(status == 1){
        if(Number(formState.value.refundBalance) > Number(formState.value.refundAmount)){
            //余额
            message.error('退款余额不能大于最多可操作金额');
            return;
        }
        if(Number(formState.value.onlineBalance) > Number(formState.value.onlinePaidAmount)){
            //线上
            message.error('线上退款金额不能大于最多可操作金额');
            return;
        }
        if(Number(formState.value.offlineBalance) > Number(formState.value.refundAmount)){
            //线下
            message.error('线下退款金额不能大于实收金额');
            return;
        }
        let total = Number(formState.value.refundBalance) + Number(formState.value.onlineBalance) + Number(formState.value.offlineBalance);
        if(total != formState.value.refundAmount){
            message.error('总退款金额必须等于最多可操作金额');
            return;
        }
     }
     let imgList:string[] = [];
     if(paymentVoucher.value.length > 0){
        paymentVoucher.value.forEach(item => {
            imgList.push(item.picUrl);
        });
     }
    try {
        emit('update:confirmLoading', true);
        let obj = {
            refundId: id.value, // 退款id
            refundNote: formState.value.refundNote,
            onlineBalance: formState.value.onlineBalance, // 线上金额
            offlineBalance: formState.value.offlineBalance, // 线下金额
            refundBalance: formState.value.refundBalance, // 余额
            paymentVoucher: imgList.join(','), // 上传的附件
            refundStatus: status, // 退款状态
        }
        const result = await updateRefundApply(obj);
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error:any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};

</script>
<style lang="less" scoped>
.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}
.btn-box{
    width: 100%;
    text-align: right;
}
</style>
