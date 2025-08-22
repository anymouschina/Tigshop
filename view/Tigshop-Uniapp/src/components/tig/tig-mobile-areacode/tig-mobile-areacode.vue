<template>
    <view class="areacode-box" :style="boxStyle" @click="handleClick">
        <view class="areacode-box-text">
            <view class="text-label" :style="labelStyle"> {{ currentData?.label }} </view>
            <!-- <view class="text-name" :style="nameStyle"> {{ currentData.name ? `(${$t(currentData.name)})` : "" }}</view> -->
        </view>
        <!-- <text class="iconfont-h5 icon-xiajiantou" :style="iconStyle"></text> -->
        <up-picker :show="show" :columns="[list]" key-name="labelName" @cancel="show = false" @confirm="handleConfirm" />
    </view>
</template>

<script setup lang="ts">
import { getmobileAreaCode } from "@/api/common";
import type { MobileAreaCodeList } from "@/types/common";
import { ref } from "vue";

const props = defineProps({
    labelStyle: {
        type: Object,
        default: () => ({})
    },
    nameStyle: {
        type: Object,
        default: () => ({})
    },
    boxStyle: {
        type: Object,
        default: () => ({})
    },
    iconStyle: {
        type: Object,
        default: () => ({})
    },
    placeholder: {
        type: String,
        default: "请选择区号"
    },
    modelValue: {
        type: String,
        default: ""
    }
});
const emit = defineEmits(["update:modelValue"]);

const show = ref(false);
const list = ref<MobileAreaCodeList[]>([]);
const loading = ref<boolean>(true);
const currentData = ref<MobileAreaCodeList>({} as MobileAreaCodeList);
const getmobileAreaCodeList = async () => {
    loading.value = true;
    try {
        const result = await getmobileAreaCode();
        result.map((item) => {
            item.labelName = `${item.label} (${item.name})`;
        });
        list.value = result;
        currentData.value = result[0];
    } catch (error) {
        console.log(error);
    } finally {
        loading.value = false;
    }
};
getmobileAreaCodeList();
const handleClick = () => {
    show.value = true;
};
const handleConfirm = (e: any) => {
    currentData.value = e.value[0];
    emit("update:modelValue", e.value[0].code);
    show.value = false;
};
</script>

<style lang="scss" scoped>
.areacode-box {
    display: flex;
    align-items: self-start;
    border-right: 1rpx solid #dfdfdf;
    margin-right: 25rpx;
    // padding: 0 30rpx 0 15rpx;
    .areacode-box-text {
        font-size: 28rpx;
        color: #333;
        padding-right: 10rpx;
        display: flex;
        align-items: center;
        .text-name {
            padding: 0 2rpx 0 4rpx;
            font-size: 26rpx;
        }
    }
    .icon-xiajiantou {
        color: #333;
        font-size: 24rpx;
        padding-top: 6rpx;
    }
}
</style>
