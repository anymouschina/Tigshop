<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams">
                        <div class="list-table-tool-row">
                            <div class="list-table-tool-col">
                                <el-space>
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="setting/multilingual/verbalAssociation/Info"
                                        title="添加语言"
                                        width="580px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">添加地区语言关联</el-button>
                                    </DialogForm>
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
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" row-key="id" @selection-change="onSelectChange" :total="total"
                            @sort-change="onSortChange" :loading="loading">
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="地区" prop="name">
                                <template #default="{ row }">
                                    <div style="position: relative;">
                                        <div>{{ row.name || '--' }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="语言标识码" prop="code">
                                <template #default="{ row }">
                                    <div style="position: relative;">
                                        <div>{{ row.code || '--' }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" width="150">
                                <template #default="{ row }">
                                    <DialogForm isDrawer @okCallback="loadFilter" title="编地区语言" width="580px"
                                        path="setting/multilingual/verbalAssociation/Info" :params="{ act: 'detail', id: row.id }">
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DeleteRecord @afterDelete="loadFilter" :requestApi="delLocalesRelation"
                                        :params="{ id: row.id }">删除</DeleteRecord>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <div class="empty-warp">
                                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                                </div>
                            </template>
                        </el-table>
                    </a-spin>
                    <div class="pagination-con" v-if="total > 0">
                        <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total"
                            @callback="loadFilter" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import '@/style/css/list.less'
import { DialogForm } from '@/components/dialog'
import { imageFormat } from "@/utils/format";
import { ref, reactive, onMounted } from 'vue';
import { DeleteRecord, Switch, Pagination } from '@/components/list';
import { message } from 'ant-design-vue'
import { useConfigStore } from "@/store/config";
import type { LocalesRelationFilterState, LocalesRelationFilterParams } from "@/types/multilingual/verbalAssociation.d";
import { getLocalesRelationList, batchSubmit, delLocalesRelation } from "@/api/multilingual/verbalAssociation";
import { AnyNsRecord } from 'dns';
const config:any = useConfigStore();
const props = defineProps({
    promotionType: {
        type: Number,
        default: 1,
    }
});
// 基本参数定义
const filterState = ref<LocalesRelationFilterState[]>();
const loading = ref<boolean>(true);
const total = ref<number>(0);
const selectedIds = ref<number[]>([]);
const filterParams = reactive<LocalesRelationFilterParams>({
    page: 1,
    size: config.get('pageSize'),
    sortField: '',
    sortOrder: '',
    keyword: '',
});
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getLocalesRelationList({ ...filterParams });
        filterState.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}
onMounted(() => {
    loadFilter();
});

// 参数查询
const onSearchSubmit = () => {
    loadFilter()
};
// 修改排序
const onSortChange = ({ prop, order }: { prop: string; order?: string }) => {
    filterParams.sortField = prop;
    filterParams.sortOrder = order == 'ascending' ? 'asc' : order == 'descending' ? 'desc' : '';
    loadFilter();
};

// 批量操作
const onBatchSubmit = async (action: string, val?: any) => {
    try {
        const result = await batchSubmit(action, { ids: selectedIds.value, value: val });
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    }
};
// 多选操作
const onSelectChange = (e: LocalesRelationFilterState[]) => {
    selectedIds.value = e.map((item:any) => item.id);
};
defineExpose({
	loadFilter
})
</script>
<style>
</style>
