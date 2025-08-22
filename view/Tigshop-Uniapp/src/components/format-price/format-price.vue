<template>
    <view class="price-content" :class="{ bottom: isBottom }">
        <template v-if="showB2bText">
            <view class="line1 b2b-text">{{ $t(b2bText) }}</view>
        </template>
        <template v-else>
            <view v-if="props.currencyFormat" :style="hasContent(currencyStyle) ? currencyStyle : fontStyle" class="num util">
                {{ currency }}
            </view>
            <view class="num integer" :style="fontStyle">{{ price.integer }}</view>
            <view v-if="showDecimals" class="num decimal" :style="hasContent(decimalsStyle) ? decimalsStyle : fontStyle">{{ price.decimals }}</view>
        </template>
    </view>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { useConfigStore } from "@/store/config";
import { useCurrencyStore } from "@/store/currency";
import { useUserStore } from "@/store/user";
import { isOverseas, moneyFormat, isB2B } from "@/utils";

const configStore = useConfigStore();
const currencyStore = useCurrencyStore();
const userStore = useUserStore();

const props = defineProps({
    priceData: [String, Number],
    isBottom: { type: Boolean, default: true },
    currencyFormat: { type: Boolean, default: true },
    currencyStyle: {
        type: Object,
        default: {}
    },
    fontStyle: {
        type: Object,
        default: {}
    },
    decimalsStyle: {
        type: Object,
        default: {}
    },
    showDecimals: {
        type: Boolean,
        default: true
    },
    showText: {
        type: Boolean,
        default: true
    }
});
const hasContent = (styleObj: any) => {
    return styleObj && Object.keys(styleObj).length > 0;
};

const b2bText = computed(() => {
    let str = "登录查看";
    if (Object.keys(userStore.userInfo).length > 0) {
        str = "实名查看";
    }
    return str;
});

const showB2bText = computed(() => {
    let value = false;
    if (isB2B() && props.showText && configStore.isIdentity === 1) {
        if (Object.keys(userStore.userInfo).length === 0) {
            value = true;
        } else if (!userStore.userInfo.isCompanyAuth) {
            value = true;
        }
    }
    return value;
});

const currency = computed(() => {
    return isOverseas() ? currencyStore.currentCurrencyData.symbol : configStore.dollarSign;
});
const price = computed(() => {
    let num = typeof props.priceData === "number" ? String(props.priceData) : props.priceData;
    if (!num) {
        return {
            integer: "0",
            decimals: ".00"
        };
    }
    if (isOverseas() && currencyStore.currentCurrencyData.rate) {
        num = moneyFormat((Number(num) * Number(currencyStore.currentCurrencyData.rate)).toString());
    }
    // 检测小数点和后续数字
    const match = num.match(/^(\d+)(\.\d+)?$/);
    if (match) {
        const integerPart = match[1] || "0";
        const decimalPart = match[2] || ".00";
        return {
            integer: integerPart,
            decimals: decimalPart
        };
    } else {
        return {
            integer: "0",
            decimals: ".00"
        };
    }
});
</script>
<style lang="scss" scoped>
.price-content {
    height: auto;
    display: inline-block;
    .util {
        padding-right: 3rpx;
        // #ifdef MP-WEIXIN
        padding-right: 5rpx;
        // #endif
    }

    .num {
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
    }

    .util,
    .decimal {
        height: inherit;
    }

    &.bottom {
        .num {
            justify-content: flex-end;
        }

        .util,
        .decimal {
            padding-bottom: 2rpx;
            // #ifdef MP-WEIXIN
            padding-bottom: 3rpx;
            // #endif
        }
    }

    .b2b-text {
        font-size: 22rpx !important;
        font-weight: normal !important;
    }
}
</style>
