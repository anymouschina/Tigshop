<template>
    <up-upload
        :preview-full-image="true"
        :file-list="fileLists"
        name="1"
        multiple
        :max-count="limit"
        :size-type="['original', 'compressed']"
        @after-read="handlePicSelect"
        @delete="handlePicDelete"
    />
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { imageFormat } from "@/utils/format";
import { getSecret, baseUrl } from "@/utils/request";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
    limit: {
        type: Number,
        default: 1
    },
    apiUrl: {
        type: String,
        default: "user/user/uploadImg"
    },
    modelValue: {
        type: [Array, Object],
        default: () => []
    },
    isValueArray: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(["update:modelValue"]);
interface FileLists {
    url: string;
}
const fileLists = ref<FileLists[]>([]);
watch(
    () => props.modelValue,
    (newVal: any) => {
        if (fileLists.value.length > 0) return;
        if (!newVal) return;
        if (typeof newVal == "object") {
            if (Array.isArray(newVal) && newVal.length === 0) {
                return;
            } else if (Object.values(newVal).length === 0 || !Object.values(newVal)[0]) {
                return;
            }
        }
        nextTick(() => {
            if (uni.$u.test.object(newVal)) {
                fileLists.value.push({
                    ...newVal,
                    url: imageFormat(newVal.picUrl)
                });
            } else {
                fileLists.value = newVal.map((item: any) => {
                    return {
                        ...item,
                        url: imageFormat(item.picUrl)
                    };
                });
                picsData.value = newVal;
            }
        });
    },
    {
        immediate: true,
        deep: true
    }
);

const picsData = ref<any[]>([]);

const handlePicSelect = (e: any) => {
    // 兼容多端
    if (e.file.length === 1 || props.limit === 1) {
        uploadFile(e.file[0]);
    } else {
        e.file.forEach((item: string) => {
            uploadFile(item);
        });
    }
};

const handlePicDelete = (e: any) => {
    fileLists.value.splice(e.index, 1);
    if (props.limit > 1 || props.isValueArray) {
        picsData.value.splice(e.index, 1);
        emit("update:modelValue", picsData.value);
    } else {
        emit("update:modelValue", { picName: "", picThumb: "", picUrl: "" });
    }
};

const uploadFile = (filePath: any) => {
    let url;
    uni.uploadFile({
        url: baseUrl + import.meta.env.VITE_API_PREFIX + props.apiUrl,
        filePath: filePath.url,
        name: "file",
        header: {
            Authorization: uni.getStorageSync("token"),
            Secret: getSecret()
        },
        success: (uploadFileRes: any) => {
            uni.hideLoading();
            const { data } = JSON.parse(uploadFileRes.data);
            url = data.picThumb;
            fileLists.value.push({
                url: imageFormat(url)
            });

            if (props.limit > 1 || props.isValueArray) {
                picsData.value.push({
                    picName: data.picName,
                    picThumb: data.picThumb,
                    picUrl: data.picUrl
                });
                emit("update:modelValue", picsData.value);
            } else {
                emit("update:modelValue", {
                    picName: data.picName,
                    picThumb: data.picThumb,
                    picUrl: data.picUrl
                });
            }

            uni.showToast({
                title: t("图片上传成功")
            });
        },
        fail: (error) => {
            uni.hideLoading();

            uni.showToast({
                title: t("图片上传失败"),
                icon: "none"
            });
        }
    });
};
</script>

<style lang="scss" scoped></style>
