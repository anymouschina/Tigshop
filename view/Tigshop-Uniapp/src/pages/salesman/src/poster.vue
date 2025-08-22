<template>
    <view class="poster-main">
        <template v-if="img">
            <image :src="img" class="img-box" :style="{ height: boxInfo.boxHeight + 'px' }" @longpress.stop="handleSave" />
        </template>
    </view>
    <canvas :id="id" class="canvas-content" :style="{ height: boxInfo.boxHeight + 'px' }" :canvas-id="id" />
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, reactive, ref, watch } from "vue";
import { imageFormat } from "@/utils/format";
import { staticResource, getImageInfo, saveImageToAlbum } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const instance = getCurrentInstance();
const userInfo = uni.getStorageSync("userInfo");
const props = defineProps({
    id: {
        type: String,
        default: "myCanvas"
    },
    currentData: {
        type: Object,
        default: () => {}
    },
    imgHeight: {
        type: Number,
        default: 0
    },
    currentPic: {
        type: String,
        default: ""
    },
    activeType: {
        type: String,
        default: ""
    },
    qrcodePath: {
        type: String,
        default: () => ""
    }
});
const img = ref("");

const calculateProportionalHeight = (originalWidth: number, originalHeight: number, containerWidth = 260) => {
    let newHeight = (originalHeight * containerWidth) / originalWidth;
    return { width: containerWidth, height: newHeight };
};

const boxInfo = reactive({
    boxHeight: 0,
    boxWidth: 260,
    imgHeight: 0,
    imgWidth: 0
});

// 商品名称文字换行
const drawText = (context: any, x: any, y: any, canvas: any) => {
    let strArr = [];
    let n = 12;
    for (let i = 0, l = context.length; i < l / n; i++) {
        let a = context.slice(n * i, n * (i + 1));
        strArr.push(a);
    }
    strArr.forEach((item, index) => {
        if (index > 3) {
            return;
        }
        y += 15;
        canvas.setFontSize(12);
        canvas.fillText(item, x, y);
    });
    return y;
};

const createPoster = async () => {
    const nickname = userInfo.nickname ?? t("普通会员");
    const avatarSrc = userInfo.avatar ? imageFormat(userInfo.avatar) : staticResource("user/defaultAvatar.jpg");
    let context = uni.createCanvasContext(props.id, instance);
    context.draw();
    context.setFillStyle("#ffffff");

    try {
        const currentPicRes = await getImageInfo(imageFormat(props.currentPic));

        const { height, width } = calculateProportionalHeight(currentPicRes.width, currentPicRes.height);

        boxInfo.boxHeight = height + 135;
        boxInfo.imgHeight = height;
        boxInfo.imgWidth = width;

        context.fillRect(0, 0, boxInfo.boxWidth, boxInfo.boxHeight);

        context.draw(false, async () => {
            const avatarRes = await getImageInfo(avatarSrc);
            context.save();
            context.beginPath();
            context.arc(35, boxInfo.imgHeight + 25, 15, 0, 2 * Math.PI);
            context.clip();
            context.drawImage(avatarRes.path, 15, boxInfo.imgHeight + 5, 40, 40);
            context.restore();
            setTimeout(() => {
                context.draw(true, async () => {
                    context.drawImage(currentPicRes.path, 0, 0, boxInfo.imgWidth, boxInfo.imgHeight);
                    context.draw(true, async () => {
                        const qrcodeRes = await getImageInfo(props.qrcodePath);
                        // 绘制二维码
                        context.drawImage(qrcodeRes.path, boxInfo.boxWidth - 80, boxInfo.imgHeight + 50, 70, 70);
                        // 绘制文字
                        context.setFontSize(13);
                        context.setFillStyle("#000000");
                        context.fillText(nickname, 55, boxInfo.imgHeight + 30);
                        context.setFontSize(12);
                        const y = drawText(props.currentData.productName, 20, boxInfo.imgHeight + 50, context);
                        context.setFontSize(13);
                        context.setFillStyle("#999999");
                        context.fillText(t("为您推荐"), 55 + nickname.length * 15, boxInfo.imgHeight + 30);
                        context.setFontSize(18);
                        context.setFillStyle("#ea122c");
                        context.fillText(formatPrice(props.currentData.productPrice), 20, y + 30);
                        // 不加延迟小程序会出现诡异问题
                        setTimeout(() => {
                            context.draw(true);
                            setTimeout(() => {
                                saveToImg();
                            }, 50);
                        }, 50);
                    });
                });
            }, 50);
        });
    } catch (error) {
        console.error(error);
    }
};

const formatPrice = (price: number) => {
    if (isNaN(price)) return "0.00";
    return price.toFixed(2);
};

const saveToImg = () => {
    uni.canvasToTempFilePath(
        {
            fileType: "jpg",
            canvasId: props.id,
            quality: 1,
            destHeight: boxInfo.boxHeight * 2,
            destWidth: boxInfo.boxWidth * 2,
            success: function (res) {
                img.value = res.tempFilePath;
            },
            fail: (err) => {
                uni.showToast({
                    title: JSON.stringify(err),
                    icon: "none",
                    duration: 3000
                });
                console.log(err);
            }
        },
        instance
    );
};

const handleSave = () => {
    // #ifdef APP-PLUS||MP-WEIXIN
    uni.showModal({
        title: t("提示"),
        content: t("确定要保存分享海报吗？"),
        success: function (res) {
            if (res.confirm) {
                saveImageToAlbum(img.value)
                    .then(() => {
                        uni.showToast({
                            title: t("保存成功"),
                            icon: "none"
                        });
                    })
                    .catch((err) => {
                        uni.showToast({
                            title: t("保存失败"),
                            icon: "none"
                        });
                        console.error(err);
                    });
            }
        }
    });
    // #endif
};

const currentDataCopy = ref<any>();
watch(
    () => props.activeType,
    () => {
        if (props.activeType && props.activeType === "poster") {
            if (!currentDataCopy.value) {
                nextTick(() => {
                    createPoster();
                });
                currentDataCopy.value = JSON.parse(JSON.stringify(props.currentData));
            } else if (currentDataCopy.value.productId !== props.currentData.productId) {
                img.value = "";
                nextTick(() => {
                    createPoster();
                });
                currentDataCopy.value = JSON.parse(JSON.stringify(props.currentData));
            }
        }
    },
    {
        immediate: true
    }
);
</script>

<style lang="scss" scoped>
.poster-main {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
}
.img-box {
    width: 500rpx;
    box-shadow: 0 2px 16px 0 #0000001a;
    box-sizing: content-box;
}
.canvas-content {
    width: 260px;
    position: fixed;
    top: -9999px;
    left: -9999px;
}
</style>
