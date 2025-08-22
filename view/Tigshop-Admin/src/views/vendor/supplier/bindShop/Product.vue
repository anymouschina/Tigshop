<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
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
                                        <label class="control-label"><span>商品状态：</span></label>
                                        <div class="control-container">
                                            <el-select v-model="filterParams.productState" placeholder="请选择" @change="onSearchSubmit">
                                                <el-option :label="item.label" :value="item.value" v-for="item in productStatusList" />
                                            </el-select>
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
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :total="total" row-key="productId" @selection-change="onSelectChange" @sort-change="onSortChange">
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="商品名称" prop="productId" sortable="custom" :min-width="320">
                                <template #default="{ row }">
                                    <div class="flex">
                                        <div v-if="row.picThumb" class="span-pic">
                                            <a :href="urlFormat({ path: 'product', sn: row.productSn })" target="_blank"
                                                ><img :src="imageFormat(row.picThumb)" height="68" width="68" alt=""
                                            /></a>
                                        </div>
                                        <div class="span-product-con">
                                            <div class="span-product-name" style="word-break: break-all">
                                                <div>{{ row.productName }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="200" label="商品信息">
                                <template #default="{ row }">
                                    <span class="span-tit">编码：</span>
                                    <div class="span-con">
                                        <div>{{ row.productSn || "--" }}</div>
                                    </div>
                                    <br />
                                    <span class="span-tit">售价：</span>
                                    <div class="span-con">
                                        <div>{{ row.productPrice || 0.0 }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="120" label="商品分类" prop="productStock" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.productCategoryName || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="品牌" prop="productStock" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.productBrandName || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="供货价" prop="productStock" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.productSupplyPrice || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="库存" prop="productStock" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.productStock  || "--"}}
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="商品状态">
                                <template #default="{ row }">
                                    <div class="status-switch">
                                        {{ row.productStatus == 0 ? '下架' : '正常' }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="销量" prop="productStock" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.salesVolume }}
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
import { useConfigStore } from "@/store/config";
import { ProductFilterParams, ProductFilterState } from "@/types/vendor/product";
import { SelectTimeInterval } from "@/components/select";
import { getvendorShopBindProductList } from "@/api/vendor/bindShop";
import { SelectBrand, SelectCategory } from "@/components/select";
import { imageFormat, urlFormat } from "@/utils/format";
import { isMerchant, isOverseas } from "@/utils/version";
import { useListRequest } from "@/hooks/useListRequest";
const config: any = useConfigStore();
const props = defineProps({
    shopId: {
        type: Number,
        default: 0
    }
});
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
    resetParams
} = useListRequest<ProductFilterState, ProductFilterParams>({
    apiFunction: getvendorShopBindProductList,
    idKey: "productId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        shopId: props.shopId,
        sortField: "",
        sortOrder: "",
        keyword: "",
        productState: 1,
        endDate: "",
        startDate: ""
    }
});

// 初始化加载
loadFilter();
const productStatusList = ref([
    {
        label: "在售商品",
        value: 1,
        isShow: true
    },
    {
        label: "下架商品",
        value: 0,
        isShow: true
    }
]);
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
