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
                                            <TigInput
                                                v-model="filterParams.keyword"
                                                name="keyword"
                                                placeholder="输入属性模板名称"
                                                clearable
                                                @clear="onSearchSubmit"
                                            >
                                                <template #append>
                                                    <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span> </el-button>
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
                                            path="product/productAttributesTpl/Info"
                                            title="添加属性模板"
                                            width="600px"
                                            @okCallback="loadFilter"
                                        >
                                            <el-button type="primary">添加属性模板</el-button>
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
                            :loading="loading"
                            :total="total"
                            row-key="tplId"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="属性模板名称" sortable="custom" width="200">
                                <template #default="{ row }">
                                    <div style="position: relative">
                                        <PopForm
                                            v-model:org-value="row.tplName"
                                            :max="50"
                                            :params="{ id: row.tplId, field: 'tplName' }"
                                            :requestApi="updateProductAttributesTplFiled"
                                            label="属性模板名称"
                                            type="textarea"
                                        >
                                            <div>{{ row.tplName }}</div>
                                        </PopForm>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="属性名称列表">
                                <template #default="{ row }">
                                    <div class="tpl-data-con">
                                        <template v-for="item in row.tplData">
                                            <span v-for="attr in item">{{ attr["attrName"] }}<em>，</em></span>
                                        </template>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="150" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.tplId }"
                                        isDrawer
                                        path="product/productAttributesTpl/Info"
                                        title="编辑属性模板"
                                        width="600px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>

                                    <el-divider direction="vertical" />
                                    <DeleteRecord :params="{ id: row.tplId }" :requestApi="delProductAttributesTpl" @afterDelete="loadFilter"
                                        >删除</DeleteRecord
                                    >
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
import { PopForm } from "@/components/pop-form";
import { onMounted, reactive, ref } from "vue";
import { DeleteRecord, Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { ProductAttributesTplFilterParams, ProductAttributesTplFilterState } from "@/types/product/productAttributesTpl";
import { batchSubmit, delProductAttributesTpl, getProductAttributesTplList, updateProductAttributesTplFiled } from "@/api/product/productAttributesTpl";
import { useListRequest } from "@/hooks/useListRequest";
//
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
} = useListRequest<ProductAttributesTplFilterState, ProductAttributesTplFilterParams>({
    apiFunction: getProductAttributesTplList,
    idKey: "tplId",
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
<style lang="less" scoped>
.tpl-data-con span:last-child em {
    display: none;
}
</style>
