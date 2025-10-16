<template>
    <tig-layout title="提交订单">
        <view v-if="fromDine" class="dine-banner">
            <text class="iconfont-h5 icon-gouwuche3 cart"></text>
            <view class="info">
                <view class="row">堂食桌号：<text class="emph">{{ dineTable }}</text></view>
                <view class="row" v-if="dinePeople>0">用餐人数：<text class="emph">{{ dinePeople }}</text></view>
            </view>
        </view>
        <addressInfo v-if="!fromDine" :data="getAddressInfo" />

        <template v-if="paymentTypeList.length > 0">
            <paymentMode v-model:pay-type-id="formState.payTypeId" :available-payment-type="paymentTypeList" @change="updateOrderCheck" />
        </template>

        <stroeCard
            v-model:shipping-type="formState.shippingType"
            :cart-list="cartListData"
            :from-dine="fromDine"
            :shipping-type-list="shippingTypeData"
            @change="updateOrderCheck"
            @change-product-extra="changeProductExtra"
        />

        <remark v-model="formState.buyerNote" />

        <template v-if="configStore.useCoupon == 1 || configStore.usePoints == 1 || configStore.useSurplus == 1">
            <couponInfo
                ref="couponInfoRef"
                v-model:use-coupon-ids="formState.useCouponIds"
                v-model:select-user-coupon-ids="formState.selectUserCouponIds"
                v-model:use-point="formState.usePoint"
                :balance="userStore.userInfo.balance ?? 0"
                :points="userStore.userInfo.points"
                :available-points="availablePoints"
                :points-amount="Number(totalData?.pointsAmount) ?? 0"
                :coupon-amount="Number(totalData?.discountCouponAmount) ?? 0"
                :coupon-list="couponListData"
                :flow-type="flowType"
                @send-balance-status="getBalanceStatus"
                @change="updateCoupon"
            />
        </template>

        <template v-if="configStore.canInvoice === 1 && !isOverseas()">
            <invoiceInfo v-model:invoice-info="formState.invoiceData" :get-address-info="getAddressInfo" />
        </template>

        <totalCard :total="totalData" :cart-list="cartListData" :flow-type="flowType" />

        <tig-fixed-placeholder background-color="#fff">
            <view class="submit-btn-box">
                <view class="submit-btn-price">
                    <view class="price-text">{{ $t("应付") }}:</view>
                    <template v-if="flowType == 3">
                        <view class="points-box">
                            <view class="points-value">
                                {{ totalData?.exchangePoints }}
                                <view class="points-text">{{ $t(configStore.integralName) }} </view>
                            </view>
                            <view class="symbol">+</view>
                        </view>
                    </template>

                    <format-price
                        :font-style="{ fontWeight: 'bold', fontSize: '34rpx' }"
                        :decimals-style="{
                            fontSize: '24rpx',
                            fontWeight: 'bold'
                        }"
                        :currency-style="{
                            fontSize: '23rpx',
                            fontWeight: 'bold'
                        }"
                        :price-data="totalData?.unpaidAmount"
                    />
                </view>
                <view>
                    <tig-button class="btn" :disabled="shippingTypeStaus" @click="submit"> {{ $t("提交订单") }} </tig-button>
                </view>
            </view>
        </tig-fixed-placeholder>
    </tig-layout>
</template>

<script lang="ts" setup>
// 兼容微信小程序全局对象类型声明
declare const wx: any;
import { computed, onUnmounted, reactive, ref } from "vue";
import { getOrderCheckData, updateOrderCheckData, orderSubmit, updateCouponData, getPaymentType, getShippingType } from "@/api/order/check";
import type { CartList, Total, PaymentTypeItem, ShippingTypeItem } from "@/types/order/check";
import type { AddressFilterResult } from "@/types/user/address";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { getAddressList } from "@/api/user/address";
import { useConfigStore } from "@/store/config";
import { useUserStore } from "@/store/user";
import { useI18n } from "vue-i18n";
import { isOverseas, redirect } from "@/utils";
import addressInfo from "./src/addressInfo.vue";
import paymentMode from "./src/paymentMode.vue";
import stroeCard from "./src/storeCard.vue";
import couponInfo from "./src/couponInfo.vue";
import invoiceInfo from "./src/invoiceInfo.vue";
import remark from "./src/remark.vue";
import totalCard from "./src/totalCard.vue";

