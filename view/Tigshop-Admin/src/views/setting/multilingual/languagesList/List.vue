<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams">
                        <!-- <div class="advanced-search-warp list-table-tool-row">
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <div class="control-container">
                                            <TigInput v-model="filterParams.keyword" name="keyword" placeholder="输入语言名称" @keyup.enter="onSearchSubmit">
                                                <template #append>
                                                    <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span></el-button>
                                                </template>
                                            </TigInput>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> -->
                        <div class="list-table-tool-row">
                            <div class="list-table-tool-col">
                                <el-space>
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="setting/multilingual/languagesList/Info"
                                        title="添加语言"
                                        width="580px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">添加语言</el-button>
                                    </DialogForm>
                                    <el-popconfirm title="您确认要批量删除所选数据吗？" @confirm="onBatchSubmit('del')">
                                        <template #reference>
                                            <el-button :disabled="selectedIds.length === 0">批量删除</el-button>
                                        </template>
                                    </el-popconfirm>
                                    <el-popconfirm title="您确认要批量启用所选数据吗？" @confirm="onBatchSubmit('enabled', 1)">
                                        <template #reference>
                                            <el-button :disabled="selectedIds.length === 0">批量启用</el-button>
                                        </template>
                                    </el-popconfirm>
                                    <el-popconfirm title="您确认要批量取消启用所选数据吗？" @confirm="onBatchSubmit('enabled', 0)">
                                        <template #reference>
                                            <el-button :disabled="selectedIds.length === 0">批量取消启用</el-button>
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
                            <el-table-column label="语言名称" prop="language" :width="150">
                                <template #default="{ row }">
                                    <div style="position: relative;">
                                        <div>{{ row.language || '--' }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="语言识别码" prop="localeCode" width="200">
                            </el-table-column>
                            <el-table-column label="货币" prop="name" width="200">
                                <template #default="{ row }">
                                    <div>{{ row.currency?.name || '--' }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="货币符号" prop="symbol" width="200">
                                <template #default="{ row }">
                                    <div>{{ row.currency?.symbol || '--' }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="最后更新时间" prop="lastUpdated" width="200" sortable="custom">
                            </el-table-column>
                            <el-table-column label="是否启用" prop="isEnabled" sortable="custom" :width="110">
                                <template #default="{ row }">
                                    <Switch v-model:checked="row.isEnabled" :requestApi="updateLocalesFiled"
                                        :params="{ id: row.id, field: 'isEnabled' }" />
                                </template>
                            </el-table-column>
                            <el-table-column label="是否默认" prop="isDefault" sortable="custom" :width="110">
                                <template #default="{ row }">
                                    <Switch v-model:checked="row.isDefault" :requestApi="updateLocalesFiled" @callback="loadFilter"
                                        :params="{ id: row.id, field: 'isDefault' }" />
                                </template>
                            </el-table-column>
                            <el-table-column label="排序" prop="sort" sortable="custom">
                                <template #default="{ row }">
                                    <PopForm
                                        v-model:org-value="row.sort"
                                        :params="{ id: row.id, field: 'sort' }"
                                        :requestApi="updateLocalesFiled"
                                        label="排序"
                                        type="integer"
                                        @callback="loadFilter"
                                    >
                                        <div>{{ row.sort || '--' }}</div>
                                    </PopForm>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" width="150">
                                <template #default="{ row }">
                                    <DialogForm isDrawer @okCallback="loadFilter" title="编辑语言" width="580px"
                                        path="setting/multilingual/languagesList/Info" :params="{ act: 'detail', id: row.id }">
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DeleteRecord @afterDelete="loadFilter" :requestApi="delLocales"
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
import {PopForm} from "@/components/pop-form";
import { imageFormat } from "@/utils/format";
import { ref, reactive, onMounted } from 'vue';
import { DeleteRecord, Switch, Pagination } from '@/components/list';
import { message } from 'ant-design-vue'
import { useConfigStore } from "@/store/config";
import type { LocalesFilterState, LocalesFilterParams } from "@/types/multilingual/languagesList.d";
import { getLocalesList, batchSubmit, updateLocalesFiled, delLocales } from "@/api/multilingual/languagesList";
import { AnyNsRecord } from 'dns';
const config:any = useConfigStore();
const props = defineProps({
    promotionType: {
        type: Number,
        default: 1,
    }
});
// 基本参数定义
const filterState = ref<LocalesFilterState[]>();
const loading = ref<boolean>(true);
const total = ref<number>(0);
const selectedIds = ref<number[]>([]);
const filterParams = reactive<LocalesFilterParams>({
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
        const result = await getLocalesList({ ...filterParams });
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
const onSelectChange = (e: LocalesFilterState[]) => {
    selectedIds.value = e.map((item:any) => item.id);
};
defineExpose({
	loadFilter
})
</script>
<style>
</style>
