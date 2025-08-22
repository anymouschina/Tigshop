<template>
    <div class="tit-box">
        <div class="tit">
            <span>最近交易记录</span>
        </div>
    </div>
    <div class="lyecs-table-list-warp">
        <el-tabs type="card" @tab-change="onTabChange">
            <el-tab-pane v-for="item in orderStatusList" :label="item.label"></el-tab-pane>
        </el-tabs>
        <div class="table-container">
            <el-table :data="filterState" :loading="loading" :total="total" row-key="logId" v-loading="loading">
                <el-table-column label="时间" prop="addTime" width="200"></el-table-column>
                <el-table-column label="购买用户" width="160">
                    <template #default="{ row }">
                        <span>{{ row.user.username }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="订单编号" prop="orderSn" width="180"></el-table-column>

                <el-table-column label="金额(元)|明细">
                    <template #default="{ row }">
                        <span>总金额: {{ priceFormat(row.totalAmount) || 0.0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" prop="orderStatusName" width="150"></el-table-column>
                <el-table-column label="操作" width="80">
                    <template #default="{ row }">
                        <DialogForm
                            :params="{ act: 'detail', id: row.orderId }"
                            :showClose="false"
                            :showOnOk="false"
                            :title="'订单详情 ' + row.orderSn"
                            isDrawer
                            path="order/order/Info"
                            width="880px"
                            @callback="loadFilter"
                        >
                            <el-button size="small" link type="primary"> 查看详情 </el-button>
                        </DialogForm>
                    </template>
                </el-table-column>
                <template #empty>
                    <div class="empty-warp">
                        <div v-if="!loading" class="empty-bg">暂无数据</div>
                    </div>
                </template>
            </el-table>
            <div v-if="total > 0" class="pagination-con">
                <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total" @callback="loadFilter" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import { onMounted, reactive, ref } from "vue";
import { Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { DialogForm } from "@/components/dialog";
import { priceFormat } from "@/utils/format";
import { getOrderList } from "@/api/order/order";
import { OrderFilterParams } from "@/types/order/order.d";
import { useListRequest } from "@/hooks/useListRequest";
const config: any = useConfigStore();
const orderStatusList = reactive([
    { value: '-1', label: "全部" },
    { value: '0,1,2', label: "进行中" },
    { value: '99', label: "待结算" },
    { value: '88', label: "退款" },
    { value: '5', label: "交易成功" },
    { value: '3,4,-2', label: "交易关闭" }
]);
const {
    listData: filterState,
    loading,
    total,
    filterParams,
    loadData: loadFilter,
} = useListRequest<any, OrderFilterParams>({
    apiFunction: getOrderList,
    idKey: "orderId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        orderStatus: -1,
        isSettlement: 0,
        payStatus: ""
    }
});

loadFilter();

const onTabChange = (e: number) => {
    filterParams.payStatus = "";
    if(orderStatusList[e].value == '99'){
        filterParams.isSettlement = 0;
        filterParams.orderStatus = -1;
    }else if (orderStatusList[e].value == '88') {
        filterParams.isSettlement = 0;
        filterParams.orderStatus = -1;
        filterParams.payStatus = 3;
    }else{
        filterParams.orderStatus = orderStatusList[e].value;
    }
    loadFilter();
};
</script>
<style lang="less" scoped>
.tit-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    margin-bottom: 20px;
    .tit {
        border-left: 3px solid #155bd4;
        padding-left: 10px;
        font-size: 14px;
    }
}
</style>
