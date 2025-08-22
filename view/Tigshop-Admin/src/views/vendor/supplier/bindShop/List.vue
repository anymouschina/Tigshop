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
                                        <label class="control-label"><span>店铺名称：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.keyword"
                                                name="keyword"
                                                placeholder="店铺名称"
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
                                        <label class="control-label"><span>选择店铺：</span></label>
                                        <div class="control-container">
                                            <SelectVendorShop v-model:shopId="filterParams.shopId" @onChange="onSearchSubmit"></SelectVendorShop>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>选择商户：</span></label>
                                        <div class="control-container">
                                            <SelectVendorMerchant v-model:merchantId="filterParams.merchantId" @onChange="onSearchSubmit"></SelectVendorMerchant>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>创建时间：</span></label>
                                        <SelectTimeInterval
                                            v-model:end-date="filterParams.endTime"
                                            v-model:start-date="filterParams.startTime"
                                            :clearable="false"
                                            type="date"
                                            value-format="YYYY-MM-DD"
                                        ></SelectTimeInterval>
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
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table
                            :data="filterState"
                            row-key="shopId"
                            :total="total"
                            @sort-change="onSortChange"
                            :loading="loading"
                        >
                            <el-table-column label="序号" :width="55">
                                <template #default="{ row, $index }">
                                    {{ $index + 1 }}
                                </template>
                            </el-table-column>
                            <el-table-column label="店铺名称" prop="shopTitle" :min-width="150">
                                <template #default="{ row }">
                                    <div style="position: relative">
                                        <div>{{ row.shopTitle || "--" }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="店铺LOGO" prop="shopTitle" :min-width="150">
                                <template #default="{ row }">
                                    <Image v-if="row.shopLogo" :src="imageFormat(row.shopLogo)" fit="contain" style="height: 25px; width: 60px" />
                                    <span v-else>暂无图片</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="商户名称" prop="merchantName" :min-width="150">
                                <template #default="{ row }">
                                    <div style="position: relative">
                                        <div>{{ row.merchantName || "--" }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="上架商品数" prop="upProductCount" width="150" sortable="custom"> </el-table-column>
                            <el-table-column label="下架商品数" prop="downProductCount" width="150" sortable="custom"> </el-table-column>
                            <el-table-column label="订单量" prop="orderCount" width="150" sortable="custom"> </el-table-column>
                            <el-table-column label="结算金额" prop="orderAmount" width="150" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.orderAmount || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" :width="170">
                                <template #default="{ row }">
                                    <DialogForm
                                        isDrawer
                                        @okCallback="loadFilter"
                                        title="查看订单"
                                        width="850px"
                                        path="vendor/supplier/bindShop/Order"
                                        :params="{ shopId: row.shopId }"
                                    >
                                        <a class="btn-link">查看订单</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" /> 
                                    <DialogForm
                                        isDrawer
                                        @okCallback="loadFilter"
                                        title="查看商品"
                                        width="850px"
                                        path="vendor/supplier/bindShop/Product"
                                        :params="{ shopId: row.shopId }"
                                    >
                                        <a class="btn-link">查看商品</a>
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
import { Image } from "@/components/image";
import { imageFormat } from "@/utils/format";
import { SelectVendorMerchant, SelectTimeInterval, SelectVendorShop } from "@/components/select";
import { DialogForm } from "@/components/dialog";
import { PopForm } from "@/components/pop-form";
import { ref, reactive, onMounted } from "vue";
import { DeleteRecord, Switch, Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { FilterState, FilterParams } from "@/types/vendor/bindShop.d";
import { getvendorShopBindList } from "@/api/vendor/bindShop";
import { useListRequest } from "@/hooks/useListRequest";
const config: any = useConfigStore();
const {
    listData: filterState,
    loading,
    total,
    filterParams,
    loadData: loadFilter,
    onSearchSubmit,
    onSortChange,
    resetParams
} = useListRequest<FilterState, FilterParams>({
    apiFunction: getvendorShopBindList,
    idKey: "shopId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        keyword: "",
        merchantId: "",
        shopId: "",
        endTime: "",
        startTime: "",
    }
});

// 初始化加载
loadFilter();
</script>
<style></style>
