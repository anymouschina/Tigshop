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
                                            placeholder="输入商户名称"
                                            @keyup.enter="onSearchSubmit"
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
                                    <div class="control-container">
                                        <DialogForm
                                            :params="{ act: 'add' }"
                                            isDrawer
                                            path="adminMerchant/merchant/AddMerchant"
                                            title="添加商户"
                                            width="800px"
                                            @okCallback="loadFilter"
                                        >
                                            <el-button type="primary">添加商户</el-button>
                                        </DialogForm>
                                    </div>
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
                            row-key="merchantId"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <el-table-column label="商户所属单位">
                                <template #default="{ row }">
                                    <div class="ssdw">
                                        <template v-if="row.type == 1">
                                            <Tag :transparent="true" text="个人"></Tag>
                                        </template>
                                        <template v-else>
                                            <Tag color="#409EFF" :transparent="false" text="企业"></Tag>
                                        </template>
                                        {{ row.type == 1 ? "" + row.corporateName : "" + row.companyName }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="商户所属会员(ID)">
                                <template #default="{ row }">
                                    <div v-if="row.user">
                                        <UserCard :user="row.user?.username"></UserCard>{{ row.user?.userId ? "(" + row.user?.userId + ")" : "" }}
                                    </div>
                                    <div v-else>
                                        --
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="商户类型" prop="typeText"></el-table-column>
                            <el-table-column label="管理员">
                                <template #default="{ row }">
                                    <div v-if="row.admin">
                                        <UserCard :user="row.admin?.username"></UserCard>
                                    </div>
                                    <div v-else>
                                        --
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="已绑定店铺" prop="shopCount">
                                <template #default="{ row }">
                                    <el-button link @click="toPage(row)">{{ row.shopCount ? row.shopCount : "--" }}</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="认证状态" prop="statusText">
                                <template #default="{ row }">
                                    <template v-if="row.status == 1">
                                        <StatusDot color="#52c41a" :flicker="true"></StatusDot>
                                    </template>
                                    <template v-if="row.status == 2">
                                        <StatusDot color="#f5222d" :flicker="false"></StatusDot>
                                    </template>
                                    {{ row.statusText }}
                                </template>
                            </el-table-column>
                            <el-table-column label="认证日期" prop="addTime" sortable="custom"></el-table-column>
                            <el-table-column :width="80" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.merchantId }"
                                        isDrawer
                                        path="adminMerchant/merchant/Info"
                                        title="商户详情"
                                        width="600px"
                                        @okCallback="loadFilter"
                                        @callback="loadFilter"
                                        :showOnOk="false"
                                    >
                                        <a class="btn-link">详情</a>
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
import { DeleteRecord, Pagination, Switch } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { MerchantFilterParams, MerchantFilterState } from "@/types/adminMerchant/merchant";
import { batchSubmit, getMerchantList, updateMerchantField } from "@/api/adminMerchant/merchant";
import { Tag } from "@/components/form";
import StatusDot from "@/components/form/src/StatusDot.vue";
import { updateArticleFiled } from "@/api/content/article";
const config: any = useConfigStore();
import { useListRequest } from '@/hooks/useListRequest';
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
} = useListRequest<MerchantFilterState, MerchantFilterParams>({
  apiFunction: getMerchantList,
  idKey: 'merchantId',
  defaultParams: {
      sortField: '',
      sortOrder: '',
      keyword: '',
      page: 1,
      size: config.get("pageSize"),
  }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
  await onBatchAction(action, batchSubmit);
};

// 初始化加载
loadFilter();

import { useRouter } from "vue-router";
import UserCard from "@/components/list/src/UserCard.vue";

const router = useRouter();
const toPage = (val: any) => {
    router.push({ path: "/shop/list/", query: { id: val.merchantId, companyName: val.type == 2 ? val.companyName : val.corporateName } });
};

</script>
<style lang="less" scoped>
.ssdw {
    display: flex;
    align-items: center;
    gap: 4px;
}
.font-color {
    color: var(--tig-primary);
    cursor: pointer;
}
</style>
