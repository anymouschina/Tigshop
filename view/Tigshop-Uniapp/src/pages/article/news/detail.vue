<template>
    <tig-layout title="资讯中心">
        <view v-if="!loading" class="article-center">
            <view class="title">{{ formArticleState.articleTitle }}</view>
            <view v-if="formArticleState.addTime" class="time">{{ $t("时间") }}：{{ formArticleState.addTime }}</view>
            <view v-if="formArticleState.content" class="content">
                <template v-if="formArticleState.articleThumb">
                    <tig-image :src="formArticleState.articleThumb" />
                </template>
                <view class="v-html" v-html="formArticleState.content" />
            </view>
            <template v-else>
                <empty-box mode="news" :text="$t('暂无内容')" />
            </template>
            <tig-fixed-placeholder height="70rpx" background-color="#fff">
                <view class="navigation">
                    <view class="navigation-btn navigation-btn-left">
                        <navigator
                            v-if="formArticleState.prev"
                            :url="`/pages/article/news/detail?id=${formArticleState.prev?.articleId}`"
                            hover-class="navigator-hover"
                            open-type="navigate"
                        >
                            «{{ $t("上一篇") }}：{{ formArticleState.prev?.articleTitle }}
                        </navigator>
                    </view>
                    <view class="navigation-btn navigation-btn-right">
                        <navigator
                            v-if="formArticleState.next"
                            :url="`/pages/article/news/detail?id=${formArticleState.next?.articleId}`"
                            hover-class="navigator-hover"
                            open-type="navigate"
                        >
                            {{ $t("下一篇") }}：{{ formArticleState.next?.articleTitle }}»
                        </navigator>
                    </view>
                </view>
            </tig-fixed-placeholder>
        </view>
    </tig-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getArticle } from "@/api/article/article";
import type { ArticleFormState } from "@/types/article/article";
import { onLoad } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
    id: {
        type: String || Number,
        default: ""
    }
});

const loading = ref(false);
const formArticleState = ref<ArticleFormState>({});

const _getArticle = async () => {
    uni.showLoading({
        title: t("加载中")
    });
    try {
        loading.value = true;
        const result = await getArticle({ id: props.id }, "newsInfo");
        Object.assign(formArticleState.value, result.item);
        formArticleState.value.prev = result.prev;
        formArticleState.value.next = result.next;
    } catch (error: any) {
        console.error(error.message);
    } finally {
        loading.value = false;
        uni.hideLoading();
    }
};

onLoad(() => {
    _getArticle();
});
</script>

<style lang="scss" scoped>
page {
    background-color: #fff;
}
.article-center {
    padding: 24rpx;
    .title {
        line-height: 1.5;
        font-weight: 600;
        text-align: left;
        color: #000000;
        font-size: 32rpx;
    }
    .time {
        color: #888888;
        padding: 20rpx 0;
        text-align: center;
        font-size: 24rpx;
    }
    .content {
        padding: 24rpx 12rpx;
        .v-html {
            :deep(p) {
                font-size: 24rpx;
                line-height: 2;
            }
            :deep(img) {
                max-width: 100%;
                width: 100%;
            }
        }
    }
}
.empty {
    color: #999;
    padding: 48rpx 0;
    text-align: center;
    font-size: 28rpx;
}
.navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 24rpx;
    padding: 0 24rpx;
    height: 100%;

    .navigation-btn {
        cursor: pointer;
        flex: 1;
        width: 50%;
        navigator {
            white-space: nowrap;
            max-width: 80%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
    .navigation-btn-left {
        display: flex;
    }
    .navigation-btn-right {
        display: flex;
        justify-content: flex-end;
    }
}
</style>
