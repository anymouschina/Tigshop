<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams">
                        <div class="advanced-search-warp list-table-tool-row">
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <div class="control-container">
                                            <TigInput v-model="filterParams.name" name="name" placeholder="请输入币种" @keyup.enter="onSearchSubmit">
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
                                            path="setting/multilingual/currencyManagement/Info"
                                            title="添加币种"
                                            width="600px"
                                            @okCallback="loadFilter"
                                        >
                                            <el-button type="primary">添加币种</el-button>
                                        </DialogForm>
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
                            row-key="id"
                            @selection-change="onSelectChange"
                            :total="total"
                            @sort-change="onSortChange"
                            :loading="loading"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="币种名称" prop="name" :width="150">
                                <template #default="{ row }">
                                    <div class="flex flex-align-center">
                                        <template v-if="row.isDefault == 1">
                                            <Tag :transparent="true" text="默认"></Tag>
                                        </template>
                                        <div>{{ row.name || "--" }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="币种符号" prop="symbol" width="200"> </el-table-column>
                            <el-table-column label="汇率" prop="rate" width="200">
                                <template #default="{ row }">
                                    <div>{{ row.rate || "--" }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="是否默认" prop="isDefault">
                                <template #default="{ row }">
                                    <Switch
                                        v-model:checked="row.isDefault"
                                        :requestApi="updateCurrencyFiled"
                                        @callback="loadFilter"
                                        :params="{ id: row.id, field: 'isDefault' }"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" width="120">
                                <template #default="{ row }">
                                    <DialogForm
                                        isDrawer
                                        @okCallback="loadFilter"
                                        title="编辑币种"
                                        width="800px"
                                        path="setting/multilingual/currencyManagement/Info"
                                        :params="{ act: 'detail', id: row.id }"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <!-- <el-divider direction="vertical" />
                                    <DialogForm isDrawer @okCallback="loadFilter" title="汇率管理" width="800px"
                                        path="setting/multilingual/currencyManagement/ExchangeRate" :params="{ act: 'detail', id: row.id }">
                                        <a class="btn-link">汇率管理</a>
                                    </DialogForm> -->
                                    <el-divider direction="vertical" />
                                    <DeleteRecord @afterDelete="loadFilter" :requestApi="delCurrency" :params="{ id: row.id }">删除</DeleteRecord>
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
                        <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total" @callback="loadFilter" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { Tag } from "@/components/form";
import { imageFormat } from "@/utils/format";
import { ref, reactive, onMounted } from "vue";
import { DeleteRecord, Switch, Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import type { CurrencyFilterState, CurrencyFilterParams } from "@/types/multilingual/currencyManagement.d";
import { getCurrencyList, batchSubmit, updateCurrencyFiled, delCurrency } from "@/api/multilingual/currencyManagement";
import { AnyNsRecord } from "dns";
const config: any = useConfigStore();
const props = defineProps({
    promotionType: {
        type: Number,
        default: 1
    }
});
// 基本参数定义
const filterState = ref<CurrencyFilterState[]>();
const loading = ref<boolean>(true);
const total = ref<number>(0);
const selectedIds = ref<number[]>([]);
const filterParams = reactive<CurrencyFilterParams>({
    page: 1,
    size: config.get("pageSize"),
    sortField: "",
    sortOrder: "",
    name: ""
});
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getCurrencyList({ ...filterParams });
        filterState.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    loadFilter();
});

// 参数查询
const onSearchSubmit = () => {
    loadFilter();
};
// 修改排序
const onSortChange = ({ prop, order }: { prop: string; order?: string }) => {
    filterParams.sortField = prop;
    filterParams.sortOrder = order == "ascending" ? "asc" : order == "descending" ? "desc" : "";
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
const onSelectChange = (e: CurrencyFilterState[]) => {
    selectedIds.value = e.map((item: any) => item.id);
};
defineExpose({
    loadFilter
});
</script>
<style></style>
