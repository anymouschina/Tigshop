<template>
    <tig-layout title="订单评价">
        <view class="comment-info">
            <template v-for="(item, index) in formState" :key="index">
                <view class="comment-item">
                    <template v-if="!item.isShowed">
                        <view class="white-card">
                            <view class="product flex">
                                <view class="product-img">
                                    <tig-image :src="item.picThumb" mode="aspectFit" />
                                </view>
                                <view class="product-info">
                                    <view class="product-name">
                                        {{ item.productName }}
                                    </view>
                                    <view class="product-price">
                                        <format-price :show-text="false" :is-bottom="false" :price-data="item.price" />
                                    </view>
                                    <template v-if="item.skuData && item.skuData.length > 0">
                                        <view class="sku-card">
                                            <view v-for="(skuItem, skuIndex) in item.skuData" :key="skuIndex" class="sku-item line1">{{ skuItem.value }}</view>
                                        </view>
                                    </template>
                                </view>
                            </view>
                            <view class="comment">
                                <view class="flex comment-cell">
                                    <view class="lable-text">{{ $t("商品评分") }}：</view>
                                    <view class="flex">
                                        <uni-rate
                                            :readonly="item.isCommentInfo"
                                            :value="item.commentRank"
                                            color="#bfbfbf"
                                            active-color="#ffa800"
                                            size="18"
                                            @change="onChange(index, $event)"
                                        />
                                        <text style="margin-left: 10rpx">{{ item.commentRank }}{{ $t("分") }}</text>
                                    </view>
                                </view>
                                <template v-if="!item.rankVerification">
                                    <view class="flex comment-cell">
                                        <view class="lable-text" />
                                        <view class="tips">{{ $t("请先评分商品") }}</view>
                                    </view>
                                </template>
                                <view class="comment-cell">
                                    <view v-if="!item.isCommentInfo" class="label-list flex-wrap">
                                        <template v-for="(lb, lBindex) in item.allCommentTag" :key="lBindex">
                                            <view :class="{ active: item.commentTag.includes(lb) }" class="label-item" @click="checkTag(index, lb)">
                                                <text>{{ lb }}</text>
                                            </view>
                                        </template>

                                        <view v-if="!item.isAdd" class="label-edit" @click="isShowadd(index)">
                                            <view />
                                            <view>{{ $t("自定义") }}</view>
                                        </view>
                                        <view v-else class="label-edit-input flex align-center justify-between">
                                            <view>
                                                <input v-model="tabInput" type="text" auto-focus :placeholder="$t('请输入自定义标签')" />
                                            </view>
                                            <tig-button class="btn" @click="tabAdd(index)">{{ $t("确定") }}</tig-button>
                                        </view>
                                    </view>
                                    <view v-else class="label-list">
                                        <template v-for="(lb, lBindex) in item.commentTag" :key="lBindex">
                                            <view class="label-item-txt">
                                                <text>{{ lb }}</text>
                                            </view>
                                        </template>
                                    </view>
                                </view>
                                <view class="comment-cell">
                                    <view class="textarea-box">
                                        <textarea
                                            v-model="item.content"
                                            cols="50"
                                            name="content"
                                            :placeholder="$t('商品是否给力？快分享你的购买心得吧~')"
                                            rows="5"
                                            :maxlength="500"
                                            style="border: 1px solid #d9d9d9; padding: 4px"
                                            :disabled="item.isCommentInfo"
                                        />
                                        <view class="strlangth">{{ $t("1-500字") }}</view>
                                    </view>
                                </view>
                                <view class="comment-cell flex align-center justify-between">
                                    <view class="tips">
                                        <text v-if="!item.contentVerification">{{ $t("请填写购买心得") }}</text>
                                    </view>
                                </view>
                                <view class="comment-cell">
                                    <view class="lable-text">{{ $t("添加图片") }}</view>
                                    <view class="pic-box flex-wrap">
                                        <template v-for="(product, picIndex) in item.showPics" :key="picIndex">
                                            <view class="pic-img" style="transition: opacity 0.2s linear; margin-right: 10px">
                                                <tig-image :src="product.picThumb" @click="imagePreview(imageFormat(product.picThumb))" />
                                                <view class="close-icon" @click="close(item, picIndex)">
                                                    <uni-icons type="clear" size="25" color="#cccccc" />
                                                </view>
                                            </view>
                                        </template>
                                        <!-- <template v-if="item.showPics.length > 0"> -->
                                        <tig-upload v-model="item.showPics" :count="9">
                                            <view class="add-img">
                                                <uni-icons type="plusempty" size="30" color="#cccccc" />
                                            </view>
                                        </tig-upload>
                                        <!-- </template> -->
                                    </view>
                                </view>
                                <view class="comment-cell">
                                    <tig-button class="tig-button" @click="onSubmit(item)">{{ $t("提交评论") }}</tig-button>
                                </view>
                            </view>
                        </view>
                    </template>
                </view>
            </template>
        </view>
    </tig-layout>
