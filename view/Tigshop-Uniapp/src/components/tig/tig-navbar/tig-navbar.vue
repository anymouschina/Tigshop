<template>
    <view class="tig-navbar">
        <view class="navbar-box" :class="{ 'border-bottom': borderBottom }" :style="`background: ${background};`">
            <view class="navbar">
                <view class="navbar-content">
                    <view class="left">
                        <template v-if="showLeft">
                            <slot name="left">
                                <view class="iconfont icon-houtui" @click="handleIcon" />
                            </slot>
                        </template>
                    </view>

                    <view class="middle">
                        <slot name="title">
                            <view class="title line1" :style="`color: ${color};`">{{ $t(title) }}</view>
                        </slot>
                    </view>

                    <view class="right">
                        <slot name="right" />
                    </view>
                </view>
            </view>
        </view>
        <view class="placeholder" />
    </view>
</template>

<script setup lang="ts">
const props = defineProps({
    title: {
        type: String,
        default: ""
    },
    background: {
        type: String,
        default: "#fff"
    },
    showLeft: {
        type: Boolean,
        default: true
    },
    customBack: {
        //是否自定义返回事件
        type: Boolean,
        default: false
    },
    borderBottom: {
        type: Boolean,
        default: false
    },
    color: {
         type: String,
        default: "#000"
    }
});

const emit = defineEmits(["back"]);

const handleIcon = () => {
    if (props.customBack) {
        emit("back");
    } else {
        // #ifdef H5
        history.back();
        // #endif
        // #ifndef H5
        uni.navigateBack();
        // #endif
    }
};
</script>

<style lang="scss" scoped>
.tig-navbar {
    .navbar-box {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: var(--nav-height);
        z-index: 200;
        background-color: #fff;

        &.border-bottom {
            border-bottom: 1px solid #f0f1f2;
        }

        .navbar {
            position: relative;
            height: 100%;

            .navbar-content {
                position: absolute;
                height: 100rpx;
                bottom: 0;
                left: 0;
                display: flex;
                align-items: center;
                width: 100%;

                .left {
                    width: 100rpx;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    .icon-houtui {
                        font-size: 40rpx;
                    }
                }
                .middle {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #000;
                    overflow: hidden;
                    .title {
                        font-size: 32rpx;
                    }
                }

                .right {
                    padding-right: 16rpx;
                    width: 100rpx;
                }
            }
        }
    }
}

.placeholder {
    width: 100%;
    height: 0;
    padding-top: var(--nav-height);
}
</style>
