<template>
    <tig-layout>
        <tig-navbar :title="navbarTitle" />
        <template v-if="loading">
            <view class="page-loading">
                <view class="ico" />
            </view>
        </template>
        <template v-if="order">
            <view class="order-pay-warp">
                <view class="order_infos">
                    <view class="order_amount">
                        <template v-if="typeText !== 'recharge'">
                            <format-price :is-bootom="false" :price-data="order.unpaidAmount" />
                        </template>
                        <template v-else>
                            <format-price :is-bootom="false" :price-data="order.amount" />
                        </template>
                    </view>
                    <template v-if="typeText !== 'recharge'">
                        <view class="order_sn">
                            {{ $t("订单号") }}：
                            <text>{{ order.orderSn }}</text>
                        </view>
                    </template>
                </view>

                <template v-if="order.payTypeId !== 3">
                    <payment v-model="paymentType" :payment-list="paymentList" />
                </template>

                <template v-if="order.payTypeId === 3">
                    <offline :offline-payment-list="offlinePaymentList" />
                </template>

                <template v-if="typeText !== 'recharge'">
                    <view class="other-info">
                        <view class="tit">{{ $t("其它信息") }}</view>
                        <view class="item">
                            {{ $t("支付方式：") }}
                            <text>{{ $t(payTypeText) }}</text>
                        </view>
                        <view class="item">
                            {{ $t("配送方式") }}：
                            <text>{{ order.shippingTypeName || $t("专线物流") }}</text>
                        </view>
                        <view class="item">
                            {{ $t("下单时间") }}：
                            <text>{{ order.addTime }}</text>
                        </view>
                    </view>
                </template>

                <template v-if="order.payTypeId !== 3">
                    <tig-fixed-placeholder background-color="#fff">
                        <view class="btn-box">
                            <tig-button :disabled="paymentDisabled" @click="handlePay"> {{ $t("立即支付") }}</tig-button>
                        </view>
                    </tig-fixed-placeholder>
                </template>
            </view>
        </template>
        <!-- #ifdef H5 -->
        <div ref="formContainer" />
        <!-- #endif -->
    </tig-layout>
</template>

<script setup lang="ts">
import payment from "./src/payment.vue";
import offline from "./src/offline.vue";
import { onLoad } from "@dcloudio/uni-app";
import { onBeforeUnmount, ref } from "vue";
import { orderPayInfo, creatPay, checkPayStatus, rechargeOrderPay, rechargeOrderCreate, checkRechargePayStatus } from "@/api/order/pay";
import type { Order, OfflinePaymentList } from "@/types/order/pay";
import { useConfigStore } from "@/store/config";
import { useI18n } from "vue-i18n";
import { redirect } from "@/utils";

const { t } = useI18n();

const configStore = useConfigStore();

const navbarTitle = ref("订单支付");

const loading = ref(false);
const paymentList = ref<string[]>([]);
const paymentDisabled = ref(false);
const offlinePaymentList = ref<OfflinePaymentList>({} as OfflinePaymentList);
const paymentType = ref("wechat");
const order = ref<Order>();
const formContainer = ref<HTMLElement | null>(null);
const typeText = ref("");
const payTypeText = ref("");

const orderId = ref<number | null>(null);
onLoad((options) => {
    if (options && options.orderId) {
        if (!options.type) {
            loadOrderPayInfo(options.orderId);
        } else {
            typeText.value = options.type;
            navbarTitle.value = "充值支付";
            getRechargeOrderPay(options.orderId);
        }
    }
});

// 订单信息
const loadOrderPayInfo = async (id: number) => {
    loading.value = true;
    try {
        const result = await orderPayInfo(id);
        order.value = result.order;
        paymentList.value = result.paymentList;
        paymentType.value = paymentList.value[0];
        offlinePaymentList.value = result.offlinePaymentList;
        orderId.value = result.order.orderId;
        payTypeText.value = result.order.payTypeId === 3 ? "线下支付" : "在线支付";
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            duration: 1500,
            icon: "none"
        });
        setTimeout(function () {
            redirect({
                url: "/pages/user/order/list",
                mode: "redirectTo"
            });
        }, 1500);
    } finally {
        loading.value = false;
    }
};