const { t } = useI18n();

const configStore = useConfigStore();

const userStore = useUserStore();

// 当前结算表单数据
interface IformState {
    addressId: number;
    shippingType: {
        [key: string]: {
            typeId: number;
            shopId: number;
            typeName: string;
        };
    };
    productExtra: any;
    payTypeId: number;
    usePoint: number;
    useBalance: number;
    useCouponIds: number[];
    selectUserCouponIds: number[];
    buyerNote: string;
    invoiceData: any;
    useDefaultCouponIds?: number;
}

// 当前结算表单数据
const formState = reactive<IformState>({
    addressId: 0,
    shippingType: {},
    payTypeId: 0,
    usePoint: 0,
    useBalance: 0,
    useCouponIds: [],
    selectUserCouponIds: [],
    buyerNote: "",
    invoiceData: {},
    productExtra: {}
});

const addressList = ref<AddressFilterResult[]>([]);
// 来自扫码点餐的上下文（需尽早声明，供后续计算使用）
const fromDine = ref(false);
const dineTable = ref('');
const dinePeople = ref(0);
const getAddressInfo = ref<AddressFilterResult>({} as AddressFilterResult);
const getAddressListData = async () => {
    try {
        const result = await getAddressList({ page: 1, size: 99 });
        const isLink = uni.getStorageSync("link");
        if (result.records.length === 0 && !isLink) {
            return uni.navigateTo({
                url: "/pages/address/list"
            });
        }
        if (result.records.length > 0) {
            getAddressInfo.value = result.records[0];
            formState.addressId = result.records[0].addressId;
            addressList.value = result.records;
        }
    } catch (error) {
        console.error(error);
    }
};

const paymentTypeList = ref<PaymentTypeItem[]>([]);
const getPaymentTypeData = async () => {
    try {
        const result = await getPaymentType();
        formState.payTypeId = result[0].typeId;
        paymentTypeList.value = result;
        // console.log(paymentTypeList.value);
    } catch (e) {
        console.log(e);
    }
};

const shippingTypeData = ref<{ [key: string]: ShippingTypeItem[] }>({});
const getShippingTypeData = async () => {
    try {
        if (fromDine.value) return; // 堂食无需配送方式
        const result = await getShippingType({ flowType: flowType.value });
        shippingTypeData.value = result;
        for (const key in result) {
            if (result[key] && result[key].length > 0) {
                formState.shippingType[key] = {
                    typeId: result[key][0].shippingTypeId,
                    shopId: result[key][0].shopId,
                    typeName: result[key][0].shippingTypeName
                };
            }
        }
    } catch (e) {
        console.log(e);
    }
};

const cartListData = ref<CartList[]>([]);
const totalData = ref<Total>();
const couponListData = ref<any>([]);
const tmplIdsData = ref<any>([]);
const flowType = ref<number>(1);
const availablePoints = ref(0);

const getOrderInfo = async () => {
    try {
        const result = await getOrderCheckData({ flowType: flowType.value, ...formState });
        const { cartList, total, couponList, tmplIds, item, useCouponIds, selectUserCouponIds } = result;
        // 合并后端返回的 item 到 formState，避免将我们构建好的 shippingType 映射被后端的空数组覆盖
        if (item) {
            const { shippingType: itemShippingType, ...rest } = item as any;
            Object.assign(formState, rest);
            // 如果后端返回的 shippingType 不是数组（可能已经是映射），再替换；否则保持之前构建的映射
            if (itemShippingType && !Array.isArray(itemShippingType)) {
                formState.shippingType = itemShippingType;
            }
        }
        cartListData.value = cartList;
        totalData.value = total;
        couponListData.value = couponList;
        tmplIdsData.value = tmplIds;
        availablePoints.value = result.availablePoints;

        if (useCouponIds && useCouponIds.length > 0) {
            formState.useCouponIds = useCouponIds;
        }
        if (selectUserCouponIds && selectUserCouponIds.length > 0) {
            formState.selectUserCouponIds = selectUserCouponIds;
        }
    } catch (error: any) {
        console.error(error);
    }
};

