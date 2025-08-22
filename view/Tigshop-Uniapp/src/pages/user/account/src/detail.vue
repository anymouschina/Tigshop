<template>
    <view v-if="filterState.length > 0" class="log-main">
        <block v-for="(item, index) in filterState" :key="index">
            <view class="item">
                <view class="tit">{{ item.changeTypeName }}</view>
                <view class="time">{{ item.changeTime }}</view>
                <view class="desc">{{ item.changeDesc }}</view>
                <view class="real_total">
                    <text v-if="item.changeTypeName === '增加'">+</text>
                    <text v-else>-</text>
                    <text>{{ item.balance }}</text>
                </view>
            </view>
        </block>
    </view>
    <view v-if="filterState.length === 0 && loadend === true" class="empty-box">
        <view class="pictrue"><image :src="staticResource('common/data_empty.png')" /></view>
        <view class="txt">{{ $t("暂无数据") }}</view>
    </view>
    <loading-box v-model="loaded" :page="filterParams.page" :length="filterState.length" />
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { onReachBottom } from "@dcloudio/uni-app";
import { getAccountList } from "@/api/user/account";
import type { AccountFilterParams, AccountDetailFilterState } from "@/types/user/account";
import { staticResource } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const activeTab = defineModel("activeTab");

const total = ref(0);
const loaded = ref(false);
const loadend = ref(false);
const filterParams = reactive<AccountFilterParams>({
    //初使化用于查询的参数
    page: 1,
    size: 10,
    status: 1
});
const filterState = ref<AccountDetailFilterState[]>([]);
const __detail = async () => {
    if (filterParams.page > 1) {
        loaded.value = true;
    } else {
        uni.showLoading({
            title: t("加载中")
        });
    }
    try {
        const result = await getAccountList({ ...filterParams });
        total.value = result.total;
        filterState.value = [...filterState.value, ...result.records];
    } catch (error: any) {
        console.error(error);
    } finally {
        uni.hideLoading();
        loaded.value = false;
        loadend.value = true;
    }
};

__detail();

onReachBottom(() => {
    if (activeTab.value && activeTab.value === "detail" && filterParams.page < Math.ceil(total.value / filterParams.size)) {
        filterParams.page++;
        __detail();
    }
});
</script>
<style lang="scss" scoped>
.log-main {
    margin-top: 40rpx;
    .item {
        position: relative;
        padding: 40rpx;
        margin: 0 20rpx;
        background: #fff;
        border-radius: 18rpx;
        margin-bottom: 20rpx;
        .tit {
            font-size: 28rpx;
            color: #333;
            padding-bottom: 10rpx;
            padding-right: 200rpx;
        }
        .time,
        .desc {
            color: #999;
            position: relative;
            font-size: 24rpx;
            padding-top: 10rpx;
        }

        .real_total {
            font-size: 32rpx;
            color: var(--general);
            font-weight: bold;
            position: absolute;
            right: 40rpx;
            top: 50%;
            transform: translateY(-50%);
        }
        .actions {
            margin-top: 10rpx;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #999;
            .txt {
                flex: 1 1 auto;
                font-size: 22rpx;
                padding-right: 20rpx;
            }
            .status {
                flex-shrink: 0;
                font-size: 24rpx;
            }
        }
    }
}
</style>