// 充值信息
const getRechargeOrderPay = async (id: number) => {
    try {
        const result = await rechargeOrderPay({ orderId: id });
        order.value = result.order;
        paymentList.value = result.paymentList;
        paymentType.value = paymentList.value[0];
        orderId.value = result.order.orderId;
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            duration: 1500,
            icon: "none"
        });
        setTimeout(function () {
            uni.navigateTo({
                url: "/pages/user/account/index"
            });
        }, 1500);
    } finally {
        loading.value = false;
    }
};

let intervalId: any = null; // 存储定时器 ID，便于后续清除
const count = ref(0);
const handlePay = async () => {
    paymentDisabled.value = true;
    try {
        if (orderId.value) {
            let result;
            if (typeText.value === "recharge") {
                // 充值
                result = await __rechargeOrderCreate();
            } else {
                // 订单
                result = await __orderCreatPay();
            }
            if (result) {
                // 支付宝
                if (paymentType.value === "alipay") {
                    if (configStore.XClientType === "h5") {
                        alipay(result.payInfo.html);
                    }
                    if (configStore.XClientType === "app") {
                        appPay(result.payInfo);
                    }
                }
                // 微信
                if (paymentType.value === "wechat" || paymentType.value === "yunpayWechat") {
                    if (configStore.XClientType === "h5") {
                        window.open(result.payInfo.url, "_blank");
                    }
                    if (configStore.XClientType === "miniProgram") {
                        miniProgramPay(result.payInfo);
                    }
                    if (configStore.XClientType === "wechat") {
                        onBridgeReady(result.payInfo);
                    }
                    if (configStore.XClientType === "app") {
                        appPay(result.payInfo);
                    }
                }

                if (paymentType.value === "yabanpayWechat") {
                    window.location.href = result.payInfo.url;
                }

                if (paymentType.value === "yabanpayAlipay") {
                    window.location.href = result.payInfo.url;
                }
                if (paymentType.value === "paypal") {
                    window.location.href = result.payInfo.url;
                }
                if (paymentType.value === "yunpayAlipay") {
                    window.location.href = result.payInfo.codeUrl;
                }
                if (paymentType.value === "yunpayYunshanfu") {
                    window.location.href = result.payInfo.codeUrl;
                }
                //每隔三秒检查支付状态，超过20次则认为支付失败
                intervalId = setInterval(() => {
                    if (typeText.value === "recharge") {
                        __checkRechargePayStatus();
                    } else {
                        __checkPayStatus();
                    }
                    count.value++;
                    if (count.value === 50) {
                        clearInterval(intervalId!); // 清除定时器，停止执行
                        uni.showToast({
                            title: t("支付已超时"),
                            duration: 1500,
                            icon: "none"
                        });
                        if (typeText.value === "recharge") {
                            redirect({
                                url: "/pages/user/account/index",
                                mode: "redirectTo"
                            });
                        } else {
                            redirect({
                                url: "/pages/user/order/list",
                                mode: "redirectTo"
                            });
                        }
                    }
                }, 2000);
            }
        }
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            duration: 1500,
            icon: "none"
        });
    } finally {
        paymentDisabled.value = false;
    }
};

// 创建充值支付信息
const __rechargeOrderCreate = async () => {
    let result;
    // #ifdef APP-PLUS || H5 || MP-QQ || MP-TOUTIAO || MP-BAIDU || MP-ALIPAY
    result = await __creatRechargePay();
    return result;
    // #endif
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
        wx.login({
            success: (res: any) => {
                __creatRechargePay(res.code)
                    .then((result: any) => {
                        resolve(result);
                    })
                    .catch((err: any) => {
                        reject(err);
                    });
            },
            fail: (err: any) => {
                reject(err);
            }
        });
    });
    // #endif
};