</template>

<script setup lang="ts">
import { getCommentData, updateCommentData } from "@/api/user/comment";
import { ref } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { imageFormat } from "@/utils/format";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const close = (item: any, index: number) => {
    item.showPics.splice(index, 1);
};
const onChange = (index: any, e: any) => {
    formState.value[index].commentRank = e.value;
};
const commentId = ref<string>("");
const labelList = ref([t("送货快"), t("质量很好"), t("服务周到"), t("正品"), t("很划算"), t("包装仔细"), t("价格实惠"), t("还可以"), t("相当好")]);
const formState = ref<any[]>([]);
const fetchCommentData = async (id: string) => {
    uni.showLoading({
        title: t("加载中")
    });
    try {
        const result = await getCommentData({ id: id });
        result.items.map((data: any) => {
            data.allCommentTag = JSON.parse(JSON.stringify(labelList.value)); // 使用深拷贝来创建独立的数组
            Object.assign(
                data,
                {
                    commentRank: 0,
                    content: "",
                    showPics: [],
                    commentTag: [],
                    isAdd: false,
                    rankVerification: true,
                    contentVerification: true,
                    isCommentInfo: data.commentInfo ? true : false
                },
                data.commentInfo
            );
        });
        Object.assign(formState.value, result.items);
        const allAreTrue = formState.value.every((obj: any) => obj.isShowed === 1);
        if (allAreTrue) {
            // #ifdef H5
            history.back();
            // #endif
            // #ifndef H5
            uni.navigateBack();
            // #endif
            uni.$emit("commentFinished", true);
        }
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none",
            duration: 1000
        });
    } finally {
        uni.hideLoading();
    }
};
const tabInput = ref("");
const isShowadd = (index: number) => {
    formState.value[index].isAdd = !formState.value[index].isAdd;
};
const tabAdd = (index: number) => {
    if (tabInput.value !== "") {
        const newCommentTag = JSON.parse(JSON.stringify(formState.value[index].allCommentTag));
        if (newCommentTag.includes(tabInput.value)) {
            uni.showToast({
                title: t("您已添加相同标签"),
                icon: "none",
                duration: 1000
            });
            return;
        }
        newCommentTag.push(tabInput.value);
        formState.value[index].allCommentTag = newCommentTag;
        checkTag(index, tabInput.value);
    }
    tabInput.value = "";
    formState.value[index].isAdd = false;
};
const checkTag = (index: number, label: string) => {
    let arr = formState.value[index].commentTag;
    if (arr.includes(label)) {
        formState.value[index].commentTag = arr.filter((item: any) => item !== label);
    } else {
        arr.push(label);
    }
};
const imagePreview = (url: string) => {
    uni.previewImage({
        urls: [url]
    });
};
const onSubmit = async (item: any) => {
    if (item.commentRank < 1) {
        item.rankVerification = false;
        return;
    }
    if (item.content == "") {
        item.contentVerification = false;
        return;
    }
    try {
        const data = {
            productId: item.productId,
            orderId: item.orderId,
            orderItemId: item.itemId,
            shopId: item.shopId,
            commentRank: item.commentRank,
            commentTag: item.commentTag,
            content: item.content,
            showPics: item.showPics
        };
        await updateCommentData(data);
        item.rankVerification = true;
        item.contentVerification = true;
        uni.showToast({
            title: t("提交成功"),
            icon: "none",
            duration: 1000
        });
        setTimeout(() => {
            fetchCommentData(commentId.value);
        }, 500);
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none",
            duration: 1000
        });
    }
};
onLoad((option) => {
    if (option) {
        const { id } = option;
        if (id) {
            commentId.value = id;
            // 获取详情数据
            fetchCommentData(id);
        }
    }
});

