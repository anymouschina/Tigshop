<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <el-tabs v-model="filterParams.statementDateType" type="card" @tab-change="onTabChange">
                    <el-tab-pane v-for="item in timeTypeList" :label="item.label" :name="item.value"></el-tab-pane>
                </el-tabs>
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams">
                        <div class="list-table-tool-row">
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <el-date-picker
                                            v-if="filterParams.statementDateType === 'day'"
                                            v-model="filterParams.statementDate"
                                            type="month"
                                            value-format="YYYY-MM"
                                            placeholder="请选择日期"
                                        />
                                        <el-date-picker v-else v-model="filterParams.statementDate" type="year" value-format="YYYY" placeholder="请选择日期" />
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <div class="control-container">
                                            <el-select clearable placeholder="请选择账户" v-model="filterParams.accountType" @change="loadFilter">
                                                <el-option v-for="item in configData.accountType" :label="item.description" :value="item.code"></el-option>
                                            </el-select>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <el-button type="primary" plain @click="loadFilter">搜索</el-button>
                                </div>
                                <div class="simple-form-field">
                                    <el-button plain @click="reset">重置</el-button>
                                </div>
                            </div>
                        </div>
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :loading="loading" row-key="invoiceId">
                            <el-table-column label="日期" prop="statementDate">
                                <template #default="{ row }">
                                    {{ row.statementDate || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="账户" prop="accountType">
                                <template #default="{ row }">
                                    {{ row.accountTypeText || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="收入(元)" prop="income" :width="150" align="right">
                                <template #default="{ row }">
                                    <p class="green">+ {{ row.income || "0.00" }}</p>
                                    <p>{{ row.incomeCount || "0" }}笔</p>
                                </template>
                            </el-table-column>
                            <el-table-column label="支出(元)" prop="expenditure" :width="150" align="right">
                                <template #default="{ row }">
                                    <p>- {{ row.expenditure || "0.00" }}</p>
                                    <p>{{ row.expenditureCount || "0" }}笔</p>
                                </template>
                            </el-table-column>
                            <el-table-column :width="210" fixed="right" label="操作" align="right">
                                <template #default="{ row }">
                                    <!-- <DialogForm
                                        :params="{ act: 'detail', id: row.invoiceId }"
                                        isDrawer
                                        path="finance/shopFunds/statementDownload/Detail"
                                        title="详情"
                                        width="900px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">详情</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" /> -->
                                    <!-- <a class="btn-link">下载报表</a> -->
                                    <el-button link type="primary" @click="statementExport(row)">下载报表</el-button>
                                    <el-divider direction="vertical" />
                                    <DialogForm
                                        :params="{
                                            source: props.source,
                                            startDateTime: dateCalculate(row.statementDate, 'start'),
                                            endDateTime: dateCalculate(row.statementDate, 'end')
                                        }"
                                        isDrawer
                                        path="finance/shopFunds/statementDetails/List"
                                        title="查看明细"
                                        width="1100px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button link type="primary">查看明细</el-button>
                                    </DialogForm>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <div class="empty-warp">
                                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                                </div>
                            </template>
                        </el-table>
                    </a-spin>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { ref } from "vue";
import type { StatementStatisticsRequest, StatementStatisticsResponse } from "@/types/finance/statementDownload.d";
import { getStatementStatisticsList, getStatementConfig, exportStatement } from "@/api/finance/statementDownload";
import { message } from "ant-design-vue";
import { formatDate } from "@/utils/util";
import requestExport from "@/utils/export";
const props = defineProps({
    source: {
        type: String,
        default: "shop"
    }
});
const timeTypeList = [
    {
        label: "日汇总",
        value: "day"
    },
    {
        label: "月汇总",
        value: "month"
    },
    {
        label: "年汇总",
        value: "year"
    }
];
const loading = ref(false);
const filterState = ref<StatementStatisticsResponse[]>([]);
const nowDate = formatDate(new Date());
const dates = ref(nowDate ? nowDate.split("-") : "");
const filterParams = ref<StatementStatisticsRequest>({
    source: props.source,
    statementDate: `${dates.value[0]}-${dates.value[1]}`,
    statementDateType: "day",
    accountType: ""
});
const loadFilter = async () => {
    try {
        const result = await getStatementStatisticsList({ ...filterParams.value });
        filterState.value = result;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const configData = ref<any>({});
const _getStatementConfig = async () => {
    try {
        const result = await getStatementConfig();
        configData.value = result;
        filterParams.value.accountType = result.accountType[0].code;
        await loadFilter();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

_getStatementConfig();
const onTabChange = (tab: string) => {
    filterParams.value.statementDateType = tab;
    if (tab == "day") {
        filterParams.value.statementDate = `${dates.value[0]}-${dates.value[1]}`;
    }
    if (tab == "month") {
        filterParams.value.statementDate = `${dates.value[0]}`;
    }
    if (tab == "year") {
        const lastYearDate = new Date();
        lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
        const nowDate = formatDate(lastYearDate);
        const dates = nowDate ? nowDate.split("-") : "";
        filterParams.value.statementDate = `${dates[0]}`;
    }
    loadFilter();
};
const reset = () => {
    filterParams.value = {
        statementDate: `${dates.value[0]}-${dates.value[1]}`,
        statementDateType: "day",
        accountType: ""
    };
    loadFilter();
};
// 导出对账单
const statementExport = async (item: StatementStatisticsResponse) => {
    try {
        const result = await exportStatement({
            statementDate: item.statementDate,
            statementDateType: filterParams.value.statementDateType,
            accountType: item.accountType
        });
        requestExport(result, `【${item.statementDate}对账单】`);
    } catch (error: any) {
        message.error(error.message);
    }
};

const dateCalculate = (date: string, type: string) => {
    // console.log(date)
    let dateTime = "";
    if (filterParams.value.statementDateType === "day") {
        dateTime = date;
    }
    if (filterParams.value.statementDateType === "month") {
        const [year, month] = date.split("-");
        // 获取该月的第一天
        if (type === "start") {
            const firstDay = new Date(Number(year), Number(month) - 1, 1);
            dateTime = formatDate(firstDay) || "";
        }
        // 获取该月的最后一天
        if (type === "end") {
            const lastDay = new Date(Number(year), Number(month), 0);
            dateTime = formatDate(lastDay) || "";
        }
    }
    if (filterParams.value.statementDateType === "year") {
        const year = date;
        // 获取该年的第一天
        if (type === "start") {
            const firstDay = new Date(Number(year), 0, 1);
            dateTime = formatDate(firstDay) || "";
        }
        // 获取该年的最后一天
        if (type === "end") {
            const lastDay = new Date(Number(year), 11, 31);
            dateTime = formatDate(lastDay) || "";
        }
    }
    if (type === "start") {
        dateTime += " 00:00:00";
    }
    if (type === "end") {
        dateTime += " 23:59:59";
    }
    return dateTime;
};
</script>
<style scoped lang="less">
.container {
    :deep(.el-tabs--card) {
        .el-tabs__header {
            margin-bottom: 0;
        }
        .el-tabs__header .el-tabs__item {
            background-color: #f5f6fa;
        }
        .el-tabs__header .el-tabs__item.is-active {
            background-color: #fff;
            color: #333;
        }
        .el-tabs__header .el-tabs__nav {
            overflow: hidden;
        }
    }
}
</style>
