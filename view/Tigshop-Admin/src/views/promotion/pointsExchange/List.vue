<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="notice-warp">
                <p>积分兑换列表前台地址为：{{ domain }}/exchange/list/（支持手机版自动跳转）</p>
            </div>
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams">
                        <div class="advanced-search-warp list-table-tool-row">
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>商品名称：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.keyword"
                                                name="keyword"
                                                placeholder="输入积分兑换商品名称"
                                                clearable
                                                @clear="onSearchSubmit"
                                            >
                                                <template #append>
                                                    <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span></el-button>
                                                </template>
                                            </TigInput>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>兑换状态：</span></label>
                                        <div class="control-container">
                                            <el-select v-model="filterParams.isEnabled" clearable @clear="onSearchSubmit" @change="onSearchSubmit">
                                                <el-option :value="0" label="不可兑换" />
                                                <el-option :value="1" label="可兑换" />
                                            </el-select>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>热销状态：</span></label>
                                        <div class="control-container">
                                            <el-select v-model="filterParams.isHot" clearable @clear="onSearchSubmit" @change="onSearchSubmit">
                                                <el-option :value="0" label="不热销" />
                                                <el-option :value="1" label="热销" />
                                            </el-select>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-warp">
                                    <div class="simple-form-field">
                                        <label class="control-label"></label>
                                        <div class="control-container">
                                            <el-button type="primary" plain @click="onSearchSubmit">搜索</el-button>
                                            <el-button plain @click="resetParams">重置</el-button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="list-table-tool-row">
                            <div class="list-table-tool-col">
                                <el-space>
                                    <DialogForm
                                        isDrawer
                                        @okCallback="loadFilter"
                                        title="添加积分商品"
                                        width="600px"
                                        path="promotion/pointsExchange/Info"
                                        :params="{ act: 'add' }"
                                    >
                                        <el-button type="primary">添加积分商品</el-button>
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
                        <el-table
                            :data="filterState"
                            row-key="id"
                            @selection-change="onSelectChange"
                            :total="total"
                            @sort-change="onSortChange"
                            :loading="loading"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="积分商品名称" prop="productName" sortable="custom" :width="350"></el-table-column>
                            <el-table-column label="使用积分值" prop="exchangeIntegral" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.exchangeIntegral }}
                                </template>
                            </el-table-column>
                            <el-table-column label="减免金额" prop="pointsDeductedAmount" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.pointsDeductedAmount }}
                                </template>
                            </el-table-column>
                            <el-table-column label="是否可兑换" sortable="custom">
                                <template #default="{ row }">
                                    <Switch
                                        v-model:checked="row.isEnabled"
                                        :requestApi="updatePointsExchangeFiled"
                                        :params="{ id: row.id, field: 'isEnabled' }"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="是否热销" sortable="custom">
                                <template #default="{ row }">
                                    <Switch v-model:checked="row.isHot" :requestApi="updatePointsExchangeFiled" :params="{ id: row.id, field: 'isHot' }" />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" :width="120">
                                <template #default="{ row }">
                                    <DialogForm
                                        isDrawer
                                        @okCallback="loadFilter"
                                        title="编辑积分商品"
                                        width="600px"
                                        path="promotion/pointsExchange/Info"
                                        :params="{ act: 'detail', id: row.id }"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <!-- <el-divider direction="vertical" /> -->
                                    <!-- <a>查看</a> -->
                                    <el-divider direction="vertical" />
                                    <DeleteRecord @afterDelete="loadFilter" :requestApi="delPointsExchange" :params="{ id: row.id }">删除</DeleteRecord>
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
import { ref, reactive, onMounted } from "vue";
import { DeleteRecord, Switch, Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { PointsExchangeFilterState, PointsExchangeFilterParams } from "@/types/promotion/pointsExchange.d";
import { getPointsExchangeList, batchSubmit, updatePointsExchangeFiled, delPointsExchange } from "@/api/promotion/pointsExchange";
import { useConfigStore } from "@/store/config";
const config: any = useConfigStore();
import { useListRequest } from '@/hooks/useListRequest';
// 基本参数定义
const domain = ref(useConfigStore().domain);
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
} = useListRequest<PointsExchangeFilterState, PointsExchangeFilterParams>({
  apiFunction: getPointsExchangeList,
  idKey: 'id',
  defaultParams: {
      sortField: '',
      sortOrder: '',
      keyword: '',
      page: 1,
      size: config.get("pageSize"),
      isEnabled: '',
      isHot: ''
  }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
  await onBatchAction(action, batchSubmit);
};

// 初始化加载
loadFilter();
</script>
