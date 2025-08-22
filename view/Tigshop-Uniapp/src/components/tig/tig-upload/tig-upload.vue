<template>
    <view style="height: inherit; width: inherit" @click="handleChoose">
        <slot />
    </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getSecret, baseUrl } from "@/utils/request";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
    count: {
        type: Number,
        default: 1
    },
    modelValue: {
        type: String,
        default: ""
    },
    requestUrl: {
        type: String,
        default: "user/user/uploadImg"
    }
});
const files = ref<string[]>([]);
const emit = defineEmits(["update:modelValue", "change"]);

const handleChoose = () => {
    uni.chooseImage({
        count: props.count,
        success: async (res: any) => {
            uni.showLoading({
                title: t("上传中...")
            });
            res.tempFilePaths.map((file: string) => {
                uni.uploadFile({
                    url: baseUrl + import.meta.env.VITE_API_PREFIX + props.requestUrl,
                    filePath: file,
                    name: "file",
                    header: {
                        Authorization: uni.getStorageSync("token"),
                        Secret: getSecret()
                    },
                    success: (uploadFileRes) => {
                        if (props.count > 1) {
                            files.value.push(JSON.parse(uploadFileRes.data).data);
                            emit("update:modelValue", files.value);
                            uni.hideLoading();
                        } else {
                            uni.showToast({
                                title: t("图片上传成功")
                            });
                            emit("change");
                            uni.hideLoading();
                        }
                    },
                    fail: (error) => {
                        uni.hideLoading();
                        uni.showToast({
                            title: t("图片上传失败"),
                            icon: "none"
                        });
                    }
                });
            });
        },
        fail: (error) => {
            uni.showToast({
                title: t("图片选择失败"),
                icon: "none"
            });
        }
    });
};
</script>

<style lang="scss" scoped></style>
