<template>
    <view v-if="show" class="splash-ad">
        <image v-if="adType === 'image'" :src="adUrl" class="ad-img" mode="aspectFill" @load="onLoaded" @click="handleAdClick" />
        <video
            v-else-if="adType === 'video'"
            :src="adUrl"
            class="ad-video"
            :autoplay="true"
            :controls="false"
            :muted="true"
            :loop="true"
            @ended="closeAd"
            @loadedmetadata="onLoaded"
            @click="handleAdClick"
        />
        <view v-if="loaded" class="close-btn" @click="closeAd">{{ countdown }} 跳过</view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { urlFormat } from "@/utils/format";

const props = defineProps<{
    adType: "image" | "video";
    adUrl: string;
    duration?: number;
    redirectType?: string;
    redirectUrl?: string;
}>();

const show = ref(true);
const loaded = ref(false);
const countdown = ref(props.duration || 3);
let timer: any = null;
const emit = defineEmits(["close"]);

const closeAd = () => {
    show.value = false;
    clearInterval(timer); // 销毁倒计时
    // if (props.redirectType == "1") {
    //     uni.navigateTo({
    //         url: urlFormat(props.redirectUrl || "")
    //     });
    // }
    emit("close");
};
const handleAdClick = () => {
    console.log("123132132");
    // const redirect = JSON.parse(props.redirectUrl || "{}");
    if (props.redirectType == "1") {
        uni.navigateTo({
            url: urlFormat(props.redirectUrl || "")
        });
        clearInterval(timer); // 销毁倒计时
        emit("close");
    }
};

const onLoaded = () => {
    loaded.value = true;
    timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            closeAd();
        }
    }, 1000);
};
</script>
<style lang="scss">
.close-btn {
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 10rpx 24rpx;
    border-radius: 30rpx;
    font-size: 28rpx;
    z-index: 100001;
    pointer-events: auto;
}
/* #ifdef MP-WEIXIN */
.close-btn {
    position: fixed;
    top: 103rpx;
    left: 15rpx;
}
/* #endif */

/* #ifdef H5 */
.close-btn {
    position: fixed;
    top: 40rpx;
    right: 40rpx;
}
/* #endif */

.splash-ad {
    position: fixed;
    z-index: 99999;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ad-img,
.ad-video {
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    display: block;
}
</style>
