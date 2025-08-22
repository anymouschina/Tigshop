<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp" v-if="type != 'detail'">
                    <div class="list-table-tool-row">
                        <div class="simple-form-warp">
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <div class="control-container">
                                        <TigInput
                                            v-model="filterParams.keyword"
                                            name="keyword"
                                            :placeholder="adminType == 'admin' ? '输入管理员名称' : '输入员工名称'"
                                            @keyup.enter="onSearchSubmit"
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
                            <div class="simple-form-field" v-if="adminType == 'admin'">
                                <div class="form-group">
                                    <label class="control-label"><span>供应商：</span></label>
                                    <div class="control-container">
                                        <SelectVendor v-model:vendorId="filterParams.vendorId" @onChange="onSearchSubmit"></SelectVendor>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="vendor/setting/adminUser/Info"
                                        :title="adminType == 'admin' ? '添加管理员' : '添加员工'"
                                        width="800px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">{{ adminType == 'admin' ? '添加管理员' : '添加员工' }}</el-button>
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
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table
                            :data="filterState"
                            :loading="loading"
                            :total="total"
                            row-key="id"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <el-table-column type="selection" width="32"  v-if="type != 'detail'"/>
                            <el-table-column width="200" :label="adminType == 'admin' ? '管理员名称' : '员工名称'" prop="username">
                                <template #default="{ row }">
                                    <div class="avatar-username">
                                        <template v-if="extractContent(String(row.avatar)) == 'one'">
                                            <el-avatar :size="30" :src="imageFormat(row.avatar)" />
                                        </template>
                                        <template v-else-if="extractContent(String(row.avatar)) == 'def'">
                                            <el-avatar :size="30" :src="returnAvatar(row.avatar)" />
                                        </template>
                                        <template v-else>
                                            <el-avatar :size="30" src="" />
                                        </template>
                                        <div>
                                            <div>{{ row.username }}</div>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <!-- <el-table-column label="所属供应商" prop="vendorName">
                                <template #default="{ row }">
                                    <span>{{ row.vendorName || "-" }}</span>
                                </template>
                            </el-table-column> -->
                            <el-table-column label="邮箱" prop="email">
                                <template #default="{ row }">
                                    <span>{{ row.email || "-" }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="电话" prop="mobile">
                                <template #default="{ row }">
                                    <span v-if="row.adminUser.mobile">
                                        <MobileCard :mobile="row.adminUser.mobile"></MobileCard>
                                    </span>
                                    <span v-else>--</span>
                                </template>
                            </el-table-column>
                            <el-table-column :width="150" fixed="right" label="操作" v-if="type != 'detail'">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ act: 'detail', id: row.id }"
                                        isDrawer
                                        path="vendor/setting/adminUser/Info"
                                        :title="'编辑管理员'"
                                        width="800px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DeleteRecord :params="{ id: row.id }" :requestApi="delAdminUser" @afterDelete="loadFilter"
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
import { onMounted, ref } from "vue";
import { DeleteRecord, Pagination } from "@/components/list";
import { SelectVendor } from "@/components/select";
import { useConfigStore } from "@/store/config";
import type { AdminUserFilterParams, AdminUserFilterState } from "@/types/vendor/setting";
import { batchSubmit, delAdminUser, getAdminVendorUserList } from "@/api/vendor/setting";
import { extractContent } from "@/utils/util";
import { imageFormat } from "@/utils/format";
import { returnAvatar } from "@/utils/avatar";
import MobileCard from "@/components/list/src/MobileCard.vue";
import { isMerchant } from "@/utils/version";
import { useListRequest } from "@/hooks/useListRequest";
const adminType = ref(localStorage.getItem("adminType"));
const config: any = useConfigStore();
const props = defineProps({
    vendorId: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        default: ""
    }
});
const vendorId = ref<number | string>(props.vendorId || "");
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
    onBatchAction
} = useListRequest<AdminUserFilterState, AdminUserFilterParams>({
    apiFunction: getAdminVendorUserList,
    idKey: "id",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        keyword: "",
        vendorId: vendorId.value
    }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
    await onBatchAction(action, batchSubmit);
};

onMounted(() => {
    loadFilter();
});
</script>
<style lang="less" scoped>
.avatar-username {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
