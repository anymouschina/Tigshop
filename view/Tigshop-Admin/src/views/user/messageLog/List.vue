<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams" @submit.native.prevent="onSearchSubmit">
                        <div class="list-table-tool-row">
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <div class="control-container">
                                            <TigInput v-model="filterParams.keyword" name="keyword" placeholder="输入标题" clearable @clear="onSearchSubmit">
                                                <template #append>
                                                    <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span></el-button>
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
                                            path="user/messageLog/Info"
                                            title="发送站内信"
                                            width="560px"
                                            @okCallback="loadFilter"
                                        >
                                            <el-button type="primary">发送站内信</el-button>
                                        </DialogForm>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <el-popconfirm title="您确认要批量撤回所选数据吗？" @confirm="onBatchSubmit('recall')">
                                            <template #reference>
                                                <el-button :disabled="selectedIds.length === 0">批量撤回</el-button>
                                            </template>
                                        </el-popconfirm>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <el-space>
                                            <el-popconfirm title="您确认要批量删除所选数据吗？" @confirm="onBatchSubmit('del')">
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
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table
                            :data="filterState"
                            :loading="loading"
                            :total="total"
                            row-key="messageLogId"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="标题" prop="messageTitle"></el-table-column>
                            <el-table-column label="内容" prop="messageContent"></el-table-column>
                            <el-table-column label="链接" prop="messageLink"></el-table-column>
                            <el-table-column :width="100" label="发送类型" prop="sendTypeName"></el-table-column>
                            <el-table-column :width="100" label="发送状态" prop="messageType">
                                <template #default="{ row }">
                                    <span :style="{ color: row.messageType === 0 ? 'green' : 'red' }">{{ row.statusName }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column :width="160" label="发送日期" prop="sendTime"></el-table-column>
                            <el-table-column :width="120" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <DeleteRecord
                                        v-if="row.isRecall == 0"
                                        :params="{ id: row.messageLogId }"
                                        title="确认要撤回该条消息吗？"
                                        :requestApi="recallMessageLog"
                                        @afterDelete="loadFilter"
                                        >撤回
                                    </DeleteRecord>
                                    <el-divider v-if="row.isRecall == 0" direction="vertical" />
                                    <DeleteRecord :params="{ id: row.messageLogId }" :requestApi="delMessageLog" @afterDelete="loadFilter">删除 </DeleteRecord>
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
import { DeleteRecord, Pagination } from "@/components/list";
import { useConfigStore } from "@/store/config";
import type { MessageLogFilterParams, MessageLogFilterState } from "@/types/user/messageLog";
import { batchSubmit, delMessageLog, getMessageLogList, recallMessageLog } from "@/api/user/messageLog";
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
} = useListRequest<MessageLogFilterState, MessageLogFilterParams>({
    apiFunction: getMessageLogList,
    idKey: "messageLogId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        keyword: ""
    }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
    await onBatchAction(action, batchSubmit);
};
// 初始化加载
loadFilter();
</script>
