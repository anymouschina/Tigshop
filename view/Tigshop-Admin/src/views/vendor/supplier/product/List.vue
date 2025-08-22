<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <TigTabs v-model="activeKey" :tabs="productStatusList" @onTabChange="onTabChange"></TigTabs>
                <div class="list-table-tool lyecs-search-warp">
                    <el-form :model="filterParams" name="form">
                        <div class="advanced-search-warp list-table-tool-row">
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>商品名称：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.keyword"
                                                name="keyword"
                                                placeholder="输入商品名称/货号"
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
                                        <label class="control-label"><span>分类：</span></label>
                                        <div class="control-container">
                                            <SelectCategory ref="selectCategoryRef" v-model:categoryId="filterParams.categoryId"></SelectCategory>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>品牌：</span></label>
                                        <div class="control-container">
                                            <SelectBrand v-model:brandId="filterParams.brandId" @onChange="onSearchSubmit"></SelectBrand>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>创建时间：</span></label>
                                        <SelectTimeInterval
                                            v-model:end-date="filterParams.searchEndTime"
                                            v-model:start-date="filterParams.searchStartTime"
                                            :clearable="false"
                                            type="date"
                                            value-format="YYYY-MM-DD"
                                        ></SelectTimeInterval>
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
                        <div class="list-table-tool-row" v-if="adminType == 'vendor'">
                            <div class="list-table-tool-col">
                                <el-space>
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="vendor/supplier/product/Info"
                                        title="添加商品"
                                        width="1100px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">添加商品</el-button>
                                    </DialogForm>
                                    <el-popconfirm
                                        v-if="activeKey == 0 || activeKey == 1"
                                        title="您确认要批量移入回收站吗？"
                                        @confirm="onBatchSubmit('recycle')"
                                    >
                                        <template #reference>
                                            <el-button :disabled="selectedIds.length === 0">批量移入回收站</el-button>
                                        </template>
                                    </el-popconfirm>
                                    <el-popconfirm v-if="activeKey == 7" title="您确认要批量还原吗？" @confirm="onBatchSubmit('restore')">
                                        <template #reference>
                                            <el-button :disabled="selectedIds.length === 0">批量还原</el-button>
                                        </template>
                                    </el-popconfirm>
                                    <el-popconfirm v-if="activeKey == 1" title="您确认要批量断供吗？" @confirm="onBatchSubmit('outage')">
                                        <template #reference>
                                            <el-button :disabled="selectedIds.length === 0">批量断供</el-button>
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
                        <el-table :data="filterState" :total="total" row-key="id" @selection-change="onSelectChange" @sort-change="onSortChange">
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="商品名称" prop="id" sortable="custom" :min-width="320">
                                <template #default="{ row }">
                                    <div class="flex">
                                        <div v-if="row.picThumb" class="span-pic">
                                            <a :href="urlFormat({ path: 'product', sn: row.productSn })" target="_blank"
                                                ><img :src="imageFormat(row.picThumb)" height="68" width="68" alt=""
                                            /></a>
                                        </div>
                                        <div class="span-product-con">
                                            <div class="span-product-name" style="word-break: break-all">
                                                <PopForm
                                                    v-if="adminType == 'admin' && row.productState != 1"
                                                    :max="100"
                                                    v-model:org-value="row.productName"
                                                    :params="{ id: row.id, field: 'productName' }"
                                                    :requestApi="updateProductFiled"
                                                    label="商品名称"
                                                    type="textarea"
                                                >
                                                    <div>{{ row.productName }}</div>
                                                </PopForm>
                                                <div v-if="adminType == 'vendor'">{{ row.productName }}</div>
                                                <div v-if="adminType == 'admin'">{{ row.productName }}</div>
                                            </div>
                                            <p v-if="row.vendorName" class="span-product-brand">
                                                <span class="span-tit">供应商：</span><span class="span-con green">{{ row.vendorName }}</span>
                                            </p>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="商品分类" prop="productCategoryName" align="center">
                                <template #default="{ row }">
                                    <div>{{ row.productCategoryName || "--" }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="品牌" prop="productBrandName" align="center">
                                <template #default="{ row }">
                                    <div>{{ row.productBrandName || "--" }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="供货价" prop="supplyPrice" sortable="custom" align="center">
                                <template #default="{ row }">
                                    <div>{{ row.supplyPrice }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="库存" prop="sumSkuStock" sortable="custom" align="center">
                                <template #default="{ row }">
                                    <div>{{ row.sumSkuStock }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="商品状态" prop="productState" align="center">
                                <template #default="{ row }">
                                    <template v-if="adminType == 'admin'">
                                        <div v-if="row.productState === 1" class="green">在供</div>
                                        <div v-else class="red">断供</div>
                                    </template>

                                    <Switch
                                        v-else
                                        v-model:checked="row.productState"
                                        :params="{ id: row.id, field: 'productState' }"
                                        :requestApi="ProductChangeState"
                                        @callback="loadFilter"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="销量" prop="sumSalesVolume" sortable="custom" align="center">
                                <template #default="{ row }">
                                    {{ row.sumSalesVolume }}
                                </template>
                            </el-table-column>
                            <!-- <el-table-column v-if="activeKey === 5 || activeKey === 6" :width="100" label="审核状态">
                                <template #default="{ row }">
                                    <span v-if="row.auditState === 2" class="red tips-hover" :title="row.checkReason"
                                        >审核失败 <i class="ico-font">&#xe611;</i></span
                                    >
                                    <span v-if="row.auditState === 0" class="tips-hover gray" :title="row.checkReason">审核中</span><br />
                                </template>
                            </el-table-column> -->
                            <el-table-column v-if="activeKey === 6" :width="120" label="失败原因" show-overflow-tooltip>
                                <template #default="{ row }">
                                    {{ row.auditFailReason }}
                                </template>
                            </el-table-column>
                            <el-table-column :width="180" fixed="right" label="操作" v-if="adminType == 'vendor' && activeKey != 6">
                                <template #default="{ row }">
                                    <el-space>
                                        <DialogForm
                                            v-if="row.productState === 0 && activeKey != 7"
                                            :maskClose="false"
                                            :params="{ act: 'detail', id: row.id }"
                                            isDrawer
                                            path="vendor/supplier/product/Info"
                                            title="编辑商品"
                                            width="1100px"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">编辑</a>
                                        </DialogForm>
                                        <el-divider v-if="row.auditState === 1 && row.productState === 0 && activeKey != 7" direction="vertical" />
                                        <DeleteRecord
                                            v-if="row.auditState === 1 && row.productState === 0 && activeKey != 7"
                                            :params="{ id: row.id, field: 'productState', val: 1 }"
                                            :requestApi="ProductChangeState"
                                            title="确定起售该商品吗？"
                                            message="操作成功"
                                            @afterDelete="loadFilter"
                                        >
                                            起售
                                        </DeleteRecord>
                                        <DeleteRecord
                                            v-if="row.productState === 1 && activeKey != 7"
                                            :params="{ id: row.id, field: 'productState', val: 0 }"
                                            :requestApi="ProductChangeState"
                                            title="确定停止供应该商品吗？"
                                            message="操作成功"
                                            @afterDelete="loadFilter"
                                        >
                                            断供
                                        </DeleteRecord>
                                        <el-divider v-if="row.productState === 1 && activeKey != 7" direction="vertical" />
                                        <DialogForm
                                            v-if="row.productState === 1 && activeKey != 7"
                                            :maskClose="false"
                                            :params="{ act: 'detail', id: row.id, examine: 1 }"
                                            isDrawer
                                            path="vendor/supplier/product/Info"
                                            title="查看商品"
                                            width="1000px"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">查看</a>
                                        </DialogForm>
                                        <DeleteRecord
                                            v-if="activeKey === 7"
                                            :params="{ ids: [row.id], type: 'restore' }"
                                            :requestApi="updateProductData"
                                            title="确定还原该商品吗？"
                                            message="操作成功"
                                            @afterDelete="loadFilter"
                                        >
                                            还原
                                        </DeleteRecord>
                                        <el-divider direction="vertical" v-if="row.auditState === 1 && activeKey != 7" />
                                        <el-dropdown trigger="hover" v-if="row.auditState === 1 && activeKey != 7" :hide-on-click="false">
                                            <span class="iconfont-admin icon-gengduo1 btn-link"></span>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <DeleteRecord
                                                        :params="{ ids: [row.id], type: 'recycle' }"
                                                        :requestApi="updateProductData"
                                                        title="确定把该商品移入回收站吗？"
                                                        message="操作成功"
                                                        @afterDelete="loadFilter"
                                                    >
                                                        <el-dropdown-item>
                                                            <el-button style="width: 100%" link type="primary">移入回收站</el-button>
                                                        </el-dropdown-item>
                                                    </DeleteRecord>
                                                </el-dropdown-menu>
                                            </template>
                                        </el-dropdown>
                                    </el-space>
                                </template>
                            </el-table-column>
                            <el-table-column :width="150" fixed="right" label="操作" v-if="adminType == 'admin'">
                                <template #default="{ row }">
                                    <el-space>
                                        <DialogForm
                                            :maskClose="false"
                                            :params="{ act: 'detail', id: row.id, examine: 1 }"
                                            isDrawer
                                            path="vendor/supplier/product/Info"
                                            title="查看商品"
                                            width="1000px"
                                            :showFooter="false"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">查看</a>
                                        </DialogForm>
                                        <el-divider v-if="activeKey == 8 && row.auditState === 0" direction="vertical" />
                                        <DialogForm
                                            :maskClose="false"
                                            v-if="activeKey == 8 && row.auditState === 0"
                                            :params="{ act: 'detail', id: row.id }"
                                            dialogClass="noPadding"
                                            isDrawer
                                            path="vendor/supplier/product/Examine"
                                            title="商品审核"
                                            width="600px"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">去处理</a>
                                        </DialogForm>
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
import { DialogForm } from "@/components/dialog";
import { PopForm } from "@/components/pop-form";
import { ref } from "vue";
import { DeleteRecord, Pagination, Switch } from "@/components/list";
import { message } from "ant-design-vue";
import { SelectVendor } from "@/components/select";
import { useConfigStore } from "@/store/config";
import { ProductFilterParams, ProductFilterState } from "@/types/vendor/product";
import { SelectTimeInterval } from "@/components/select";
import {
    batchSubmit,
    delProduct,
    getProductList,
    updateProductFiled,
    ProductChangeState,
    getPlatformProductList,
    updateProductData
} from "@/api/vendor/product";
import { SelectBrand, SelectCategory, SelectShop } from "@/components/select";
import { imageFormat, urlFormat } from "@/utils/format";
import { useListRequest } from "@/hooks/useListRequest";
import admin from "@/router/asyncRoutes/admin";
const config: any = useConfigStore();
const waitingCheckedCount = ref<number>(0);
const adminType = ref(localStorage.getItem("adminType"));
const activeKey = ref<number>(1);
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
} = useListRequest<ProductFilterState, ProductFilterParams>(
    {
        apiFunction: adminType.value == "vendor" ? getProductList : getPlatformProductList,
        idKey: "id",
        defaultParams: {
            page: 1,
            size: config.get("pageSize"),
            sortField: "",
            sortOrder: "",
            keyword: "",
            introType: "",
            shopId: "",
            vendorId: "",
            categoryId: "",
            brandId: "",
            productState: 1,
            isRecycle: 0,
            auditState: 1,
            searchEndTime: "",
            searchStartTime: ""
        }
    },
    ["auditState", "productState", "isRecycle"]
);

// 初始化加载
loadFilter();
const onTabChange = (val: number) => {
    activeKey.value = val;
    filterParams.productState = val === 1 || val === 0 ? val : "";
    if (adminType.value == "vendor") {
        filterParams.auditState = val === 6 ? 2 : 1;
    }

    if (adminType.value !== "vendor") {
        filterParams.auditState = val === 8 ? 0 : "";
    }
    filterParams.isRecycle = val === 7 ? 1 : 0;
    filterParams.page = 1;
    Object.keys(filterParams).forEach((key) => {
        if ((filterParams as any)[key] === undefined) delete (filterParams as any)[key];
    });
    loadFilter();
};

const resetParams = () => {
    filterParams.sortField = "";
    filterParams.sortOrder = "";
    filterParams.keyword = "";
    filterParams.introType = "";
    filterParams.shopId = "";
    filterParams.vendorId = "";
    filterParams.categoryId = "";
    filterParams.brandId = "";
    filterParams.productState = 1;
    filterParams.isRecycle = 0;
    filterParams.auditState = 1;
    filterParams.searchEndTime = "";
    filterParams.searchStartTime = "";
    onTabChange(activeKey.value);
};
const productStatusList = ref([
    {
        label: "在售商品",
        value: 1,
        isShow: true
    },
    {
        label: "断供商品",
        value: 0,
        isShow: true
    },
    {
        label: "商品回收站",
        value: 7,
        isShow: adminType.value == "vendor" ? true : false
    },
    {
        label: "待审核商品",
        value: 8,
        isShow: adminType.value == "admin" ? true : false
    },
    {
        label: "审核失败商品",
        value: 6,
        isShow: adminType.value == "vendor" ? true : false
    }
]);
// 获取列表的查询结果
// const _getProductWaitingCheckedCount = async () => {
//     try {
//         const waitingCount = await getProductWaitingCheckedCount();
//         waitingCheckedCount.value = waitingCount;
//         // 找到对应的对象并更新 count
//         productStatusList.value = productStatusList.value.map((status) => {
//             if (status.value === 5) {
//                 status.count = waitingCheckedCount.value || 0;
//             }
//             return status;
//         });
//     } catch (error: any) {
//         message.error(error.message);
//     }
// };
// _getProductWaitingCheckedCount();

// 批量操作
const onBatchSubmit = async (action: string) => {
    await onBatchAction(action, batchSubmit);
};
</script>
<style lang="less" scoped>
:deep(.el-popper) {
    z-index: 2000 !important;
}
.status-switch {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 150px;
}

.status-switch > div {
    word-break: keep-all;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
}
</style>
