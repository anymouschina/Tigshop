<template>
    <div class="app-layout-m_sub-page-content_1Le52">

        <div class="servicehistory-filter-wrap">
            <div class="filter-table">
                <div class="table-item">
                    <el-space>
                        <div class="input-item">
                            <label>时间筛选</label>
                            <el-select v-model="filterParams.timeType" style="width: 160px">
                                <el-option label="会话开始时间" :value="1" />
                                <el-option label="排队开始时间" :value="2" />
                            </el-select>
                            <SelectTimeInterval value-format="YYYY-MM-DD HH:mm:ss" v-model:start-date="filterParams.startTime" v-model:end-date="filterParams.endTime"></SelectTimeInterval>
                            <SelectableGroup :options="fastTimeOptions" v-model="fastTime">
                            </SelectableGroup>
                        </div>
                    </el-space>
                </div>
                <div class="table-item">
                    <el-space>
                        <div class="input-item">
                            <label>客户姓名</label>
                            <TigInput v-model="filterParams.username" width="160px"></TigInput>
                        </div>
                        <div class="input-item">
                            <label>接待客服</label>
                            <SelectServant v-model="filterParams.lastServantId" style="width: 160px"></SelectServant>
                        </div>
                        <div class="input-item">
                            <label>会话来源</label>
                            <el-select v-model="filterParams.userFrom" style="width: 160px">
                                <el-option label="全部" value="" />
                                <el-option label="pc" value="pc" />
                                <el-option label="h5" value="h5" />
                            </el-select>
                        </div>
                    </el-space>
                </div>
                <div class="table-item">
                    <el-space>
                        <div class="input-item">
                            <label>会话状态</label>
                            <el-select v-model="filterParams.status" style="width: 160px">
                                <el-option label="全部" value="" />
                                <el-option label="会话中" value="1" />
                                <el-option label="已结束" value="2" />
                            </el-select>
                        </div>
                        <div class="input-item">
                            <label>会话备注</label>
                            <TigInput v-model="filterParams.remark" width="160px"></TigInput>
                        </div>
                    </el-space>
                </div>
                <div class="table-item">
                    <el-space>
                        <div class="input-item">
                            <label></label>
                            <el-button @click="loadFilter" type="primary">筛选</el-button>
                            <el-button @click="resetClick" >重置</el-button>
                        </div>
                    </el-space>
                </div>
            </div>
        </div>

        <el-table
            :data="filterState"
            :loading="loading"
            :total="total">
            <el-table-column label="客户名称">
                <template #default="{ row }">
                    {{ row.user?.nickname ? row.user?.nickname : row.user?.username }}
                </template>
            </el-table-column>
            <el-table-column label="接待客服">
                <template #default="{ row }">
                    {{ row.servant?.username }}
                </template>
            </el-table-column>
            <el-table-column prop="userFrom" label="会话来源"></el-table-column>
            <el-table-column prop="addTime" label="开始时间"></el-table-column>
            <el-table-column label="最后会话时间" prop="lastUpdateTime"></el-table-column>
            <el-table-column :width="100" fixed="right" label="操作">
                <template #default="{ row }">
                    <DialogForm
                        :params="{ id: row.id,currentConversationData:row }"
                        isDrawer
                        :showClose="false"
                        :showOnOk="false"

                        path="im/src/HistoryInfo"
                        title="会话详情" >
                        <a class="btn-link">查看详情</a>
                    </DialogForm>
                </template>
            </el-table-column>
            <template #empty>
                <div class="empty-warp">
                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                </div>
            </template>
        </el-table>
        <div v-if="total > 0" class="pagination-con">
            <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total" @callback="loadFilter" />
        </div>
    </div>
</template>
<script setup lang="ts">
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref, watch } from "vue";
import { SelectTimeInterval } from "@/components/select";
import SelectableGroup from "@/components/form/src/SelectableGroup.vue";
import dayjs from "dayjs";
import { useConfigStore } from "@/store/config";
import { message } from "ant-design-vue";
import type { SearchInfoList } from "@/types/im/im.d";
import { getConsultHistory } from "@/api/im/conversation";
import SelectServant from "@/components/select/src/SelectServant.vue";
import HistoryInfo from "@/views/im/src/HistoryInfo.vue";
import { DeleteRecord, Pagination } from "@/components/list";
import { delBrand } from "@/api/product/brand";

function getStartEndTime(s: any) {
    const n = dayjs(), o: any = { 1: [0, "day"], 2: [-1, "day"], 3: [-6, "day"], 4: [-29, "day"], 5: [-1, "year"] };
    if (!o[s]) throw new Error("无效的时间选项");
    const [t, u] = o[s], st = n.add(t, u).startOf("day").format("YYYY-MM-DD HH:mm:ss"), et = n.endOf("day").format("YYYY-MM-DD HH:mm:ss");
    return { startTime: st, endTime: et };
}


const config: any = useConfigStore();
// 基本参数定义
const filterState = ref<SearchInfoList[]>([]);
const loading = ref<boolean>(true);
const total = ref<number>(0);
const filterParams = reactive({
    //初使化用于查询的参数
    page: 1,
    size: config.get("pageSize"),
    timeType: 1,
    startTime: "",
    endTime: "",
    username: "",
    lastServantId: "",
    userFrom: "",
    status: "",
    remark: ""
});

// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const cleanedParams = cleanParams(filterParams);
        const result = await getConsultHistory({ ...cleanedParams });
        filterState.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

// 清理函数，用于删除值为空的键
function cleanParams(params: any) {
    return Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== null && value !== "" && value !== undefined)
    );
}
const resetClick = () => {
    filterParams.page = 1;
    filterParams.size = config.get("pageSize");
    filterParams.timeType = 1;
    filterParams.startTime = "";
    filterParams.endTime = "";
    filterParams.username = "";
    filterParams.lastServantId = "";
    filterParams.userFrom = "";
    filterParams.status = "";
    filterParams.remark = "";
    fastTime.value = null; 
    loadFilter();
};
onMounted(() => {
    loadFilter();
});
const fastTime = ref<number | null>(null);
const fastTimeOptions = ref([
    { value: 1, label: "今" },
    { value: 2, label: "昨" },
    { value: 3, label: "近7天" },
    { value: 4, label: "近30天" },
    { value: 5, label: "近一年" }
]);
//监听fastTime变化，当fastTime变化的时候，根据fastTimeOptions里面的值，根据当前时间获取开始时间和结束时间
watch(fastTime, (newValue, oldValue) => {
    if (!newValue) return; 
    let { startTime, endTime } = getStartEndTime(newValue);
    filterParams.startTime = startTime;
    filterParams.endTime = endTime;
    loadFilter();
}, { immediate: true });

</script>
<style lang="less" scoped>
.app-layout-m_sub-page-content_1Le52 {
    height: 100vh;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;
    padding: 20px;

    .servicehistory-filter-wrap {
        background-color: #f8f8f8;
        //margin: 20px;

        .filter-table {
            margin-bottom: 20px;
            padding: 25px 0 20px;
            font-size: 12px;
            gap: 20px;
            display: flex;
            flex-direction: column;

            .table-item {
                padding: 0 20px;

                .input-item {
                    display: flex;
                    gap: 10px;

                    label {
                        width: 84px;
                        display: inline-block;
                        font-size: 14px;
                        line-height: 30px;
                        text-align: right;
                        vertical-align: top;
                    }
                }
            }
        }
    }
    .tg-table{
        display: flex;
        flex-direction: column;
        .tg-header{

        }
    }

}

</style>
