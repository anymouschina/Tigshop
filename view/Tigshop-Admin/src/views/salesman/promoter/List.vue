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
                                        <label class="control-label"><span>分销员：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.mobile"
                                                name="mobile"
                                                placeholder="输入分销员手机号"
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
                                        <label class="control-label"><span>加入时间：</span></label>
                                        <div class="flex flex-align-center">
                                            <SelectTimeInterval
                                                type="date"
                                                v-model:start-date="filterParams.addTimeStart"
                                                v-model:end-date="filterParams.addTimeEnd"
                                                @callback="changeDateType(-1)"
                                            ></SelectTimeInterval>
                                            <div style="margin-left: 10px">
                                                <el-radio-group class="itemWidth" v-model="dateType" @change="changeDateType">
                                                    <el-radio-button :value="0">今天</el-radio-button>
                                                    <el-radio-button :value="1">昨天</el-radio-button>
                                                    <el-radio-button :value="2">近7天</el-radio-button>
                                                    <el-radio-button :value="3">近30天</el-radio-button>
                                                    <el-radio-button :value="4">近半年</el-radio-button>
                                                </el-radio-group>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>邀请方：</span></label>
                                        <div class="control-container">
                                            <TigInput
                                                v-model="filterParams.pidMobile"
                                                name="pidMobile"
                                                placeholder="请输入手机号"
                                                @keyup.enter="onSearchSubmit"
                                                clearable
                                                @clear="onSearchSubmit"
                                            ></TigInput>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>分组：</span></label>
                                        <div class="control-container">
                                            <SelectSalesmanGroup v-model:groupId="filterParams.groupId" @onChange="onSearchSubmit"></SelectSalesmanGroup>
                                        </div>
                                    </div>
                                </div>
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <label class="control-label"><span>等级：</span></label>
                                        <div class="control-container">
                                            <SelectPromoteMode v-model:level="filterParams.level" @onChange="onSearchSubmit"></SelectPromoteMode>
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
                            <div class="simple-form-warp">
                                <div class="simple-form-field">
                                    <DialogForm
                                        :params="{ act: 'add' }"
                                        isDrawer
                                        path="salesman/promoter/Info"
                                        title="添加分销员"
                                        width="550px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">添加分销员</el-button>
                                    </DialogForm>
                                </div>
                            </div>
                        </div>
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :total="total" row-key="salesmanId" @selection-change="onSelectChange" @sort-change="onSortChange">
                            <!-- <el-table-column type="selection" width="32" fixed="left"/> -->
                            <el-table-column label="昵称" prop="salesmanId" :width="140" fixed="left">
                                <template #default="{ row }">
                                    {{ row.baseUserInfo?.nickname || row.baseUserInfo?.username }}
                                </template>
                            </el-table-column>
                            <el-table-column label="手机号" :width="140" fixed="left">
                                <template #default="{ row }">
                                    {{ row.baseUserInfo?.mobile || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="等级">
                                <template #default="{ row }">
                                    {{ row.levelText || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="分组">
                                <template #default="{ row }">
                                    {{ row.groupInfo?.groupName || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="邀请方">
                                <template #default="{ row }">
                                    {{ row.pidUserInfo?.baseUserInfo?.nickname || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="累计客户数">
                                <template #default="{ row }">
                                    <DialogForm
                                        v-if="row.totalCustomer"
                                        :showClose="false"
                                        :showOnOk="false"
                                        :maskClose="false"
                                        :params="{ act: 'detail', id: row.salesmanId }"
                                        isDrawer
                                        path="salesman/promoter/UserList"
                                        title="客户数量"
                                        width="700px"
                                        @okCallback="loadFilter"
                                    >
                                        <a class="btn-link">{{ row.totalCustomer }}</a>
                                    </DialogForm>
                                    <span v-else> -- </span>
                                </template>
                            </el-table-column>
                            <el-table-column label="累计销售额(元)" sortable="custom" :width="160">
                                <template #default="{ row }">
                                    {{ priceFormat(row.saleAmount) }}
                                </template>
                            </el-table-column>
                            <!-- <el-table-column label="累计佣金(元)" sortable="custom" :width="140">
                                <template #default="{ row }">
                                    11
                                </template>
                            </el-table-column>
                            <el-table-column label="累计客户数" sortable="custom">
                                <template #default="{ row }">
                                    11
                                </template>
                            </el-table-column>
                            <el-table-column label="累计邀请数" sortable="custom">
                                <template #default="{ row }">
                                    11
                                </template>
                            </el-table-column> -->
                            <el-table-column label="加入时间" sortable="custom">
                                <template #default="{ row }">
                                    {{ row.addTime }}
                                </template>
                            </el-table-column>
                            <el-table-column :width="120" fixed="right" label="操作">
                                <template #default="{ row }">
                                    <el-space :size="0">
                                        <DialogForm
                                            :maskClose="false"
                                            :showClose="false"
                                            :showOnOk="false"
                                            :params="{ act: 'detail', id: row.salesmanId }"
                                            dialogClass="noPadding"
                                            isDrawer
                                            path="salesman/promoter/Detail"
                                            title="分销员详情"
                                            width="900px"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">详情</a>
                                        </DialogForm>
                                        <el-divider direction="vertical" />
                                        <DialogForm
                                            :maskClose="false"
                                            :params="{ act: 'detail', id: row.salesmanId }"
                                            isDrawer
                                            path="salesman/promoter/Info"
                                            title="编辑分销员"
                                            width="550px"
                                            @okCallback="loadFilter"
                                        >
                                            <a class="btn-link">编辑</a>
                                        </DialogForm>
                                        <!-- <el-divider direction="vertical" />
                                        <DialogForm
                                            :maskClose="false"
                                            :params="{ act: 'detail', id: row.salesmanId }"
                                            dialogClass="noPadding"
                                            :isDrawer="false"
                                            path="salesman/promoter/Clearance"
                                            title="清退分销员"
                                            width="600px"
                                            @okCallback="loadFilter">
                                            <a class="btn-link">清退</a>
                                        </DialogForm> -->
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
                <div v-if="selectedIds.length > 0" class="selected-action-warp selected-warp-left">
                    <div class="selected-action">
                        <el-space>
                            <span
                                >已选择：<b>{{ selectedIds.length }}</b> 项</span
                            >
                            <el-button>设置等级</el-button>
                            <el-button>分组</el-button>
                            <el-button>清退</el-button>
                        </el-space>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { SelectTimeInterval } from "@/components/select";
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref } from "vue";
import { Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { promoterFilterParams, promoterFilterState } from "@/types/salesman/promoter.d";
import { batchSubmit, getsalesmanList } from "@/api/salesman/promoter";
import { SelectSalesmanGroup, SelectPromoteMode } from "@/components/select";
import { priceFormat } from "@/utils/format";
import { formattedDate } from "@/utils/time";
import { getDays } from "@/utils/util";
const config: any = useConfigStore();
import { useListRequest } from "@/hooks/useListRequest";
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
} = useListRequest<promoterFilterState, promoterFilterParams>({
    apiFunction: getsalesmanList,
    idKey: "salesmanId",
    defaultParams: {
        page: 1,
        size: config.get("pageSize"),
        sortField: "",
        sortOrder: "",
        mobile: "",
        pidMobile: "",
        level: "",
        groupId: "",
        addTimeStart: "",
        addTimeEnd: ""
    }
});
// 批量操作
const onBatchSubmit = async (action: string) => {
    await onBatchAction(action, batchSubmit);
};
// 初始化加载
loadFilter();
const dateType = ref(-1);
const changeDateType = (event: number) => {
    if (event === -1) {
        dateType.value = event;
        return;
    }
    filterParams.addTimeStart = formattedDate(new Date(), "YYYY-MM-DD");
    if (event === 0) {
        //今天
        filterParams.addTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    if (event === 1) {
        //昨天
        filterParams.addTimeStart = formattedDate(getDays(1, "sub"), "YYYY-MM-DD");
        filterParams.addTimeEnd = formattedDate(getDays(1, "sub"), "YYYY-MM-DD");
    }
    if (event === 2) {
        //近七天
        filterParams.addTimeStart = formattedDate(getDays(7, "sub"), "YYYY-MM-DD");
        filterParams.addTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    if (event === 3) {
        //近30天
        filterParams.addTimeStart = formattedDate(getDays(30, "sub"), "YYYY-MM-DD");
        filterParams.addTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    if (event === 4) {
        //近半年
        filterParams.addTimeStart = formattedDate(getDays(180, "sub"), "YYYY-MM-DD");
        filterParams.addTimeEnd = formattedDate(new Date(), "YYYY-MM-DD");
    }
    loadFilter();
};
</script>
<style lang="less" scoped>
.list-table-tool {
    margin-bottom: 0;
}
</style>
