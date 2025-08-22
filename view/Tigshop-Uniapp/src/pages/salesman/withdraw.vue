<template>
    <!-- 提现 -->
    <tig-layout>
        <view class="withdraw__wrapper">
            <view class="withdraw-account">
                <view class="withdraw-account__main">
                    <view class="withdraw-account__label">{{ $t("到账账户") }}</view>
                    <view class="withdraw-account__content">
                        <view class="withdraw-account__account" @click="goPages('/pages/user/account/cardManagement/list')">
                            <text>{{ $t("请添加") }}</text>
                        </view>
                        <up-icon name="arrow-right" size="12" />
                    </view>
                </view>
            </view>
            <view class="withdraw-amount">
                <view class="withdraw-amount__header">{{ $t("提现金额") }}</view>
                <view class="withdraw-amount__main">
                    <view class="withdraw-amount__symbol">¥</view>
                    <!-- <input type="input" class="withdraw-amount__input"> -->
                    <up-input v-model="withdrawAmount" type="number" placeholder="" border="none" clearable font-size="36px" @change="amountChange" />
                </view>
                <block v-if="errorShow">
                    <view class="withdraw-amount__footer withdraw-amount__footer--invalid">
                        <view class="withdraw-amount__tips">{{ errorTxt }}</view>
                    </view>
                </block>
                <block v-else>
                    <view class="withdraw-amount__footer">
                        <up-icon name="info-circle" color="#44bb00" size="14" />
                        <view class="withdraw-amount__tips">{{ $t("可提现金额") }} {{ withdrawTotal }} {{ currencyName }}。</view>
                        <view class="withdraw-amount__all" @click="submitHandle">{{ $t("全部提现") }}</view>
                    </view>
                </block>
            </view>
            <view class="withdraw-button">
                <tig-button
                    :class="{ disabled: errorShow === true || withdrawAmount === undefined }"
                    style="width: 100%; background-color: #4b0 !important; border: 0; border-radius: 2px; height: 44px"
                    @click="toWithdraw"
                    >{{ $t("提现") }}</tig-button
                >
            </view>
            <view class="withdraw-links">
                <view class="withdraw-links__question" @click="goPages('/pages/salesman/withdrawHelp')">{{ $t("相关问题") }}</view>
                <view class="withdraw-links__divider" />
                <view class="withdraw-links__record" @click="goPages('/pages/salesman/withdrawRecordList')">{{ $t("提现记录") }}</view>
            </view>
        </view>
    </tig-layout>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useCurrency } from "@/hooks/useCurrency";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { currencyName } = useCurrency();

const withdrawTotal = ref("10.00");
const withdrawAmount = ref();
const errorShow = ref(false);
const errorNum = ref(0);
const errorTxt = computed(() => {
    switch (errorNum.value) {
        case 1:
            return t("最小提现金额为1元");
        case 2:
            return t("金额已超过可提现金额");
        default:
            return "";
    }
});
const amountChange = (value: any) => {
    if (Number(value) === 0) {
        errorShow.value = true;
        errorNum.value = 1;
    } else if (value > withdrawTotal.value) {
        errorShow.value = true;
        errorNum.value = 2;
    } else {
        errorShow.value = false;
        errorNum.value = 0;
    }
};
const submitHandle = () => {
    withdrawAmount.value = withdrawTotal.value;
    if (withdrawAmount.value > 1) {
        return;
    }
    if (typeof withdrawAmount.value === "undefined" || Number(withdrawAmount.value) < 1) {
        errorShow.value = true;
        errorNum.value = 1;
    }
};

const pay = ref<any>({
    id: 0,
    amount: 0,
    money: "",
    payType: "recharge"
});
const toWithdraw = () => {
    if (errorShow.value === true || withdrawAmount.value === undefined) return;
    pay.value.id = "1";
    pay.value.amount = null;
    pay.value.money = withdrawAmount.value;
    if (!pay.value.money) {
        return uni.showToast({
            title: t("请输入充值金额"),
            icon: "none"
        });
    }
    __updateRechargeOrder(pay.value);
};
const __updateRechargeOrder = async (data: object) => {
    uni.navigateTo({
        url: `/pages/order/pay?orderId=1&type=recharge`
    });
};

const goPages = (url: string) => {
    uni.navigateTo({
        url
    });
};
</script>

<style lang="scss" scoped>
.withdraw__wrapper {
    margin: 16rpx 16rpx 48rpx;
    border-radius: 4rpx;
    .withdraw-account {
        padding: 32rpx;
        background-color: #fbfbfb;
        .withdraw-account__main {
            display: flex;
            justify-content: space-between;
            font-size: 28rpx;
            color: #333;
            border-radius: 4rpx;
            .withdraw-account__label {
                line-height: 48rpx;
            }
            .withdraw-account__content {
                position: relative;
                flex: 1;
                line-height: 52rpx;
                text-align: right;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                column-gap: 8rpx;
            }
        }
    }
    .withdraw-amount {
        padding: 32rpx;
        background-color: #fff;
        .withdraw-amount__header {
            font-size: 28rpx;
            line-height: 28rpx;
            color: #666;
        }
        .withdraw-amount__main {
            display: flex;
            position: relative;
            padding: 36rpx 0 20rpx;
            .withdraw-amount__symbol {
                display: inline-block;
                padding-top: 10rpx;
                padding-right: 20rpx;
                font-size: 68rpx;
                line-height: 68rpx;
                color: #333;
            }
            .withdraw-amount__input {
                width: calc(100% - 176rpx);
                height: 88rpx;
                min-height: auto;
                font-size: 72rpx;
                box-sizing: border-box;
                border: none;
            }
        }
        .withdraw-amount__footer {
            margin-top: 24rpx;
            font-size: 24rpx;
            color: #999;
            display: flex;
            align-items: center;
            .withdraw-amount__tips {
                margin-left: 8rpx;
            }
            .withdraw-amount__all {
                color: #38f;
            }
            &.withdraw-amount__footer--invalid {
                color: #d40000;
            }
        }
    }
    .withdraw-button {
        display: flex;
        background-color: #fff;
        padding: 16rpx 48rpx 32rpx;
        .disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
    .withdraw-links {
        display: flex;
        justify-content: center;
        align-items: center;
        padding-top: 48rpx;
        font-size: 24rpx;
        line-height: 32rpx;
        color: #38f;
        .withdraw-links__divider {
            width: 2rpx;
            height: 20rpx;
            margin: 0 24rpx;
            background-color: #dcdde0;
            border: none;
        }
    }
}
.withdraw-amount__main:after {
    content: "";
    position: absolute;
    left: 0;
    right: -30rpx;
    bottom: 0;
    height: 2rpx;
    background-color: #e5e5e5;
    transform: scaleY(0.5);
}
</style>