const changeProductExtra = async (data: any) => {
    formState.productExtra = data;
    const result = await updateOrderCheck();
    if (result) {
        cartListData.value = result.cartList;
    }
};

const updateOrderCheck = async () => {
    uni.showLoading({
        title: t("加载中")
    });
    try {
        const result = await updateOrderCheckData({ flowType: flowType.value, ...formState });
        if (result.item) {
            const { shippingType: itemShippingType, ...rest } = result.item as any;
            Object.assign(formState, rest);
            if (itemShippingType && !Array.isArray(itemShippingType)) {
                formState.shippingType = itemShippingType;
            }
        }
        totalData.value = result.total;
        availablePoints.value = result.availablePoints;
        return result;
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            duration: 1500
        });
    } finally {
        uni.hideLoading();
    }
};

const updateCoupon = async () => {
    uni.showLoading({
        title: t("加载中")
    });
    try {
        const result = await updateCouponData(formState);
        couponListData.value = result.couponList;
        totalData.value = result.total;
        cartListData.value = result.cartList;
        formState.useCouponIds = result.useCouponIds;
        formState.selectUserCouponIds = result.selectUserCouponIds;
        return result;
    } catch (error) {
        console.error(error);
    } finally {
        uni.hideLoading();
    }
};

const getBalanceStatus = (status: boolean) => {
    if (status) {
        formState.useBalance = userStore.userInfo.balance;
    } else {
        formState.useBalance = 0;
    }
    updateOrderCheck();
};

const shippingTypeStaus = computed(() => {
    if (fromDine.value) return false; // 堂食不校验配送方式
    // 若映射对象还未初始化，阻止提交
    if (!formState.shippingType) return true;

    for (const group of cartListData.value) {
        // 不需要物流的商品组直接跳过
        if (group.noShipping === 1) continue;

        const shopId = group.shopId;
        const hasMapping = !!formState.shippingType[shopId];
        const hasSelectableList = !!shippingTypeData.value[shopId] && shippingTypeData.value[shopId].length > 0;
    // 使用后端新的字段 storeShippingFee（对象映射），兼容旧逻辑
    const totalAny: any = totalData.value;
    const hasComputedFee = !!(totalAny?.storeShippingFee && (totalAny.storeShippingFee[String(shopId)] !== undefined));

        // 逻辑说明：
        // 1. 如果该店铺提供可选的配送方式列表 (hasSelectableList)，则必须在 formState.shippingType 中已经选中一个
        // 2. 如果没有可选列表 (hasSelectableList === false)，但后端已经计算了运费 (hasComputedFee)，则视为已自动选择，放行
        // 3. 否则阻止提交
        if (hasSelectableList && !hasMapping) return true;
        if (!hasSelectableList && !hasComputedFee && !hasMapping) return true;
    }
    return false;
});
const submitLoading = ref(false);
const submit = async () => {
    if (submitLoading.value) return;
    if (formState.payTypeId === 0) {
        return uni.showToast({
            title: t("请选择付款方式"),
            icon: "none"
        });
    }
    if (shippingTypeStaus.value) {
        return;
    }

    if (submitLoading.value) return;

    submitLoading.value = true;
    // #ifdef MP-WEIXIN
    //小程序调用订阅消息需要授权模板
    wx.requestSubscribeMessage({
        tmplIds: tmplIdsData.value,
        complete: () => {
            submitOrder();
        }
    });
    // #endif

    // #ifdef APP-PLUS || H5 || MP-QQ || MP-TOUTIAO || MP-BAIDU || MP-ALIPAY
    submitOrder();
    // #endif
};
/**
 * 提交订单
 */
