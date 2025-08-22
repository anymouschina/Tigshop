<template>
    <view class="product-pic-con">
        <view class="nav-bg" />
        <template v-if="list.length > 0">
            <view class="product-bg">
                <swiper :indicator-dots="false" :circular="true" interval="3000" duration="500" @change="swiperChange">
                    <template v-for="(item, index) in list" :key="index">
                        <swiper-item>
                            <template v-if="!item.videoUrl">
                                <image :src="imageFormat(item.picUrl || '')" class="slide-image" @click="swiperImagePreview(index)" />
                                <template v-if="productInfo?.isSeckill ==1 ">
                                    <view  v-if="residueNum == 0" class="outsale">{{ $t("已售罄") }}</view>
                                </template>
                                <template v-else>
                                    <view v-if="productInfo.productStock == 0" class="outsale">{{ $t("已售罄") }}</view>
                                </template>
                            </template>
                            <template v-else>
                                <view class="video-box">
                                    <view v-show="!showVideo" class="cover-box" @click="handlePlayVideo">
                                        <image :src="imageFormat(item.videoCover ? item.videoCover : item.picUrl || '')" class="slide-image" />
                                        <view class="video-icon" />
                                    </view>
                                    <video
                                        v-show="showVideo"
                                        id="productVideo"
                                        class="product-video"
                                        :src="imageFormat(item.videoUrl)"
                                        :autoplay="false"
                                        :enable-progress-gesture="false"
                                        controls
                                        :loop="false"
                                        @pause="handlevideoPause"
                                        @error="handlevideoError"
                                        @ended="handlevideoEnded"
                                    />
                                </view>
                            </template>
                        </swiper-item>
                    </template>
                </swiper>
                <view v-show="list.length > 1 && !showVideo" class="pages">
                    <text>{{ currentPic }}</text>
                    /{{ list.length || 1 }}
                </view>
            </view>
        </template>
    </view>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, getCurrentInstance } from "vue";
import { imageFormat } from "@/utils/format";
import type { PicList, ProductItem, VideoList } from "@/types/product/product";

interface Iprops {
    picList: PicList[];
    productInfo: ProductItem;
    videoList: VideoList[];
    seckillValue: AnyObject;
}

const props = withDefaults(defineProps<Iprops>(), {
    picList: () => [] as PicList[],
    productInfo: () => ({}) as ProductItem,
    videoList: () => [] as VideoList[]
});

const residueNum = computed(() => {
    return props.seckillValue.seckillStock;
});

const currentPic = ref(1);

const videoData = computed(() => {
    return props.videoList[0] ? props.videoList[0] : ({} as VideoList);
});

const list = computed(() => {
    return videoData.value.videoUrl
        ? [
              {
                  ...videoData.value,
                  picUrl: props.picList[0]?.picUrl || ""
              },
              ...props.picList
          ]
        : props.picList;
});

const swiperChange = (e: any) => {
    currentPic.value = e.detail.current + 1;
    showVideo.value = false;
    videoContext?.pause();
};

const swiperImagePreview = (index: number) => {
    const images = list.value.map((item) => imageFormat(item.picUrl || ""));
    uni.previewImage({
        current: images[index],
        urls: images,
        indicator: "number",
        loop: true
    });
};

const instance = getCurrentInstance();
let videoContext: any;
const showVideo = ref(false);

const handlePlayVideo = () => {
    showVideo.value = true;
    videoContext?.play();
};

const handlevideoError = (e: Event) => {
    console.log("video error", e);
};

const handlevideoEnded = () => {
    showVideo.value = false;
};

const handlevideoPause = () => {
    // #ifdef APP-PLUS
    showVideo.value = false;
    // #endif
};

onMounted(() => {
    videoContext = uni.createVideoContext("productVideo", instance);
});
</script>

<style lang="scss" scoped>
.product-pic-con {
    position: relative;
    .nav-bg {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 9;
        width: 100%;
        height: 150rpx;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);
    }
}
.product-bg {
    position: relative;
    width: 100%;
    height: 750rpx;
    position: relative;
    background: #fff;

    .outsale {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50%;
        height: 50%;
        line-height: 180rpx;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.4);
        font-size: 48rpx;
        color: #ffffff;
        letter-spacing: 0;
        border-radius: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .video-box {
        width: 100%;
        height: 100%;

        .product-video {
            width: 100%;
            height: 100%;
        }

        .cover-box {
            width: 100%;
            height: 100%;
            position: relative;

            .video-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 110rpx;
                height: 110rpx;
                transform: translate(-50%, -50%);
                background-image: url("@/static/images/product/video-playing.png");
                background-size: cover;
            }
        }
    }

    swiper {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .slide-image {
        width: 100%;
        height: 100%;
    }

    .pages {
        visibility: visible;
        transition: all 500ms ease-in-out 0s;
        position: absolute;
        background-color: rgba(0, 0, 0, 0.2);
        height: 40rpx;
        padding: 0 40rpx 0 30rpx;
        border-radius: 40rpx 0 0 40rpx;
        right: 0;
        bottom: 30rpx;
        line-height: 40rpx;
        font-size: 20rpx;
        color: #fff;
    }
}

.product-bg .pages text {
    font-weight: bold;
    font-size: 30rpx;
}
.product-bg .slide-navigator .slide-image {
    width: 100%;
    height: 100%;
    border-radius: 15rpx;
}
.product-bg .wx-swiper-dot {
    width: 20rpx;
    height: 5rpx;
    border-radius: 3rpx;
}
.product-bg .wx-swiper-dots.wx-swiper-dots-horizontal {
    margin-bottom: 5rpx;
}

.product-pic-con {
    height: 750rpx;
    width: 750rpx;
    position: relative;
    background: #f2f2f2;
}
</style>
