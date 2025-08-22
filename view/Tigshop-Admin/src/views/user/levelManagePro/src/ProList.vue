<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp mb10">
                    <el-form :model="filterParams">
                        <div class="list-table-tool-row">
                            <div class="list-table-tool-col">
                                <div class="simple-form-field">
                                    <div class="form-group">
                                        <DialogForm
                                            :params="{ act: 'detail' }"
                                            isDrawer
                                            path="user/levelManagePro/Info"
                                            title="编辑会员方案"
                                            width="1100px"
                                            @okCallback="loadFilter"
                                        >
                                            <el-button type="primary">编辑会员方案</el-button>
                                        </DialogForm>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-form>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table :data="filterState" :loading="loading" row-key="userId">
                            <el-table-column :width="100" label="等级" prop="level">
                                <template #default="{ row }">
                                    <div class="level_txt">vip{{ row.rankLevel }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="会员图标" prop="level">
                                <template #default="{ row }">
                                    <el-image style="height: 20px" :src="row.rankLogo" />
                                </template>
                            </el-table-column>
                            <el-table-column :width="100" label="会员名称" prop="rankName"></el-table-column>
                            <el-table-column :width="200" label="会员卡面" prop="card">
                                <template #default="{ row }">
                                    <div
                                        v-if="row.rankBg !== '' && row.rankCardType == 2"
                                        class="card_item"
                                        :style="{ backgroundImage: 'url(' + row.rankBg + ')' }"
                                    ></div>
                                    <div v-else class="card_item" :class="row.rankIco"></div>
                                </template>
                            </el-table-column>
                            <el-table-column label="升级条件" prop="rankName">
                                <template #default="{ row }">
                                    <div class="rank-container">
                                        <div v-if="row.minGrowthPoints == 0">无门槛</div>
                                        <div v-if="row.rankType == 1 && row.minGrowthPoints > 0" class="text">{{ row.minGrowthPoints }}成长值</div>
                                        <div v-if="row.rankType == 2 && row.minGrowthPoints > 0" class="text">消费满{{ row.minGrowthPoints }}元</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="会员权益" prop="isCompanyAuth">
                                <template #default="{ row }">
                                    <div v-if="row.discount != '' && Number(row.discount) > 0">会员折扣{{ row.discount }}折</div>
                                    <div v-if="row.rankPoint != '' && Number(row.rankPoint) > 0">{{ row.rankPoint }}倍会员积分</div>
                                    <div v-if="row.freeShipping == 1">享受会员包邮</div>
                                    <div v-for="(item, index) in row.rights">
                                        <div v-if="item.isChecked == 1">{{ item.name }}</div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="保级规则" prop="userCount">
                                <template #default="{ row, $index }">
                                    <div v-if="$index === 0">不降级</div>
                                    <div v-else>
                                        <div v-if="rankConfig.data.type == 1">永久有效</div>
                                        <div v-if="rankConfig.data.type == 2">
                                            <span v-if="row.rankType == 1"
                                            >获得等级的{{ rankConfig.data.rankAftermonth }}个月内，成长值达到{{ row.minGrowthPoints }}可保级</span
                                            >
                                            <span v-if="row.rankType == 2"
                                            >获得等级的{{ rankConfig.data.rankAfterMonth }}个月内，消费满{{ row.minGrowthPoints }}元可保级</span
                                            >
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="会员数" prop="userCount">
                                <template #default="{ row }">
                                    <div>{{ row.userCount }}</div>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <div class="empty-warp">
                                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                                </div>
                            </template>
                        </el-table>
                    </a-spin>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "./card.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { UserFilterParams, UserFilterState } from "@/types/user/levelManage.d";
import { getUserRankListPro } from "@/api/user/levelManage";
import { imageFormat } from "@/utils/format";

const config: any = useConfigStore();
// 基本参数定义
const filterState = ref(<UserFilterState[]>[]);
const rankConfig = ref<any>({});
const loading = ref<boolean>(true);
const filterParams = reactive<UserFilterParams>({
    //初使化用于查询的参数
    page: 1,
    size: config.get("pageSize"),
    sortField: "",
    sortOrder: "",
    rankName: ""
});
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getUserRankListPro({ ...filterParams });
        filterState.value = result.userRank.records;
        rankConfig.value = result.rankConfig;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    loadFilter();
});
</script>
<style lang="less" scoped>
.level_txt {
    font-weight: 600;
    color: #c95a0a;
    font-size: 14px;
}
.avatar-info {
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 0 8px;
    align-items: center;
    gap: 14px;

    .info {
        display: flex;
        flex-direction: column;
    }
}

.rank-container {
    display: flex;
    align-items: center; /* 垂直居中 */

    .image {
        width: 18px;
        height: 18px;
    }

    .text {
        margin-left: 3px;
    }
}
.card_item {
    border: 1px solid #fff;
    border-radius: 3px;
    width: 56px;
    height: 30px;
    overflow: visible;
    background-repeat: no-repeat;
    background-position: 0% 0%;
    background-size: cover;
}
</style>
