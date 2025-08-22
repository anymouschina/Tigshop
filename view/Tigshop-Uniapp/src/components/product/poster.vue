<template>
    <view>
        <!-- 生成海报的canvas -->
        <canvas id="myCanvas" class="canvas-content" canvas-id="myCanvas" />
        <tig-popup v-model:show="show" background-color="transparent" position="center" :show-close="false" @close="$emit('update:modelValue', false)">
            <view class="poster-box" @touchmove.stop.prevent @longpress.stop="handleSave">
                <image :src="img" style="height: 100%; width: 100%" />
            </view>
            <view class="canvas-tip">{{ $t("长按可保存海报") }}</view>
        </tig-popup>
        <!-- <view v-show="show" class="my-canvas-box" @touchmove.stop.prevent @click="handleClose">
            <view class="canvas-tip">{{ $t("长按可保存海报") }}</view>
        </view> -->
    </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref } from "vue";
import { imageFormat } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
import type { ProductItem } from "@/types/product/product";
import { getMiniCode, getQrCode } from "@/api/common";
import { staticResource, currRoute, getImageInfo } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const instance = getCurrentInstance();
const props = defineProps<{
    modelValue: boolean;
    productId: number;
    productInfo: ProductItem;
    productPrice: string | number;
}>();

const emit = defineEmits(["update:modelValue"]);

const qrImg = ref("");
const show = ref(false);
const powerw = ref(0);

onMounted(async () => {
    const { windowWidth } = uni.getSystemInfoSync();
    powerw.value = windowWidth / 375;
    await __getQrCode();
    generatePoster();
});

const __getQrCode = async () => {
    try {
        // #ifdef H5
        const result = await getQrCode(location.href);
        qrImg.value = result;
        // #endif
        // #ifdef MP-WEIXIN
        const page = currRoute();
        const res = await getMiniCode(page ?? "", props.productId);
        qrImg.value = res;
        // #endif
        uni.showToast({
            title: t("正在生成海报，请稍后"),
            icon: "none",
            duration: 1000
        });
    } catch (error: any) {
        console.error(error);
        uni.showToast({
            title: error.message,
            icon: "none"
        });
    }
};

// 生成海报
const generatePoster = async () => {
    const userInfo = uni.getStorageSync("userInfo");
    const themeStore = useThemeStore();
    let context = uni.createCanvasContext("myCanvas", instance);
    context.draw();
    context.save();
    context.setFillStyle("#ffffff");
    context.fillRect(0, 0, 500, 900);
    context.draw();
    context.setFontSize(14);
    context.setFillStyle("#000000");
    context.fillText(userInfo.username ?? t("普通会员"), 100 * powerw.value, 48);
    context.setFontSize(12);
    context.setFillStyle("#999999");
    context.fillText(t("的分享"), 100 * powerw.value, 68);
    context.setFontSize(18);
    context.setFillStyle(themeStore.themeStyle["--general"]);
    context.fillText(`${props.productPrice}`, 20, 366 * powerw.value);
    // 绘制商品名称，这里是调用一个方法，按字符串长度进行分割换行。【可以做一个优化】
    drawText(props.productInfo.productName, 20, 379 * powerw.value, context);
    context.save();
    try {
        const avatarRes = await getImageInfo(userInfo.avatar ? imageFormat(userInfo.avatar) : staticResource("user/default_avatar.jpg"));
        // 这个就是绘制圆形头像
        context.beginPath();
        context.arc(50, 50, 28, 0, 2 * Math.PI);
        context.clip();
        context.drawImage(avatarRes.path, 20, 20, 70 * powerw.value, 70 * powerw.value);
        context.restore();
        context.draw(true, async () => {
            context.save();
            const picRes = await getImageInfo(imageFormat(props.productInfo.picOriginal!));
            context.drawImage(picRes.path, 15, 92, 245 * powerw.value, 245 * powerw.value);
            context.draw(true, () => {
                // 绘制小程序码
                // #ifdef MP-WEIXIN
                const fs = uni.getFileSystemManager();
                let codeimg = wx.env.USER_DATA_PATH + "/" + new Date().getTime() + ".png";
                fs.writeFile({
                    filePath: codeimg,
                    data: qrImg.value.slice(22),
                    encoding: "base64",
                    success: () => {
                        console.log("codeimg", codeimg);
                        context.drawImage(codeimg, 165, 360 * powerw.value, 100 * powerw.value, 100 * powerw.value);
                        context.draw(true, () => {
                            saveToImg();
                        });
                    }
                });

                // #endif
                // #ifdef H5
                context.drawImage(qrImg.value, 165, 360 * powerw.value, 100 * powerw.value, 100 * powerw.value);
                context.draw(true, () => {
                    saveToImg();
                });
                // #endif
            });
        });
    } catch (error) {
        console.error(error);
    }
};

// 商品名称文字换行
const drawText = (context: any, x: any, y: any, canvas: any) => {
    let strArr = [];
    let n = 11;
    for (let i = 0, l = context.length; i < l / n; i++) {
        let a = context.slice(n * i, n * (i + 1));
        strArr.push(a);
    }
    strArr.forEach((item, index) => {
        // 限制只能显示4行文字
        if (index > 3) {
            return;
        }
        y += 20;
        canvas.setFontSize(12);
        canvas.setFillStyle("#333333");
        canvas.fillText(item, x, y);
    });
};

const img = ref("");
const saveToImg = () => {
    uni.canvasToTempFilePath(
        {
            // 这里修改保存的图片格式
            fileType: "jpg",
            canvasId: "myCanvas",
            quality: 1,
            success: function (res) {
                img.value = res.tempFilePath;
                show.value = true;
                // console.log("img", img.value);
            },
            fail: (err) => {
                uni.showToast({
                    title: JSON.stringify(err),
                    icon: "none",
                    duration: 3000
                });
                show.value = false;
                console.log(err);
            }
        },
        instance
    );
};

const handleSave = () => {
    // #ifdef APP-PLUS||MP-WEIXIN
    uni.saveImageToPhotosAlbum({
        filePath: img.value,
        success: function () {
            uni.showToast({
                title: t("保存海报成功"),
                icon: "none",
                duration: 1500
            });
            setTimeout(() => {
                emit("update:modelValue", false);
            }, 1500);
        },
        fail: function (err) {
            console.error(err);
            uni.showToast({
                title: t("保存海报失败"),
                icon: "none",
                duration: 3000
            });
        }
    });
    // #endif
};

const handleClose = () => {
    emit("update:modelValue", false);
};
</script>

<style lang="scss" scoped>
.my-canvas-box {
    width: 100vw;
    height: 100vh;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 88;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.canvas-tip {
    color: #ffffff;
    font-size: 24rpx;
    margin-top: 30rpx;
    text-align: center;
}

.canvas-content {
    width: 550rpx;
    height: 950rpx;
    background-color: #ffffff;
    position: fixed;
    top: -9999px;
    left: -9999px;
}
.poster-box {
    width: 550rpx;
    height: 950rpx;
    border-radius: 20rpx;
    overflow: hidden;
}
</style>
