<template>
    <div class="container">
        <div class="content_wrapper">
            <el-tabs v-model="activeKey" class="lyecs-tabs" tab-position="top" @tab-change="onTabChange">
                <el-tab-pane :key="1" label="基础设置" name="Base"></el-tab-pane>
                <el-tab-pane :key="2" label="微信支付" name="Wechat"></el-tab-pane>
                <el-tab-pane :key="3" label="支付宝" name="Alipay"></el-tab-pane>
                <el-tab-pane :key="4" label="YaBandPay" name="Yabanpay"></el-tab-pane>
                <el-tab-pane :key="5" label="线下支付" name="Offline"></el-tab-pane>
                <el-tab-pane :key="6" label="PayPal" name="PayPal"></el-tab-pane>
                <el-tab-pane :key="7" label="云支付" name="CloudPay"></el-tab-pane>
            </el-tabs>
            <Base v-if="activeKey === 'Base'"></Base>
            <Wechat v-if="activeKey === 'Wechat'"></Wechat>
            <Alipay v-if="activeKey === 'Alipay'"></Alipay>
            <Yabanpay v-if="activeKey === 'Yabanpay'"></Yabanpay>
            <Offline v-if="activeKey === 'Offline'"></Offline>
            <PayPal v-if="activeKey === 'PayPal'"></PayPal>
            <CloudPay v-if="activeKey === 'CloudPay'"></CloudPay>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { ref } from "vue";
import { Base, Wechat, Alipay, Yabanpay, Offline, PayPal, CloudPay } from "./src/index";
const activeKey = ref("Base");
const onTabChange = (val: string) => {
    activeKey.value = val;
};
</script>
<style lang="less" scoped>
.content_wrapper{
    min-height: calc(100vh - 260px);
}

</style>