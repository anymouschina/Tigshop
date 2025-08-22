<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="advanced-search-warp list-table-tool-row">
                        <div class="simple-form-warp">
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <label class="control-label"><span>供应商：</span></label>
                                    <div class="control-container">
                                        <TigInput
                                            v-model="filterParams.keyword"
                                            name="keyword"
                                            placeholder="输入供应商名称"
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
                            <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>关联账号：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.account"
                                                name="account"
                                                placeholder="输入关联账号名称"
                                                @keyup.enter="onSearchSubmit"
                                                clearable
                                                @clear="onSearchSubmit"
                                            >
                                            </TigInput>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>主账号：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.mainAccount"
                                                name="mainAccount"
                                                placeholder="输入主账号名称"
                                                @keyup.enter="onSearchSubmit"
                                                clearable
                                                @clear="onSearchSubmit"
                                            >
                                            </TigInput>
                                        </div>
                                    </div>
                                </div>
                            <div class="simple-form-field">
                                <div class="form-group">
                                    <label class="control-label"><span>状态 ：</span></label>
                                    <div class="control-container">
                                        <el-select v-model="filterParams.status" clearable @change="onSearchSubmit">
                                            <el-option v-for="value in statusList" :label="value.label" :value="value.value" />
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
                    <div class="list-table-tool-row mt20">
                        <div class="list-table-tool-col">
                            <el-space>
                                <DialogForm
                                    :params="{ act: 'add' }"
                                    isDrawer
                                    path="vendor/supplier/suppliers/Info"
                                    title="添加供应商"
                                    width="750px"
                                    @okCallback="loadFilter"
                                >
                                    <el-button type="primary">添加供应商</el-button>
                                </DialogForm>
                            </el-space>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table
                            :data="filterState"
                            :loading="loading"
                            :total="total"
                            row-key="vendorId"
                            @selection-change="onSelectChange"
                            @sort-change="onSortChange"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="供应商名称" width="200">
                                <template #default="{ row }">
                                    <PopForm
                                        v-model:org-value="row.vendorName"
                                        :max="10"
                                        :params="{ id: row.vendorId, field: 'vendorName' }"
                                        :requestApi="updateSuppliersField"
                                        label="权限组名称"
                                        type="input"
                                    >
                                        <div>{{ row.vendorName }}</div>
                                    </PopForm>
                                </template>
                            </el-table-column>
                            <el-table-column label="供应商LOGO" width="150">
                                <template #default="{ row }">
                                    <Image v-if="row.vendorLogo" :src="imageFormat(row.vendorLogo)" fit="contain" style="height: 50px; width: 50px" />
                                    <span v-else>暂无图片</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="联系人姓名" prop="contactName" align="center">
                                <template #default="{ row }">
                                    {{ row.contactName || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="联系方式" prop="contactMobile" align="center">
                                <template #default="{ row }">
                                    {{ row.contactMobile || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="主账号" prop="loginAccount" align="center">
                                <template #default="{ row }">
                                    <DialogForm
                                        :params="{ id: row.vendorId, type: 'vendor' }"
                                        isDrawer
                                        path="authority/accountManage/Detail"
                                        title="主账号管理"
                                        width="900px"
                                        @okCallback="loadFilter"
                                    >
                                        <a>{{ row.loginAccount || "--" }}</a>
                                    </DialogForm>
                                </template>
                            </el-table-column>
                            <el-table-column label="企业属性" width="100" align="center">
                                <template #default="{ row }">
                                    {{ row.type == 1 ? "个人" : "企业" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="供应商状态" align="center">
                                <template #default="{ row }">
                                    <Switch
                                        v-model:checked="row.status"
                                        :switchingCode="[2, 1]"
                                        :params="{ id: row.vendorId, field: 'status' }"
                                        :requestApi="updateSuppliersField"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="创建时间" prop="addTime"></el-table-column>
                            <el-table-column :width="180" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <el-space :size="0">
                                        <DialogForm
                                            :params="{ act: 'detail', id: row.vendorId }"
                                            isDrawer
                                            path="vendor/supplier/suppliers/Info"
                                            title="编辑供应商"
                                            width="750px"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">编辑</a>
                                        </DialogForm>
                                        <el-divider direction="vertical" />
                                        <DialogForm
                                            :params="{ act: 'detail', id: row.vendorId }"
                                            :showOnOk="false"
                                            :bodyStyle="{ padding: '0' }"
                                            isDrawer
                                            path="vendor/supplier/suppliers/Detail"
                                            title="详情"
                                            width="750px"
                                            @callback="loadFilter"
                                        >
                                            <a class="btn-link">详情</a>
                                        </DialogForm>
                                        <el-divider direction="vertical" />
                                        <el-dropdown>
                                            <span class="iconfont-admin icon-gengduo1 btn-link"></span>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <el-dropdown-item>
                                                        <DialogForm
                                                            :params="{ id: row.vendorId, type: 'vendor' }"
                                                            isDrawer
                                                            path="authority/accountManage/Detail"
                                                            title="主账号管理"
                                                            width="900px"
                                                            @okCallback="loadFilter"
                                                        >
                                                            <el-button style="width: 100%" link type="primary">主账号管理</el-button>
                                                        </DialogForm>
                                                    </el-dropdown-item>
                                                </el-dropdown-menu>
                                            </template>
                                        </el-dropdown>
                                    </el-space>
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
import { imageFormat } from "@/utils/format";
import { Image } from "@/components/image";
import { DialogForm } from "@/components/dialog";
import { PopForm } from "@/components/pop-form";
import { Pagination, Switch } from "@/components/list";
import { useConfigStore } from "@/store/config";
import type { SuppliersFilterParams, SuppliersFilterState } from "@/types/vendor/suppliers";
import { getSuppliersList, updateSuppliersField } from "@/api/vendor/suppliers";
import { useListRequest } from "@/hooks/useListRequest";
import { useRouter } from "vue-router";
const statusList = [
    {
        label: "开启",
        value: 1,
        isShow: true
    },
    {
        label: "关闭",
        value: 2,
        isShow: true
    }
];
const config: any = useConfigStore();
const query = useRouter().currentRoute.value.query;
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
    resetParams,
    onBatchAction
} = useListRequest<SuppliersFilterState, SuppliersFilterParams>({
    apiFunction: getSuppliersList,
    idKey: "vendorId",
    defaultParams: {
        sortField: "",
        sortOrder: "",
        account: (query.account as string) || "",
        mainAccount: "",
        keyword: "",
        status: "",
        page: 1,
        size: config.get("pageSize")
    }
});
// 初始化加载
loadFilter();
useRouter().replace({ query: {} });
</script>