// 关闭预览图片
onUnload(() => {
    // #ifdef  H5 || APP
    uni.closePreviewImage();
    // #endif
});
</script>

<style lang="scss" scoped>
.comment-info {
    padding: 20rpx;
    .comment-item {
        .white-card {
            background-color: #fff;
            padding: 20rpx;
            border-radius: 20rpx;
            margin-bottom: 20rpx;
            .product {
                margin-bottom: 25rpx;
                .product-img {
                    width: 130rpx;
                    height: 130rpx;
                    background-color: rd;
                    margin-right: 20rpx;
                    overflow: hidden;
                }
                .product-info {
                    flex: 1;
                    font-size: 24rpx;
                    line-height: 32rpx;
                    .product-price {
                        color: var(--general);
                        margin-top: 10rpx;
                    }
                }
            }
            .comment {
                .comment-cell {
                    font-size: 24rpx;
                    padding-bottom: 20rpx;
                    .lable-text {
                        width: 130rpx;
                    }
                    .tips {
                        color: var(--general);
                    }
                    .label-list {
                        .label-item,
                        .label-edit,
                        .label-item-txt {
                            display: inline-block;
                            background-color: #f5f5f5;
                            padding: 8rpx 15rpx;
                            margin-right: 15rpx;
                            margin-bottom: 15rpx;
                            border-radius: 5rpx;
                        }
                        .active {
                            background-color: var(--general);
                            color: #fff;
                        }
                        .label-edit-input {
                            width: 100vw;
                            padding: 10rpx 0;
                            input {
                                width: 68vw;
                                font-size: 24rpx;
                                padding: 15rpx;
                                background-color: #f5f5f5;
                            }
                            .btn {
                                padding: 16rpx 30rpx;
                                border-radius: 5rpx;
                            }
                        }
                    }
                    .label-list-edit {
                        .label-item {
                            .iconfont {
                                margin-left: 10rpx;
                            }
                        }
                        .label-edit-input {
                            input {
                                width: 200rpx;
                            }
                        }
                    }
                    .textarea-box {
                        width: 100%;
                        padding: 20rpx 20rpx 0rpx;
                        border-radius: 10rpx;
                        background-color: #f5f5f5;
                        textarea {
                            width: 98%;
                            font-size: 24rpx;
                            border: none !important;
                        }
                    }

                    .strlangth {
                        text-align: end;
                        color: #999;
                        font-size: 22rpx;
                        padding: 2rpx 6px 10rpx;
                    }
                    .pic-box {
                        margin-top: 20rpx;
                        .pic-img {
                            width: 130rpx;
                            height: 130rpx;
                            margin-bottom: 20rpx;
                            position: relative;
                            uni-image {
                                border-radius: 10rpx;
                            }
                            .close-icon {
                                position: absolute;
                                top: -20rpx;
                                right: -20rpx;
                            }
                        }
                        .add-img {
                            width: 130rpx;
                            height: 130rpx;
                            border: 1rpx solid #c6c4c4;
                            border-radius: 10rpx;
                            text-align: center;
                            line-height: 130rpx;
                        }
                    }
                    .tig-button {
                        width: 100%;
                        padding: 20rpx 0;
                    }
                }
            }
        }
    }
}
</style>
