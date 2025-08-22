<template>
    <view>
        <view class="payment">
            <view class="payment-title">{{ $t("支付方式") }}</view>
            <view class="payment-content" @click="handlePaymentMode">
                <view class="payment-text">{{ paymentTypeText ? paymentTypeText : props.availablePaymentType[0].typeName }}</view>
                <image lazy-load class="more-ico" :src="staticResource('common/more.png')" />
            </view>
        </view>
        <tig-popup v-model:show="show">
            <view class="payment-popup">
                <view class="popup-title title">{{ $t("选择支付方式") }}</view>
                <view class="payment-btn">
                    <block v-for="(item, index) in availablePaymentTypeData" :key="item.typeId">
                        <view
                            v-if="item.isShow"
                            class="payment-btn-item"
                            :class="{ active: getActive(index, item.typeId), disabled: item.disabled }"
                            @click="handlePaymentType(index, item.disabled)"
                            >{{ item?.typeName }}
                        </view>
                    </block>
                </view>

                <template v-if="currentIndex !== null">
                    <view class="payment-desc">
                        <view class="payment-desc-title">{{ availablePaymentTypeData[currentIndex]?.typeName }}</view>
                        <view class="payment-desc-text">
                            {{
                                availablePaymentTypeData[currentIndex]?.typeName === "在线支付"
                                    ? $t("支持微信即时到账（绝大数银行借记卡及部分银行信用卡）")
                                    : $t("支持银行和企业账户汇款")
                            }}
                        </view>
                    </view>
                </template>

                <tig-fixed-placeholder background-color="#fff">
                    <view class="btn-box">
                        <tig-button @click="handlecConfirm"> {{ $t("提交") }}</tig-button>
                    </view>
                </tig-fixed-placeholder>
            </view>
        </tig-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { AvailablePaymentType } from "@/types/order/check";
import { staticResource } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
    availablePaymentType: AvailablePaymentType[];
    payTypeId: number;
}
const props = defineProps<Props>();
const emit = defineEmits(["update:payTypeId", "change"]);

const availablePaymentTypeData = ref<AvailablePaymentType[]>([]);
const paymentTypeText = ref("");
const handlePaymentMode = () => {
    availablePaymentTypeData.value = JSON.parse(JSON.stringify(props.availablePaymentType));
    show.value = true;
    const index = props.availablePaymentType.findIndex((item) => item.typeId === props.payTypeId);
    if (index >= 0) {
        currentIndex.value = index;
    }
};

watch(
    () => availablePaymentTypeData,
    () => {
        const data: AvailablePaymentType[] = availablePaymentTypeData.value.filter((item) => item.disabled);
        if (data[0] && data[0].typeId === props.payTypeId) {
            emit("update:payTypeId", 0);
            currentIndex.value = null;
            paymentTypeText.value = data[0].disabledDesc;
            uni.showToast({
                title: data[0].disabledDesc,
                duration: 1500,
                icon: "none"
            });
        }
    }
);

const show = ref(false);
const currentIndex = ref<null | number>(null);
const getActive = (index: number, id: number) => {
    if (currentIndex.value !== null && currentIndex.value !== undefined && currentIndex.value >= 0) {
        return currentIndex.value === index;
    } else {
        return id === props.payTypeId;
    }
};
const handlePaymentType = (index: number, disabled: boolean) => {
    if (disabled) return;
    currentIndex.value = index;
};

const handlecConfirm = () => {
    if (currentIndex.value !== null && currentIndex.value >= 0) {
        paymentTypeText.value = availablePaymentTypeData.value[currentIndex.value].typeName;
        emit("update:payTypeId", availablePaymentTypeData.value[currentIndex.value].typeId);
        emit("change");
        show.value = false;
    } else {
        uni.showToast({
            title: t("请选择付款方式"),
            duration: 1500,
            icon: "none"
        });
    }
};
</script>

<style lang="scss" scoped>
.btn-box {
    padding: 25rpx;
}

.payment {
    border-radius: 18rpx;
    background: #fff;
    margin-bottom: 20rpx;
    padding: 30rpx 32rpx 35rpx;

    display: flex;
    justify-content: space-between;
    align-items: center;

    .payment-content {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .more-ico {
        width: 36rpx;
        height: 36rpx;
        padding-left: 10rpx;
    }
}

.payment-popup {
    padding: 40rpx 40rpx 0;
    height: 50vh;
    .title {
        padding-left: 0;
        height: 90rpx;
        line-height: 50rpx;
        padding-bottom: 40rpx;
    }

    .payment-btn {
        display: flex;
        margin-bottom: 40rpx;

        .payment-btn-item {
            background: #f2f2f2;
            color: #282828;
            padding: 13rpx 36rpx;
            border-radius: 50rpx;
            font-size: 25rpx;
            display: inline-block;
            margin-right: 28rpx;
            margin-bottom: 10rpx;

            &.active {
                color: #fff;
                background-color: var(--general);
            }

            &.disabled {
                color: #bbb;
            }
        }
    }

    .payment-desc {
        border-top: 1rpx solid #f2f2f2;
        padding-top: 20rpx;

        .payment-desc-text {
            font-weight: bold;
        }
    }
}
</style>
