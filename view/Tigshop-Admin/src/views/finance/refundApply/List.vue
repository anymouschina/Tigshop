<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="list-table-tool-row">
                        <div class="list-table-tool-col">
                            <el-space>
                                <el-select placeholder="请选择状态" clearable v-model="filterParams.refundStatus" @change="onSearchSubmit">
                                    <el-option v-for="(item, index) in refundStatusList" :key="index" :value="index" :label="item" />
                                </el-select>
                                <TigInput
                                    v-model="filterParams.keyword"
                                    name="keyword"
                                    placeholder="输入售后单号"
                                    @keyup.enter="onSearchSubmit"
                                    clearable
                                    @clear="onSearchSubmit"
                                >
                                    <template #append>
                                        <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span> </el-button>
                                    </template>
                                </TigInput>
                            </el-space>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :loading="loading" :total="total" row-key="refundId" @sort-change="onSortChange">
                            <el-table-column label="退款类型" :width="120" prop="refundTypeName"></el-table-column>
                            <el-table-column label="退款信息">
                                <template #default="{ row }">
                                    <div style="display: flex; justify-content: space-between; align-items: center">
                                        <DialogForm
                                            :params="{ act: 'detail', id: row.aftersaleId, type: 2 }"
                                            isDrawer
                                            path="order/aftersales/Info"
                                            :title="'售后详情 ' + row.aftersales.aftersalesSn"
                                            width="800px"
                                            @okCallback="loadFilter"
                                            :showClose="false"
                                            :showOnOk="false"
                                        >
                                            售后编号：<a>{{ row.aftersales?.aftersalesSn }}</a>
                                        </DialogForm>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="退款状态" :width="120" prop="refundStatusName"></el-table-column>
                            <el-table-column label="申请时间" :width="160" prop="addTime"></el-table-column>
                            <el-table-column :width="120" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.refundId }"
                                        isDrawer
                                        title="编辑退款申请"
                                        width="800px"
                                        path="finance/refundApply/Info"
                                        @okCallback="loadFilter"
                                        :showClose="false"
                                        :showOnOk="false"
                                    >
                                        <a class="btn-link">{{ row.refundStatus == 0 || row.refundStatus == 1 ? "处理申请" : "查看详情" }}</a>
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
                    <div v-if="total > 0" class="pagination-con">
                        <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total" @callback="loadFilter" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref } from "vue";
import { DeleteRecord, Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { RefundApplyFilterParams, RefundApplyFilterState } from "@/types/finance/refundApply";
import { batchSubmit, getRefundApplyConfig, getRefundApplyList } from "@/api/finance/refundApply";
import { useListRequest } from "@/hooks/useListRequest";
const config: any = useConfigStore();

const {
    listData: filterState,
    loading,
    total,
    filterParams,
    loadData: loadFilter,
    onSearchSubmit,
    onSortChange,
} = useListRequest<RefundApplyFilterState, RefundApplyFilterParams>({
    apiFunction: getRefundApplyList,
    idKey: "refundId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        keyword: "",
        refundStatus: ""
    }
});

const refundStatusList = ref([]);
const fetchRefundApplyConfig = async () => {
    try {
        const result = await getRefundApplyConfig();
        refundStatusList.value = result;
    } catch (error: any) {
        message.error(error.message);
    }
};
const loadConfig = async () => {
    await fetchRefundApplyConfig();
    loadFilter();
};
onMounted(() => {
    loadConfig();
});
</script>