// 创建订单支付信息
const __orderCreatPay = async () => {
    let result;
    // #ifdef APP-PLUS || H5 || MP-QQ || MP-TOUTIAO || MP-BAIDU || MP-ALIPAY
    result = await __creatPay();
    return result;
    // #endif
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
        wx.login({
            success: (res: any) => {
                __creatPay(res.code)
                    .then((result: any) => {
                        resolve(result);
                    })
                    .catch((err: any) => {
                        reject(err);
                    });
            },
            fail: (err: any) => {
                reject(err);
            }
        });
    });
    // #endif
};

type TData = {
    id: number;
    type: string;
    code?: number;
};
const __creatPay = async (code?: number) => {
    let result;
    try {
        const data: TData = {
            id: orderId.value!,
            type: paymentType.value
        };
        if (code) {
            data.code = code;
        }
        result = await creatPay(data);
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            duration: 1500,
            icon: "none"
        });
    } finally {
        return result;
    }
};

const __creatRechargePay = async (code?: number) => {
    let result;
    try {
        const data: TData = {
            id: orderId.value!,
            type: paymentType.value
        };
        if (code) {
            data.code = code;
        }
        result = await rechargeOrderCreate(data);
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            duration: 1500,
            icon: "none"
        });
    } finally {
        return result;
    }
};

const __checkPayStatus = async () => {
    try {
        const result = await checkPayStatus({ id: orderId.value });
        if (result == 1) {
            clearInterval(intervalId);
            //支付成功跳转
            setTimeout(function () {
                redirect({
                    url: `/pages/order/payStatus?id=${orderId.value}`,
                    mode: "redirectTo"
                });
            }, 1500);
        }
    } catch (error) {}
};

const __checkRechargePayStatus = async () => {
    try {
        const result = await checkRechargePayStatus({ id: orderId.value });
        if (result == 1) {
            clearInterval(intervalId);
            //支付成功跳转
            uni.showToast({
                title: t("支付成功"),
                duration: 1500,
                icon: "none"
            });
            setTimeout(function () {
                redirect({
                    url: "/pages/user/account/index",
                    mode: "redirectTo"
                });
            }, 1500);
        }
    } catch (error) {}
};

const alipay = (html: string) => {
    if (formContainer.value) {
        formContainer.value.innerHTML = html;
        // 提交表单
        const forms = document.forms;
        forms && forms[0].submit();
    }
};

/* 微信小程序调用 */
const miniProgramPay = (payInfo: any) => {
    wx.requestPayment({
        timeStamp: String(payInfo.timeStamp),
        nonceStr: payInfo.nonceStr,
        package: payInfo.package,
        signType: payInfo.signType,
        paySign: payInfo.paySign,
        success(res: any) {
            uni.showToast({
                title: t("支付成功"),
                duration: 1500
            });
            setTimeout(function () {
                if (typeText.value === "recharge") {
                    redirect({
                        url: "/pages/user/account/index",
                        mode: "redirectTo"
                    });
                } else {
                    redirect({
                        url: `/pages/order/payStatus?id=${orderId.value}`,
                        mode: "redirectTo"
                    });
                }
            }, 1500);
        },
        fail(res: any) {
            uni.showToast({
                title: t("支付失败"),
                duration: 1500,
                icon: "none"
            });
            setTimeout(() => {
                if (typeText.value === "recharge") {
                    redirect({
                        url: "/pages/user/account/index",
                        mode: "redirectTo"
                    });
                } else {
                    redirect({
                        url: "/pages/user/order/list",
                        mode: "redirectTo"
                    });
                }
            }, 1500);
        }
    });
};

