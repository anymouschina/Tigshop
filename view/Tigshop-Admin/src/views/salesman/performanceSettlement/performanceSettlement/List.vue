<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="advanced-search-warp list-table-tool-row">
                        <div class="simple-form-warp">
                            <div class="simple-form-field mr10">
                                <div class="form-group">
                                    <label class="control-label"><span>订单编号：</span></label>
                                    <div class="control-container">
                                        <TigInput
                                            v-model="filterParams.orderSn"
                                            name="orderSn"
                                            placeholder="请输入订单编号"
                                            @keyup.enter="onSearchSubmit"
                                            clearable
                                            @clear="onSearchSubmit"
                                        ></TigInput>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field" v-if="filterParams.timeType === 1">
                                <div class="form-group">
                                    <label class="control-label"><span>结算状态：</span></label>
                                    <div class="control-container">
                                        <el-select v-model="filterParams.status" placeholder="请选择" @change="onSearchSubmit" clearable>
                                            <el-option label="未结算" :value="0" />
                                            <el-option label="已结算" :value="1" />
                                        </el-select>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <label class="control-label"><span>筛选类型：</span></label>
                                    <div class="control-container">
                                        <el-select v-model="filterParams.timeType" placeholder="请选择时间">
                                            <el-option label="下单时间" :value="1" />
                                            <el-option label="退款时间" :value="2" />
                                        </el-select>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <label class="control-label"><span>筛选时间：</span></label>
                                    <SelectTimeInterval
                                        type="date"
                                        v-model:start-date="filterParams.orderTimeStart"
                                        v-model:end-date="filterParams.orderTimeEnd"
                                        @callback="changeDateType(-1)"
                                    ></SelectTimeInterval>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <el-radio-group class="itemWidth" v-model="dateType" @change="changeDateType">
                                        <el-radio-button :value="0">今天</el-radio-button>
                                        <el-radio-button :value="1">昨天</el-radio-button>
                                        <el-radio-button :value="2">近7天</el-radio-button>
                                        <el-radio-button :value="3">近30天</el-radio-button>
                                        <el-radio-button :value="4">近半年</el-radio-button>
                                    </el-radio-group>
                                </div>
                            </div>
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <label class="control-label"></label>
                                    <div class="control-container">
                                        <el-button type="primary" plain @click="onSearchSubmit">搜索</el-button>
                                        <el-button plain @click="resetParams">重置</el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <el-dialog v-model="dialogVisible" title="导出数据" width="500" top="30vh" append-to-body :style="{ zIndex: 2000 }">
                    <div style="padding-top: 30px">
                        <el-form :model="exportParams" label-width="100px">
                            <el-form-item label="导出维度：">
                                <div>
                                    <el-radio-group v-model="exportParams.range">
                                        <el-radio :value="0">商品维度</el-radio>
                                        <el-radio :value="1">订单维度</el-radio>
                                    </el-radio-group>
                                    <div class="extra">
                                        <div v-if="exportParams.range == 0">以商品维度导出，每个商品展示一行</div>
                                        <div v-if="exportParams.range == 1">以订单维度导出，每个订单展示一行</div>
                                    </div>
                                </div>
                            </el-form-item>
                        </el-form>
                    </div>
                    <template #footer>
                        <div class="dialog-footer">
                            <el-button @click="dialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="handleExportData"> 导出 </el-button>
                        </div>
                    </template>
                </el-dialog>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :total="total" row-key="orderUserInfo.orderId" @selection-change="onSelectChange" @sort-change="onSortChange">
                            <!-- <el-table-column type="selection" width="32" fixed="left" /> -->
                            <el-table-column label="订单号" prop="orderId" :minWidth="190" fixed="left">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.orderUserInfo.orderId }"
                                        :showClose="false"
                                        :showOnOk="false"
                                        :title="'订单详情 ' + row.orderUserInfo.orderSn"
                                        isDrawer
                                        path="order/order/Info"
                                        width="880px"
                                        @callback="loadFilter"
                                    >
                                        <el-button link type="primary"> {{ row.orderUserInfo.orderSn }}</el-button>
                                    </DialogForm>
                                </template>
                            </el-table-column>
                            <el-table-column prop="orderAmount" :width="140">
                                <template #header>
                                    <div class="flex flex-align-center">
                                        <p>成交金额</p>
                                        <el-tooltip placement="bottom-start" effect="light">
                                            <template #content> 不计运费、税费和附加费 </template>
                                            <el-icon size="16" color="#c8c9cc" style="margin-left: 5px"><QuestionFilled /></el-icon>
                                        </el-tooltip>
                                    </div>
                                </template>
                                <template #default="{ row }">
                                    {{ priceFormat(row.userOrderItem.totalProductMoney) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="分销员" :width="140">
                                <template #default="{ row }">
                                    {{ row.salesman.baseUserInfo.nickname || row.salesman.baseUserInfo.username }}
                                </template>
                            </el-table-column>
                            <el-table-column label="客户" :width="140">
                                <template #default="{ row }">
                                    {{ row.orderUserInfo.user.nickname || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="收益类型" :width="140">
                                <template #default="{ row }"> 商品佣金 </template>
                            </el-table-column>
                            <el-table-column label="收益组成" :width="240">
                                <template #default="{ row }">
                                    {{ profitComposition(row.salesmanProductData, row.profitComposition) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="所属分组" :width="240">
                                <template #default="{ row }">
                                    {{ row.salesman.groupInfo.groupName || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="收益" :width="240">
                                <template #default="{ row }">
                                    {{ priceFormat(row.amount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="结算方式" :width="140">
                                <template #default="{ row }">
                                    {{ row.salesmanSettlementData?.settlementType == 1 ? "系统结算" : "人工结算" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="结算状态" :width="140" fixed="right">
                                <template #default="{ row }">
                                    {{ row.statusText }}
                                </template>
                            </el-table-column>
                            <el-table-column label="退款时间" :width="150" fixed="right">
                                <template #default="{ row }">
                                    {{ row.refundTime || "--" }}
                                </template>
                            </el-table-column>
                            <template #empty>
                                <div class="empty-warp">
                                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                                </div>
                            </template>
                        </el-table>
                    </a-spin>
                    <div v-if="total > 0" class="pagination-con">
                        <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total" @callback="loadFilter" />
                    </div>
                </div>
                <!-- <div v-if="selectedIds.length > 0" class="selected-action-warp selected-warp-left">
                    <div class="selected-action">
                        <el-space>
                            <span
                                >已选择：<b>{{ selectedIds.length }}</b> 项</span
                            >
                            <el-button>设置等级</el-button>
                            <el-button>分组</el-button>
                            <el-button>清退</el-button>
                        </el-space>
                    </div>
                </div> -->
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { SelectTimeInterval } from "@/components/select";
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref } from "vue";
import { Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { batchSubmit } from "@/api/product/product";
import { priceFormat } from "@/utils/format";
import { formattedDate } from "@/utils/time";
import { getDays } from "@/utils/util";
import { QuestionFilled } from "@element-plus/icons-vue";
import type { SalesmanOrderFilterParams, SalesmanOrderFilterState } from "@/types/salesman/performanceSettlement.d";
import { getSalesmanOrderList, getSalesmanOrderExport } from "@/api/salesman/performanceSettlement";
import requestExport from "@/utils/export";
const config: any = useConfigStore();
import { useListRequest } from "@/hooks/useListRequest";
const {
    listData: filterState,
    loading,
    total,
    selectedIds,
    filterParams,
    loadData: loadFilter,
    onSearchSubmit,
    onSortChange,
    onSelectChange,
    onBatchAction,
    resetParams
} = useListRequest<SalesmanOrderFilterState, SalesmanOrderFilterParams>({
    apiFunction: getSalesmanOrderList,
    idKey: "productId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        orderSn: "",
        orderTimeStart: "",
        orderTimeEnd: "",
        status: "",
        timeType: 1
    }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
    await onBatchAction(action, batchSubmit);
};

// 初始化加载
loadFilter();

const dialogVisible = ref<boolean>(false);
const exportParams = reactive<any>({
    range: 0,
    isExport: 1
});
const handleExportData = async () => {
    try {
        const result = await getSalesmanOrderExport({ ...filterParams, ...exportParams });
        requestExport(result, "分销员业绩结算表");
    } catch (error: any) {
        message.error(error.message);
    }
};
const dateType = ref(-1);
const changeDateType = (event: number) => {
    if (event === -1) {
        dateType.value = event;
        return;
    }
    filterParams.orderTimeStart = formattedDate(new Date(), "YYYY-MM-DD");
    if (event === 0) {
        //今天
        filterParams.orderTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    if (event === 1) {
        //昨天
        filterParams.orderTimeStart = formattedDate(getDays(1, "sub"), "YYYY-MM-DD");
        filterParams.orderTimeEnd = formattedDate(getDays(1, "sub"), "YYYY-MM-DD");
    }
    if (event === 2) {
        //近七天
        filterParams.orderTimeStart = formattedDate(getDays(7, "sub"), "YYYY-MM-DD");
        filterParams.orderTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    if (event === 3) {
        //近30天
        filterParams.orderTimeStart = formattedDate(getDays(30, "sub"), "YYYY-MM-DD");
        filterParams.orderTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    if (event === 4) {
        //近半年
        filterParams.orderTimeStart = formattedDate(getDays(180, "sub"), "YYYY-MM-DD");
        filterParams.orderTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    loadFilter();
};
const profitComposition = (salesmanProductData: any, profitComposition: string) => {
    let str = "--";
    let commissionType = 1;
    if (salesmanProductData.commissionData) {
        commissionType = salesmanProductData.commissionType;
        str = `${commissionType == 3 ? "" : "比例"}${profitComposition}${commissionType == 3 ? config.get("amountUnit") : "%"}（按实付金额计算）`;
    }
    return str;
};
</script>
<style lang="less" scoped>
.list-table-tool {
    margin-bottom: 0;
}
</style>
