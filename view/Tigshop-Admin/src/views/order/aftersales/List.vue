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
                                        <label class="control-label"><span>订单号：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.keyword"
                                                name="keyword"
                                                placeholder="订单号"
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
                                        <label class="control-label"><span>申请类型：</span></label>
                                        <div class="control-container">
                                            <el-select v-model="filterParams.aftersaleType" clearable @change="onSearchSubmit">
                                                <el-option v-for="(item, index) in typeList" :value="index" :label="item" />
                                            </el-select>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>退换状态：</span></label>
                                        <div class="control-container">
                                            <el-select v-model="filterParams.status" clearable @change="onSearchSubmit">
                                                <el-option v-for="(item, index) in statusList" :value="index" :label="item" />
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
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>
                                        <SortButton
                                            v-model:sortField="filterParams.sortField"
                                            v-model:sortOrder="filterParams.sortOrder"
                                            sortName="orderId"
                                            text="退换货商品"
                                            @loadData="loadFilter()"
                                        ></SortButton>
                                    </th>
                                    <th>售后原因</th>
                                    <th>服务类型</th>
                                    <th>售后状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                        </table>
                        <table v-for="item in filterState" class="custom-table">
                            <thead>
                                <tr class="data-tr">
                                    <th colspan="4">
                                        <span class="check-box">订单编号：{{ item.orderSn }}</span>
                                        <el-divider direction="vertical" />
                                        <span class="check-box">售后编号：{{ item.aftersalesSn }}</span>
                                        <el-divider direction="vertical" />
                                        <span class="check-box">申请时间：{{ item.addTime }}</span>
                                        <el-divider direction="vertical" v-if="item.shippingTime" />
                                        <span class="check-box" v-if="item.userName">发货时间：{{ item.shippingTime }}</span>
                                        <el-divider direction="vertical" v-if="item.userName" />
                                        <span class="check-box" v-if="item.userName">申请人：{{ item.userName }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(product, index) in item.aftersalesItems">
                                    <td>
                                        <div class="displayRow flex-justify-between">
                                            <ProductCard :picThumb="product.picThumb" :productId="product.productId" :productName="product.productName">
                                            </ProductCard>
                                            <div class="displayColumn textR whiteSN widthAuto">
                                                <div>{{ priceFormat(product.price) }}</div>
                                                <div>
                                                    × {{ product.quantity }}<span class="red ml10">(退货数量：{{ product.number }})</span>
                                                </div>
                                                <div></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td v-if="index == 0" :rowspan="item.aftersalesItems.length">
                                        <p>{{ item.aftersaleReason || "-" }}</p>
                                    </td>
                                    <td v-if="index == 0" :rowspan="item.aftersalesItems.length">
                                        <span>
                                            {{ item.aftersalesTypeName }}
                                        </span>
                                    </td>
                                    <td v-if="index == 0" :rowspan="item.aftersalesItems.length">
                                        <span
                                            :class="{
                                                orange: item.status === 0,
                                                black: item.status === 1 || item.status === 2 || item.status === 4,
                                                gray: item.status === 3,
                                                green: item.status === 5
                                            }"
                                        >
                                            {{ item.statusName }}
                                        </span>
                                    </td>
                                    <td v-if="index == 0" :rowspan="item.aftersalesItems.length">
                                        <DialogForm
                                            v-if="item.status === 5 || item.status === 6 || item.status === 7"
                                            :params="{ act: 'detail', id: item.aftersaleId }"
                                            isDrawer
                                            path="order/aftersales/Info"
                                            :title="'售后详情 ' + item.aftersalesSn"
                                            width="800px"
                                            @okCallback="loadFilter"
                                            :showClose="false"
                                            :showOnOk="false"
                                        >
                                            <el-button size="small" text type="primary"> 售后详情 </el-button>
                                        </DialogForm>

                                        <DialogForm
                                            v-else
                                            :params="{ act: 'detail', id: item.aftersaleId }"
                                            isDrawer
                                            path="order/aftersales/Info"
                                            :title="'处理售后申请 ' + item.aftersalesSn"
                                            width="800px"
                                            @okCallback="loadFilter"
                                            :showClose="false"
                                            :showOnOk="false"
                                        >
                                            <el-button size="small" text type="danger"> 处理退款 </el-button>
                                        </DialogForm>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="loading || total == 0" class="empty-warp">
                            <div v-if="!loading" class="empty-bg">暂无数据</div>
                        </div>
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
import SortButton from "../../../components/list/src/SortButton.vue";
import { DialogForm } from "@/components/dialog";
import { PopForm } from "@/components/pop-form";
import { onMounted, reactive, ref } from "vue";
import { DeleteRecord, Pagination, ProductCard, Switch } from "@/components/list";
import { Image } from "@/components/image";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { AftersalesFilterParams, AftersalesFilterState } from "@/types/order/aftersales";
import { batchSubmit, getAftersalesList, updateAftersalesField, getAftersalesApplyType, getAftersalesReturnStatus } from "@/api/order/aftersales";
import { priceFormat } from "@/utils/format";
import { useRoute, useRouter } from "vue-router";
import { useListRequest } from "@/hooks/useListRequest";
const config: any = useConfigStore();
const {
    listData: filterState,
    loading,
    total,
    filterParams,
    loadData: loadFilter,
    onSearchSubmit,
    resetParams
} = useListRequest<AftersalesFilterState, AftersalesFilterParams>({
    apiFunction: getAftersalesList,
    idKey: "aftersaleId",
    defaultParams: {
        sortField: "",
        sortOrder: "",
        keyword: "",
        aftersaleType: "",
        status: "",
        page: 1,
        size: config.get("pageSize")
    }
});
loadFilter();
const statusList = ref<any>({});
const typeList = ref<any>({});
const query = useRouter().currentRoute.value.query;
// 获取列表的查询结果
const loadData = async () => {
    loading.value = true;
    try {
        const applyType = await getAftersalesApplyType();
        typeList.value = applyType;
        const returnStatusList = await getAftersalesReturnStatus();
        statusList.value = returnStatusList;
        if (query && query.status) {
            filterParams.status = query.status as any;
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    if (query && query.status) {
        filterParams.status = Number(query.status);
    }
    loadData();
});
</script>
<style lang="less" scoped>
.table-container {
    overflow: auto;
    .custom-table {
        width: 100%;
        margin-bottom: 20px;
        background-color: #f5f6fa;
        border: 1px solid #f0f0f0;
        border-collapse: collapse;
        height: 60px;

        thead,
        tbody {
            tr {
                height: 45px;
                border-top: 1px solid #f0f0f0; // 垂直分割线
                border-right: 1px solid #f0f0f0; // 垂直分割线
            }

            th,
            td {
                padding: 15px 12px;
                vertical-align: middle;
                border-bottom: 1px solid #f0f0f0; // 水平分割线

                &:first-child {
                    width: 30%; // 多选按钮的宽度
                    min-width: 230px;
                    border-left: 1px solid #f0f0f0; // 左侧分割线
                    text-align: start;
                }

                &:nth-child(2) {
                    min-width: 150px; // “”列宽度
                    width: 15%; // 多选按钮的宽度
                }

                &:nth-child(3) {
                    min-width: 150px; // “”列宽度
                    width: 10%; // 多选按钮的宽度
                }

                &:nth-child(4) {
                    min-width: 140px; // “”列宽度
                    width: 15%; // 多选按钮的宽度
                }

                &:nth-child(5) {
                    min-width: 110px; // “”列宽度
                    width: 10%; // 多选按钮的宽度
                }

                &:nth-child(6) {
                    min-width: 140px; // “”列宽度
                    width: 15%; // 多选按钮的宽度
                }
            }

            .data-tr {
                height: 45px;

                th {
                    font-weight: normal;
                }
            }

            td {
                background-color: white;
                border-right: 1px solid #f0f0f0; // 垂直分割线
            }
        }

        .check-box {
            vertical-align: middle;
        }

        .mr10 {
            margin-right: 10px;
        }

        .ml10 {
            margin-left: 10px;
        }

        .ml5 {
            margin-left: 5px;
        }

        .textR {
            text-align: right;
        }

        .textL {
            text-align: left;
        }

        .buttonColor {
            background-color: rgba(32, 96, 224, 0.03);
        }

        .displayRow {
            display: flex;
            flex-direction: row;
            gap: 8px;
        }

        .displayColumn {
            display: flex;
            flex-direction: column;
        }

        .orderImage {
            min-width: 50px;
            min-height: 50px;
            max-width: 50px;
            max-height: 50px;
            border: 1px solid #eee;
        }

        .productName {
            line-height: 1;
            word-wrap: break-word;
            font-size: 12px;
            color: #333333;
        }

        .whiteSN {
            white-space: nowrap;
        }

        .widthAuto {
            width: auto;
        }

        .buttonStyle {
            display: flex;
            flex-direction: row-reverse;
            flex-wrap: nowrap;
            /* 不允许换行 */
            gap: 8px;
        }
    }

    .fz12 {
        font-size: 12px;
    }

    .fz14 {
        font-size: 14px;
    }

    .black {
        color: #333333;
    }

    .orange {
        color: #ed6a0c;
    }

    .gray {
        color: #999999;
    }
}
</style>
