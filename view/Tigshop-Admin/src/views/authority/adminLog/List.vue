<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="list-table-tool-row">
                        <div class="list-table-tool-col">
                            <el-space>
                                <TigInput
                                    v-model="filterParams.keyword"
                                    class="width240"
                                    name="keyword"
                                    placeholder="输入关键词或IP地址"
                                    @keyup.enter="onSearchSubmit"
                                    clearable
                                    @clear="onSearchSubmit"
                                >
                                    <template #append>
                                        <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span></el-button>
                                    </template>
                                </TigInput>
                            </el-space>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :loading="loading" :total="total" row-key="logId" @sort-change="onSortChange">
                            <el-table-column label="编号" prop="logId"></el-table-column>
                            <el-table-column label="操作者" prop="username"></el-table-column>
                            <el-table-column label="IP地址" prop="ipAddress"></el-table-column>
                            <el-table-column label="操作日期" prop="logTime" sortable="custom"></el-table-column>
                            <el-table-column label="操作记录" prop="logInfo"></el-table-column>
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
import { Pagination } from "@/components/list";
import { useConfigStore } from "@/store/config";
import type { AdminLogFilterParams, AdminLogFilterState } from "@/types/authority/adminLog";
import { getAdminLogList } from "@/api/authority/adminLog";
import { useListRequest } from "@/hooks/useListRequest";
const config: any = useConfigStore();
const {
    listData: filterState,
    loading,
    total,
    filterParams,
    loadData: loadFilter,
    onSearchSubmit,
    onSortChange
} = useListRequest<AdminLogFilterState, AdminLogFilterParams>({
    apiFunction: getAdminLogList,
    idKey: "articleId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "logTime",
        sortOrder: "desc",
        keyword: ""
    }
});
// 初始化加载
loadFilter();
</script>
