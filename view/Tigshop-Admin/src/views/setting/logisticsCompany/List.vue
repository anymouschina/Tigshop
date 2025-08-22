<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="list-table-tool-row">
                        <div class="simple-form-warp">
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <div class="control-container">
                                        <TigInput
                                            v-model="filterParams.keyword"
                                            name="keyword"
                                            placeholder="输入物流公司名称"
                                            @keyup.enter="onSearchSubmit"
                                            clearable
                                            @clear="onSearchSubmit"
                                        >
                                            <template #append>
                                                <el-button @click="onSearchSubmit"><span
                                                    class="iconfont icon-chakan1"></span></el-button>
                                            </template>
                                        </TigInput>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="setting/logisticsCompany/Info"
                                        title="添加物流公司"
                                        width="600px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">添加物流公司</el-button>
                                    </DialogForm>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <el-space>
                                        <el-popconfirm title="您确认要批量删除所选数据吗？"
                                                       @confirm="onBatchSubmit('del')">
                                            <template #reference>
                                                <el-button :disabled="selectedIds.length === 0">批量删除</el-button>
                                            </template>
                                        </el-popconfirm>
                                        <span v-if="selectedIds.length > 0">
                                            已选择：<b>{{ selectedIds.length }}</b> 项
                                        </span>
                                    </el-space>
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
                            row-key="logisticsId"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="物流公司名称">
                                <template #default="{ row }">
                                    <PopForm
                                        v-model:org-value="row.logisticsName"
                                        :max="10"
                                        :params="{ id: row.logisticsId, field: 'logisticsName' }"
                                        :requestApi="updateLogisticsCompanyField"
                                        label="物流公司名称"
                                        type="input"
                                    >
                                        <div>{{ row.logisticsName }}</div>
                                    </PopForm>
                                </template>
                            </el-table-column>
                            <el-table-column label="配送公司代号" prop="logisticsCode">
                                <template #default="{ row }">
                                    <PopForm
                                        v-model:org-value="row.logisticsCode"
                                        :max="10"
                                        :params="{ id: row.logisticsId, field: 'logisticsCode' }"
                                        :requestApi="updateLogisticsCompanyField"
                                        label="配送公司代号"
                                        type="input"
                                    >
                                        <div>{{ row.logisticsCode }}</div>
                                    </PopForm>
                                </template>
                            </el-table-column>
                            <el-table-column label="物流公司描述" prop="logisticsDesc">
                                <template #default="{ row }">
                                    <PopForm
                                        v-model:org-value="row.logisticsDesc"
                                        :max="100"
                                        :params="{ id: row.logisticsId, field: 'logisticsDesc' }"
                                        :requestApi="updateLogisticsCompanyField"
                                        label="物流公司描述"
                                        type="textarea"
                                    >
                                        <div>{{ row.logisticsDesc }}</div>
                                    </PopForm>
                                </template>
                            </el-table-column>
                            <el-table-column label="是否显示" prop="isShow" sortable="custom">
                                <template #default="{ row }">
                                    <Switch
                                        v-model:checked="row.isShow"
                                        :params="{ id: row.logisticsId, field: 'isShow' }"
                                        :requestApi="updateLogisticsCompanyField"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="排序" prop="sortOrder" sortable="custom">
                                <template #default="{ row }">
                                    <PopForm
                                        v-model:org-value="row.sortOrder"
                                        :params="{ id: row.logisticsId, field: 'sortOrder' }"
                                        :requestApi="updateLogisticsCompanyField"
                                        extra="默认值为50，数值越小，排序越靠前"
                                        label="排序"
                                        type="integer"
                                    >
                                        <div>{{ row.sortOrder }}</div>
                                    </PopForm>
                                </template>
                            </el-table-column>
                            <el-table-column :width="150" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.logisticsId }"
                                        isDrawer
                                        path="setting/logisticsCompany/Info"
                                        title="编辑物流公司"
                                        width="600px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DeleteRecord :params="{ id: row.logisticsId }" :requestApi="delLogisticsCompany"
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
import { PopForm } from "@/components/pop-form";
import { DeleteRecord, Pagination, Switch } from "@/components/list";
import { useConfigStore } from "@/store/config";
import { LogisticsCompanyFilterParams, LogisticsCompanyFilterState } from "@/types/setting/logisticsCompany";
import {
    batchSubmit,
    delLogisticsCompany,
    getLogisticsCompanyList,
    updateLogisticsCompanyField
} from "@/api/setting/logisticsCompany";
import { useListRequest } from "@/hooks/useListRequest";

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
} = useListRequest<LogisticsCompanyFilterState, LogisticsCompanyFilterParams>({
    apiFunction: getLogisticsCompanyList,
    idKey: "logisticsId",
    defaultParams: {
        sortField: "",
        sortOrder: "",
        keyword: "",
        page: 1,
        size: config.get("pageSize")
    }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
    await onBatchAction(action, batchSubmit);
};

// 初始化加载
loadFilter();
</script>