/* 微信公众号调用 */
const onBridgeReady = (payInfo: any) => {
    WeixinJSBridge.invoke(
        "getBrandWCPayRequest",
        {
            ...payInfo
        },
        function (res: any) {
            if (res.errMsg == "getBrandWcpayRequest:ok") {
                // 使用以上方式判断前端返回,微信团队郑重提示：
                //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
            }
        }
    );
};

// app端
const appPay = (payInfo: any) => {
    //微信App支付独立结构
    if (paymentType.value === "wechat") {
        uni.requestPayment({
            provider: "wxpay",
            orderInfo: {
                appid: payInfo.appId,
                noncestr: payInfo.nonceStr,
                package: payInfo.package,
                partnerid: String(payInfo.partnerId),
                prepayid: payInfo.prepayId,
                timestamp: payInfo.timeStamp,
                sign: payInfo.sign
            },
            success() {
                uni.showToast({
                    title: t("支付成功"),
                    duration: 1500,
                    icon: "none"
                });
            },
            fail() {
                uni.showToast({
                    title: t("支付失败"),
                    duration: 1500,
                    icon: "none"
                });
                if (intervalId) {
                    clearInterval(intervalId);
                }
            },
            complete() {}
        });
        return;
    }
    uni.requestPayment({
        provider: payInfo.provider,
        orderInfo: payInfo.orderInfo,
        success() {
            uni.showToast({
                title: t("支付成功"),
                duration: 1500,
                icon: "none"
            });
        },
        fail() {
            uni.showToast({
                title: t("支付失败"),
                duration: 1500,
                icon: "none"
            });
            if (intervalId) {
                clearInterval(intervalId);
            }
        },
        complete() {}
    });
};

onBeforeUnmount(() => {
    typeText.value = "";
    clearInterval(intervalId);
});
</script>

<style lang="scss" scoped>
.btn-box {
    padding: 25rpx;
}
.order-pay-warp {
    padding-bottom: 100rpx;
}
.order_infos {
    text-align: center;
    background: #fff;
    padding: 50rpx 0 60rpx;
    border-radius: 0 0 18rpx 18rpx;
}
.order_infos .order_amount {
    font-size: 46rpx;
    color: var(--general);
    font-weight: bold;
    :deep(.util) {
        font-size: 30rpx;
        font-weight: normal;
        position: relative;
        top: -5rpx;
    }
}

.other-info {
    background: #fff;
    padding: 30rpx 36rpx 30rpx;
    border-radius: 18rpx;
    margin-top: 20rpx;
    margin-bottom: 40rpx;
}
.other-info .tit {
    font-size: 22rpx;
    font-weight: bold;
}
.other-info .item {
    color: #888;
    font-size: 24rpx;
    padding-top: 20rpx;
}
.other-info .item text {
    color: #333;
}

.pay-btn-warp {
    position: fixed;
    display: block;
    background: #fff;
    bottom: 0;
    left: 0;
    width: 100%;
}
.pay-btn-warp .pay-btn {
    text-align: center;
    height: 80rpx;
    line-height: 80rpx;
    padding: 0;
    display: block;
    margin: 20rpx 30rpx;
}
.offline-warp {
    border-radius: 20rpx;
    padding: 10rpx;
    background-color: #fff;
    margin: 20rpx 0 0;
    overflow: hidden;

    .offline-menu {
        height: 100rpx;
        width: 100%;
        background-color: #fff;
        display: flex;
        align-items: center;
        box-sizing: content-box;
        margin-bottom: 15rpx;

        .offline-menu-item {
            flex: 1;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28rpx;
            color: #999;
            position: relative;

            &.active {
                color: #333;
                font-weight: bold;

                &:after {
                    content: "";
                    position: absolute;
                    bottom: 0;
                    height: 5rpx;
                    width: 80rpx;
                    background-color: var(--general);
                    border-radius: 10rpx;
                }
            }
        }
    }
}
.offline-content {
    padding: 20rpx;
    line-height: 45rpx;
}
</style>