const submitOrder = async () => {
    try {
        // 确保提交时包含 flowType（有的后端需要）
        const result = await orderSubmit({ flowType: flowType.value, ...formState });
        if (result.returnType === 2) {
            redirect({
                url: `/pages/order/payStatus?id=${result.orderId}`,
                mode: "redirectTo"
            });
        } else {
            redirect({
                url: `/pages/order/pay?orderId=${result.orderId}`,
                mode: "redirectTo"
            });
        }
    } catch (error: any) {
        console.error(error);

        if (configStore.XClientType === "wechat" && error.code === 5002) {
            uni.setStorageSync("bindWechatFlowType", flowType.value);
            return redirect({
                url: `/pages/user/profile/index?bindWechat=true&flowType=${flowType.value}`
            });
        }

        uni.showToast({
            title: error.message,
            icon: "none"
        });
        setTimeout(() => {
            redirect({
                url: `/pages/cart/index`,
                mode: "redirectTo"
            });
        }, 1500);
    } finally {
        submitLoading.value = false;
    }
};

const couponInfoRef = ref();

onShow(async () => {
    initPageData();
    if (couponInfoRef?.value) {
        couponInfoRef.value.isBalance = false;
        formState.useBalance = 0;
    }
});

const initPageData = async () => {
    try {
        uni.showLoading({
            title: t("加载中")
        });
        const tasks: Promise<any>[] = [getPaymentTypeData(), getShippingTypeData(), userStore.getUserInfo()];
        if (!fromDine.value) tasks.unshift(getAddressListData());
        await Promise.all(tasks);
        await getOrderInfo();
    } catch (error: any) {
        console.error(error);
        uni.showToast({
            title: error.message,
            icon: "none"
        });
        setTimeout(() => {
            redirect({
                url: `/pages/cart/index`,
                mode: "redirectTo"
            });
        }, 1500);
    } finally {
        uni.hideLoading();
    }
};

onUnmounted(() => {
    uni.removeStorageSync("link");
});

onLoad((options) => {
    if (options) {
        if (options.flowType) {
            flowType.value = options.flowType;
        }
        if (options.from === 'dine') {
            fromDine.value = true;
            dineTable.value = options.table || '';
            const pc = Number(options.pc);
            dinePeople.value = Number.isFinite(pc) ? pc : 0;
            // 标记堂食消费，便于后端统计与策略（例如免配送）
            formState.productExtra = {
                ...(formState.productExtra || {}),
                dine: {
                    isDine: 1,
                    table: dineTable.value,
                    people: dinePeople.value
                }
            };
            // 堂食订单不使用地址，显式置为 0 以避免后端地址校验
            formState.addressId = 0;
        }
    }
});
</script>

<style lang="scss" scoped>
.dine-banner {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 30rpx;
    background: #f7f8fa;
    border-bottom: 1px solid #f1f1f1;
    .cart { color:#18b5b5; font-size: 40rpx; }
    .info { font-size: 24rpx; color:#333; line-height: 1.6; }
    .emph { font-weight: 600; }
}
.submit-btn-box {
    background-color: #fff;
    width: 100%;
    height: 100%;
    bottom: 0;
    padding: 0 30rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .submit-btn-price {
        color: var(--general);
        font-size: 32rpx;
        font-weight: bold;
        display: flex;
        align-items: center;
        column-gap: 10rpx;

        .price-text {
            font-weight: normal;
            color: #323233;
        }

        .points-box {
            display: flex;
            font-size: 34rpx;
            column-gap: 10rpx;
            .points-value {
                display: flex;
                align-items: flex-end;
                column-gap: 4rpx;
            }

            .points-text {
                font-size: 24rpx;
                position: relative;
                bottom: 4rpx;
            }
        }
    }

    .btn {
        width: 200rpx;
    }
}
</style>
