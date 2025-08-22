<template>
    <div v-for="data in dialogConfigs">
        <DialogForm
            v-if="data.type == item.msgType"
            :key="data.type"
            :params="{ act: 'detail', id: getParamId(data.idKey) }"
            :title="data.title"
            :showClose="data.showClose"
            :showOnOk="data.showOnOk"
            isDrawer
            :path="data.path"
            :width="data.width"
        >
            <span>查看详情</span>
            <span class="iconfont-admin icon-login-youjiantou"></span>
        </DialogForm>
    </div>
</template>

<script setup lang="ts">
import { DialogForm } from "@/components/dialog";
import { reactive } from "vue";

const props = defineProps({
    item: { type: Object, default: () => ({}) },
    orderSn:{
        type: String,
        default: ""
    }
});
interface DialogConfig {
    type: number;
    title: string;
    idKey: string;
    showClose?: boolean;
    showOnOk?: boolean;
    path?: string;
    width?: string;
}
// 定义每种消息类型的配置
const dialogConfigs = reactive<DialogConfig[]>([
    { type: 11, title: `订单详情 ${props.orderSn}`, idKey: 'relatedData.orderId', path: 'order/order/Info', width: '880px', showClose: false, showOnOk: false },
    { type: 12, title: `订单详情 ${props.orderSn}`, idKey: 'relatedData.orderId', path: 'order/order/Info', width: '880px', showClose: false, showOnOk: false },
    { type: 13, title: `订单详情 ${props.orderSn}`, idKey: 'relatedData.orderId', path: 'order/order/Info', width: '880px', showClose: false, showOnOk: false },
    { type: 31, title: `订单详情 ${props.orderSn}`, idKey: 'relatedData.orderId', path: 'order/order/Info', width: '880px', showClose: false, showOnOk: false },
    { type: 54, title: `订单详情 ${props.orderSn}`, idKey: 'relatedData.orderId', path: 'order/order/Info', width: '880px', showClose: false, showOnOk: false },
    { type: 21, title: '商品详情', idKey: 'relatedData.productId', path: 'product/product/Info', width: '800px' },
    { type: 22, title: '商品详情', idKey: 'relatedData.productId', path: 'product/product/Info', width: '800px' },
    { type: 23, title: '商品详情', idKey: 'relatedData.productId', path: 'product/product/Info', width: '800px' },
    { type: 24, title: '商品详情', idKey: 'relatedData.productId', path: 'product/product/Info', width: '800px' },
    { type: 32, title: `售后详情 ${props.item.relatedData?.aftersalesSn}`, idKey: 'relatedData.aftersaleId', path: 'order/aftersales/Info', width: '800px', showClose: false, showOnOk: false },
    { type: 33, title: '查看申请', idKey: 'relatedData.withdrawApplyId', path: 'finance/userWithdrawApply/Info', width: '600px' },
    { type: 34, title: '编辑增票资质申请', idKey: 'relatedData.invoiceId', path: 'finance/userInvoice/Info', width: '600px' },
    { type: 35, title: '编辑发票申请', idKey: 'relatedData.orderInvoiceId', path: 'finance/orderInvoice/Info', width: '700px' },
    { type: 41, title: '申请详情', idKey: 'relatedData.merchantApplyId', path: 'adminMerchant/apply/Info', width: '600px' },
    { type: 53, title: '编辑会员留言', idKey: 'relatedData.id', path: 'user/feedback/Info', width: '600px' },
])

// 获取对应的参数ID
const getParamId = (key:any) => {
    if (key.includes('.')) {
        const keys = key.split('.');
        return props.item[keys[0]] ? props.item[keys[0]][keys[1]] : null;
    }
    return props.item[key];
}
</script>
