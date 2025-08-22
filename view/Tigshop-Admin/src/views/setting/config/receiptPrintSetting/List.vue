<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="list-table-tool-row">
                        <div class="simple-form-warp">
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="setting/config/receiptPrintSetting/Info"
                                        title="新增打印机"
                                        width="600px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">新增打印机</el-button>
                                    </DialogForm>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table
                            :data="filterState"
                            :loading="loading"
                            :total="total"
                            row-key="printId"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <!-- <el-table-column type="selection" width="32" /> -->
                            <el-table-column label="名称">
                                <template #default="{ row }">
                                    <div>{{ row.printName }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="打印机类型" prop="platformText">
                                <template #default="{ row }">
                                 <div>{{ row.platformText }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="打印机编码" prop="printSn">
                                <template #default="{ row }">
                                    <div>{{ row.printSn }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="更新时间" prop="updateTime">
                                <template #default="{ row }">
                                    <div>{{ row.updateTime }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" prop="status" sortable="custom">
                                <template #default="{ row }">
                                    <Switch
                                        v-model:checked="row.status"
                                        :switchingCode="[2,1]"
                                        :params="{ id: row.printId, field: 'status' }"
                                        :requestApi="printUpdateStatus"
                                        @updateData="loadFilter"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column :width="200" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.printId }"
                                        isDrawer
                                        path="setting/config/receiptPrintSetting/Info"
                                        title="编辑"
                                        width="600px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.printId }"
                                        isDrawer
                                        path="setting/config/receiptPrintSetting/Design"
                                        title="购物小票信息"
                                        width="1350px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">排版设计</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DeleteRecord :params="{ id: row.printId }" :requestApi="printDelete"
                                                  @afterDelete="loadFilter"
                                    >删除
                                    </DeleteRecord>
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
                        <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total"
                                    @callback="loadFilter" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { DeleteRecord, Pagination, Switch } from "@/components/list";
import { useConfigStore } from "@/store/config";
import { getPrintList, printUpdateStatus, printDelete } from "@/api/setting/receiptPrint";
import { useListRequest } from "@/hooks/useListRequest";
import type { PrintListParams, PrintListResponse } from "@/types/setting/receiptPrint";

const config: any = useConfigStore();
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
} = useListRequest<PrintListResponse, PrintListParams>({
    // @ts-ignore
    apiFunction: getPrintList,
    idKey: "logisticsId",
    defaultParams: {
        id: void 0,
        sortField: "",
        sortOrder: "",
        keyword: "",
        platform: void 0,
        printName: "",
        printSn: "",
        status: void 0,
        page: 1,
        size: config.get("pageSize")
    }
});
// 初始化加载
loadFilter();
</script>
