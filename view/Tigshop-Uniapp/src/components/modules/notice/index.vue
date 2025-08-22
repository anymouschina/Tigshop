<template>
    <view :class="'module-ad-con module-notice'" :style="frameFormat.boxPadding + frameFormat.boxPaddingTop + frameFormat.boxPaddingBottom">
        <view class="notice-ad-warp">
            <view class="notice-con" :style="frameFormat.backgroundColor + ' ' + frameFormat.boxRadius">
                <view class="notice-item">
                    <view class="item-content">
                        <view class="item-notice-con" :style="itemFormat.itemBackgroundColor + itemFormat.itemHeight + itemFormat.itemRadius">
                            <view class="item-notice-ico">
                                <!-- <image lazy-load  :src="module?.icoPic?.picUrl" mode="widthFix"></image> -->
                                <tig-image :src="module.icoPic.picUrl" mode="widthFix" />
                            </view>
                            <view class="item-notice-list">
                                <view class="item-notice-input" :style="itemFormat.textColor">{{ $t(module?.text) }}</view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { formatFrame } from "@/components/modules";
const props = defineProps({
    module: {
        type: Object,
        default: () => {}
    }
});
const { frame } = props.module;
const frameFormat = computed(() => {
    return formatFrame(frame ?? {});
});
const itemFormat = computed(() => {
    return {
        itemBackgroundColor: `background-color:${props.module?.frame?.itemBackgroundColor};`,
        itemRadius: `border-radius:${props.module?.frame?.itemRadius}px;`,
        itemHeight: `height:${props.module?.frame?.itemHeight}px;`,
        textColor: `color:${props.module?.frame?.textColor};`
    };
});
</script>
<style>
.notice-ad-warp .item-notice-con {
    background: #fff;
    height: 40rpx;
    display: flex;
    align-items: center;
    padding: 10rpx 0;
    color: #555555;
}
.notice-ad-warp .item-notice-con .item-notice-ico {
    margin-left: 20rpx;
    width: 32rpx;
    height: 32rpx;
}
.notice-ad-warp .item-notice-con .item-notice-ico image {
    width: 100%;
    height: 100%;
}
.notice-ad-warp .item-notice-con .item-notice-list {
    margin-left: 16rpx;
}
</style>
