<template>
    <div>
        <div class="list-table-tool lyecs-search-warp">
            <div class="notice-warp">
                <p class="flex flex-justify-between">
                    <span>当前会员：{{ formState.username }}</span>
                    <span>可用资金帐户：{{ priceFormat(formState.balance) }}</span>
                    <span>冻结资金帐户：{{ priceFormat(formState.frozenBalance) }}</span>
                    <span>成长积分帐户：{{ formState.growthPoints }}</span>
                    <span>消费积分帐户：{{ formState.points }}</span>
                </p>
            </div>
            <el-form :model="filterParams">
                <div class="list-table-tool-row">
                    <div class="list-table-tool-col">
                        <el-space>
                            <el-select v-model="filterParams.fromTag" clearable @change="onSearchSubmit">
                                <el-option :value="1" label="可用资金账户" />
                                <el-option :value="2" label="冻结资金账户" />
                                <el-option :value="3" label="成长积分账户" />
                                <el-option :value="4" label="消费积分账户" />
                            </el-select>
                            <TigInput
                                v-model="filterParams.keyword"
                                name="keyword"
                                placeholder="输入账户变动原因"
                                @keyup.enter="onSearchSubmit"
                                clearable
                                @clear="onSearchSubmit"
                            >
                                <template #append>
                                    <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span> </el-button>
                                </template>
                            </TigInput>
                        </el-space>
                    </div>
                    <div class="list-table-tool-col">
                        <DialogForm
                            :params="{ act: 'detail', id: id }"
                            isDrawer
                            path="user/user/EditAccount"
                            title="调节会员帐户"
                            width="600px"
                            @okCallback="loadFilter"
                        >
                            <el-button>调节会员账户</el-button>
                        </DialogForm>
                    </div>
                </div>
            </el-form>
        </div>
        <div class="table-container">
            <a-spin :spinning="loading">
                <el-table :data="filterState" :loading="loading" :total="total" row-key="logId" @sort-change="onSortChange">
                    <el-table-column label="变动时间" prop="changeTime" sortable="custom">
                        <template #default="{ row }">
                            <ul>
                                <li>{{ row.changeTime }}</li>
                            </ul>
                        </template>
                    </el-table-column>
                    <el-table-column label="变动原因" prop="regTime">
                        <template #default="{ row }">
                            <ul>
                                <li>{{ row.changeDesc }}</li>
                            </ul>
                        </template>
                    </el-table-column>
                    <el-table-column label="可用资金" prop="balance">
                        <template #default="{ row }">
                            <div v-if="row.balance > 0">
                                <span v-if="row.changeType === 1" style="color: #0000ff">+{{ row.balance }}</span>
                                <span v-else-if="row.changeType === 2" style="color: #ff0000">-{{ row.balance }}</span>
                                <span v-else>{{ row.balance }}</span>
                            </div>
                            <div v-else>0.00</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="冻结资金" prop="frozenBalance">
                        <template #default="{ row }">
                            <div v-if="row.frozenBalance > 0">
                                <span v-if="row.changeType === 1" style="color: #0000ff">+{{ row.frozenBalance }}</span>
                                <span v-else-if="row.changeType === 2" style="color: #ff0000">-{{ row.frozenBalance }}</span>
                                <span v-else>{{ row.frozenBalance }}</span>
                            </div>
                            <div v-else>0.00</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="成长积分" prop="points">
                        <template #default="{ row }">
                            <div v-if="filterParams.fromTag == 3">
                                <span v-if="row.changeType === 1" style="color: #0000ff">+{{ row.points }}</span>
                                <span v-else-if="row.changeType === 2" style="color: #ff0000">-{{ row.points }}</span>
                                <span v-else>{{ row.points }}</span>
                            </div>
                            <div v-else>0.00</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="消费积分" prop="points">
                        <template #default="{ row }">
                            <div v-if="filterParams.fromTag == 4">
                                <span v-if="row.changeType === 1" style="color: #0000ff">+{{ row.points }}</span>
                                <span v-else-if="row.changeType === 2" style="color: #ff0000">-{{ row.points }}</span>
                                <span v-else>{{ row.points }}</span>
                            </div>
                            <div v-else>0.00</div>
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
                    <el-popconfirm title="您确认要批量删除所选数据吗？" @confirm="onBatchSubmit('del')">
                        <template #reference>
                            <el-button>批量删除</el-button>
                        </template>
                    </el-popconfirm>
                </el-space>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref } from "vue";
import { Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { UserFilterParams, UserFormState, UserFundList } from "@/types/user/user.d";
import { getUser, getUserFundList } from "@/api/user/user";
import { useRouter } from "vue-router";
import { priceFormat } from "@/utils/format";

const config: any = useConfigStore();

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    type: {
        type: Number,
        default: 1
    },
    isDialog: Boolean
});
const query = useRouter().currentRoute.value.query;
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const type = ref<number>(props.isDialog ? props.type : Number(query.type));
// 基本参数定义
const filterState = ref(<UserFundList[]>[]);
const loading = ref<boolean>(true);
const total = ref<number>(0);
const filter = ref<any>({});
const selectedIds = ref<number[]>([]);
const filterParams = reactive<UserFilterParams>({
    //初使化用于查询的参数
    page: 1,
    size: config.get("pageSize"),
    keyword: "",
    fromTag: type.value
});
const formState = ref<UserFormState>({
    balance: 0,
    frozenBalance: 0,
    avatar: ""
});
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getUserFundList({ userId: id.value, ...filterParams });
        filterState.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

const fetchUser = async () => {
    try {
        const result = await getUser("detail", { id: id.value });
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
// 修改排序
const onSortChange = ({ prop, order }: { prop: string; order?: string }) => {
    filterParams.sortField = prop;
    filterParams.sortOrder = order == "ascending" ? "asc" : order == "descending" ? "desc" : "";
    loadFilter();
};
onMounted(() => {
    loadFilter();
    fetchUser();
});

// 参数查询
const onSearchSubmit = () => {
    loadFilter();
};
const onBatchSubmit = (str: string) => {};
</script>
<style lang="less" scoped>
.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}
</style>
