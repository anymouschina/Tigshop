<template>
    <tig-layout title="资金管理">
        <view class="top-card">
            <view class="balance-row"> {{ $t("可用余额") }} </view>
            <view class="amount-row">
                <format-price
                    :show-text="false"
                    :price-data="formState.balance"
                    :decimals-style="{
                        fontSize: '40rpx',
                        fontWeight: 'bold'
                    }"
                    :currency-style="{
                        fontSize: '38rpx',
                        fontWeight: 'bold'
                    }"
                />
            </view>
            <view class="button-row">
                <view class="round-button" :class="{ active: activeTab === 'deposit' }" @click="actionClick('deposit')">{{ $t("充值") }}</view>
                <view class="round-button" :class="{ active: activeTab === 'raplytocard' }" @click="actionClick('raplytocard')">{{ $t("提现") }}</view>
            </view>
        </view>
        <view v-if="activeTab === 'detail' || activeTab === 'log'" class="custom-tabs">
            <view v-for="(tab, index) in tabs" :key="index" :class="{ 'active-tab': activeTab === tab.action }" class="tab" @click="actionClick(tab.action)">
                <view>{{ $t(tab.title) }}</view>
            </view>
        </view>

        <view v-show="activeTab === 'detail'">
            <detail v-model:active-tab="activeTab" />
        </view>

        <view v-show="activeTab === 'log'">
            <log v-model:active-tab="activeTab" />
        </view>

        <block v-if="activeTab === 'deposit'">
            <deposit @back-detail="backDetail" />
        </block>

        <block v-if="activeTab === 'raplytocard'">
            <raplyToCard :balance="formState.balance" @back-detail="backDetail" />
        </block>
    </tig-layout>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import detail from "@/pages/user/account/src/detail.vue";
import log from "@/pages/user/account/src/log.vue";
import deposit from "@/pages/user/account/src/deposit.vue";
import raplyToCard from "@/pages/user/account/src/raplyToCard.vue";
import { onLoad } from "@dcloudio/uni-app";
import { getUser } from "@/api/user/user";
import type { UserItem } from "@/types/user/user";

const formState = ref<UserItem>({} as UserItem);

const __getUser = async () => {
    try {
        const result = await getUser();
        Object.assign(formState.value, result);
    } catch (error: any) {
        console.error(error.message);
    }
};

const tabs = [
    { title: "账户明细", action: "detail" },
    { title: "申请记录", action: "log" }
];

const activeTab = ref("detail");

const actionClick = (value: string) => {
    if (value === activeTab.value) return;
    activeTab.value = value;
};

const backDetail = () => {
    activeTab.value = "detail";
};

onLoad(() => {
    __getUser();
});
</script>
<style lang="scss" scoped>
.top-card {
    background: var(--general);
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 10rpx;
    margin: 20rpx;
    color: #fff;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 60rpx;

    .balance-row,
    .amount-row,
    .button-row {
        text-align: center;
        margin: 20rpx 20rpx 0;
    }

    .balance-row {
        font-size: 36rpx;
    }

    .amount-row {
        font-size: 52rpx;
        font-weight: 400;
    }

    .button-row {
        display: flex;
        margin-top: 60rpx;
        justify-content: space-evenly;
        gap: 20rpx;
        height: 60rpx;

        .round-button {
            height: 60rpx;
            line-height: 60rpx;
            border-radius: 46rpx;
            flex: 1;
            border: 2rpx solid white;
            color: white;
            outline: none;
            font-size: 24rpx;
            background-color: var(--general);
            &.active {
                background-color: #fff;
                color: var(--general);
                font-weight: 700;
            }
        }
    }
}
.custom-tabs {
    display: flex;
    justify-content: center;
    flex-direction: row;
    gap: 80rpx;
    margin: 20rpx 30rpx;
    .tab {
        padding: 20rpx;
        width: 100%;
        font-size: 28rpx;
        border-bottom: none;
        color: black;
        text-align: center;
    }
    & .active-tab {
        position: relative;
        color: var(--general);
        &::before {
            content: "";
            position: absolute;
            width: 30%;
            height: 4rpx;
            background-color: var(--general);
            left: 50%;
            transform: translateX(-50%);
            bottom: 0;
        }
    }
}
</style>
