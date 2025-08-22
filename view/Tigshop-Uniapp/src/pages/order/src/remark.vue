<template>
    <view class="remark">
        <view class="remark-title">{{ $t("备注") }}</view>
        <view class="remark-content">
            <up-input v-model="remark" :placeholder="$t('备注建议提前协商（250字以内）')" border="none" input-align="right" maxlength="250" :clearable="true" />
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        default: ""
    }
});
const emit = defineEmits(["update:modelValue"]);
const remark = computed({
    get() {
        return props.modelValue;
    },
    set(val) {
        emit("update:modelValue", val);
    }
});
</script>

<style lang="scss" scoped>
.remark {
    border-radius: 18rpx;
    background: #fff;
    padding: 30rpx 32rpx;
    margin-top: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;

    .remark-content {
        width: 550rpx;
    }
}
</style>
