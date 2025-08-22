<template>
    <tig-layout :title="titleMap[articleSn as keyof typeof titleMap]">
        <view class="rich-box">
            <rich-text class="rich-text" :nodes="articleData.content" />
        </view>
    </tig-layout>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { getArticle } from "@/api/article/article";

onLoad((options) => {
    if (options && options.articleSn) {
        articleSn.value = options.articleSn as "fwxy" | "ysxy";
        getArticleData();
    }
});

const articleSn = ref<"fwxy" | "ysxy">("fwxy");

const articleData = ref({
    content: ""
});

const titleMap = {
    fwxy: "服务协议",
    ysxy: "隐私政策"
};

const getArticleData = async () => {
    try {
        const result = await getArticle({ articleSn: articleSn.value }, "issueInfo");
        articleData.value = result.item;
    } catch (error) {
        console.error("获取文章失败:", error);
    }
};
</script>

<style>
page {
    background-color: #fff;
}
</style>

<style lang="scss" scoped>
.rich-box {
    padding: 24rpx 24rpx;

    .rich-text {
        overflow: hidden;
        :deep(p) {
            font-size: 24rpx;
            line-height: 2;
        }
        :deep(img) {
            max-width: 100%;
            width: 100%;
            display: block;
        }
    }
}
</style>
