<template>
    <view class="page-content">
        <view class="thanos-layout">
            <view class="thanos-layout-header">
                <view class="wapim-conversation-banner">
                    <view class="shop-info" @click="returnFun">
                        <view class="iconfont icon-houtui" />
                    </view>
                    <view class="right-opt" @click="handleToList(`/pages/im/list`)">
                        <text class="ico-history wapim-conversation-banner-history" />
                    </view>
                </view>
            </view>
            <view class="thanos-layout-main-content" @click="handleSetRead">
                <scroll-view class="message-scroll" :scroll-top="scrollTop" scroll-y="true" @scroll="handleScroll">
                    <view class="message-box">
                        <view v-if="loadend" class="empty-text">{{ $t("已经没有更多消息了") }}</view>
                        <template v-for="(item, index) in messageList" :key="item.id">
                            <view
                                class="thanos-rich-message"
                                :class="[
                                    item.type == 2 ? 'in' : item.type == 1 ? 'out' : '',
                                    item.messageType === 'custom' && item.type == 1 ? 'card-type' : item.messageType === 'image' ? 'image-type' : ''
                                ]"
                            >
                                <view v-if="item.messageType !== 'product' && item.messageType !== 'order'" class="message-time">
                                    <span>{{ item.sendTime }}</span>
                                </view>
                                <view v-if="item.type === 3" class="message-time">
                                    <span>{{ item.content.content }}</span>
                                </view>
                                <view
                                    v-if="item.type != 3 && item.messageType !== 'product' && item.messageType !== 'order'"
                                    class="message-content message-content-left"
                                >
                                    <view class="bg-pic circle-bg-pic thanos-view thanos-hairline--surround message-avatar">
                                        <view
                                            class="bg-pic-content"
                                            :style="{
                                                backgroundImage: `url(${item.type === 1 ? imageFormat(item.user?.avatar) : imageFormat(shopLogo)})`
                                            }"
                                        />
                                    </view>
                                    <view class="message-content-inner">
                                        <template v-if="item.messageType">
                                            <view class="message-context">
                                                <view class="thanos-text-message">
                                                    <view v-if="item.messageType === 'text'">
                                                        <emojiHtml :content="item.content.content" />
                                                    </view>

                                                    <view v-if="item.messageType === 'image'" class="message-image">
                                                        <tig-image :src="item.content.pic" />
                                                    </view>
                                                    <view v-if="item.messageType === 'custom'">
                                                        <view v-if="item.content.product" class="custom-message-product">
                                                            <view class="product-img" @click="handleLink(`detail`, item)">
                                                                <tig-image v-if="item.content.product.picUrl" :src="item.content.product.picUrl" />
                                                            </view>
                                                            <view class="product-info">
                                                                <view class="product-name">
                                                                    {{ item.content.product.productName }}
                                                                </view>
                                                                <view class="product-price">
                                                                    <format-price
                                                                        :font-style="{ fontSize: '28rpx' }"
                                                                        :currency-style="{
                                                                            fontSize: '22rpx'
                                                                        }"
                                                                        :decimals-style="{
                                                                            fontSize: '24rpx'
                                                                        }"
                                                                        :price-data="item.content.product.productPrice"
                                                                    />
                                                                </view>
                                                            </view>
                                                        </view>
                                                        <view v-if="item.content.order" class="custom-message-order" @click="handleLink(`order`, item)">
                                                            <view class="tit">
                                                                {{ item.content.order.orderStatusName }}
                                                            </view>
                                                            <view class="info">
                                                                <view class="product-img">
                                                                    <tig-image v-if="item.content.order.picUrl" :src="item.content.order.picUrl" />
                                                                </view>
                                                                <view class="product-info">
                                                                    <view class="product-name">
                                                                        {{ item.content.order.productName }}
                                                                    </view>
                                                                    <view class="product-txt">
                                                                        {{
                                                                            isOverseas()
                                                                                ? $t("共{0}件商品，合计", [item.content.order.productNum])
                                                                                : `共${item.content.order.productNum}件商品，合计`
                                                                        }}
                                                                        <format-price
                                                                            :font-style="{ fontSize: '28rpx' }"
                                                                            :currency-style="{
                                                                                fontSize: '22rpx'
                                                                            }"
                                                                            :decimals-style="{
                                                                                fontSize: '24rpx'
                                                                            }"
                                                                            :price-data="item.content.order.totalAmount"
                                                                        />
                                                                    </view>
                                                                </view>
                                                            </view>
                                                        </view>
                                                    </view>
                                                </view>
                                                <span class="message-status" />
                                            </view>
                                        </template>
                                    </view>
                                    <view v-if="item.type === 1" class="read-status" :class="[item.isRead ? 'read' : 'unread']">
                                        {{ $t(item.isRead ? "已读" : "未读") }}
                                    </view>
                                </view>
                                <view v-if="item.messageType === 'product'" class="im-goods-card">
                                    <view class="content">
                                        <view class="pic">
                                            <tig-image :src="item.picUrl" />
                                        </view>
                                        <view class="desc">
                                            <view class="title">
                                                {{ item.productName }}
                                            </view>
                                            <view class="price">
                                                <format-price
                                                    :font-style="{ fontSize: '32rpx' }"
                                                    :currency-style="{
                                                        fontSize: '22rpx'
                                                    }"
                                                    :decimals-style="{
                                                        fontSize: '24rpx'
                                                    }"
                                                    :price-data="item.productPrice"
                                                />
                                            </view>
                                        </view>
                                    </view>
                                    <view class="line" />
                                    <view class="send" @click="sendGoods(item)">{{ $t("发送宝贝") }}</view>
                                </view>
                            </view>
                        </template>
                    </view>
                </scroll-view>
            </view>
            <view class="thanos-layout-footer">
                <view class="wapim-inputer">
                    <view class="thanos-hairline--top-bottom wapim-main-inputer">
                        <view class="input-box">
                            <view class="rich-input">
                                <up-input
                                    v-model="textAreaValue"
                                    style="height: 100%"
                                    placeholder=""
                                    border="none"
                                    :adjust-position="adjustPosition"
                                    @confirm="sendTxt"
                                    @change="onInput"
                                    @focus="onFocus"
                                    @blur="showKeyboard = false"
                                    @keyboardheightchange="handleKeyboardheightchange"
                            /></view>
                        </view>
                        <view class="wapim-inputer-operation">
                            <span class="operation face" @click="showEmojiHandle" />
                            <template v-if="hasTxt === true">
                                <span class="operation send" @click="sendTxt">{{ $t("发送") }}</span>
                            </template>
                            <template v-else>
                                <view class="operation plus" @click="showMoreHandle" />
                            </template>
                        </view>
                    </view>
                    <view v-show="moreHandle" class="wapim-inputer-plugin">
                        <view class="wapim-inputer-file-picker">
                            <view class="file-inputer-plugin">
                                <up-upload name="6" multiple :max-count="1" @after-read="afterRead">
                                    <view class="pic-item plugin-item">
                                        <view class="photo icon" />
                                        <span class="title">{{ $t("相册") }}</span>
                                    </view>
                                </up-upload>
                                <!-- <view class="goods-list-item plugin-item">
                                    <view class="photo icon"></view>
                                    <span class="title">商品</span>
                                </view> -->
                            </view>
                        </view>
                    </view>
                    <view v-show="moreEmoji" class="wapim-inputer-plugin">
                        <view class="wapim-inputer-file-picker">
                            <view class="file-emoji-plugin">
                                <Emoji @insert-emoji="onInsertEmoji" />
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>
        <promptTone ref="promptToneRef" />
    </view>
</template>
<script lang="ts" setup>
import { ref, nextTick, reactive, getCurrentInstance, computed, onMounted } from "vue";
import WebSocketClient from "@/utils/websocket";
import { sendMessage, getConversationMessage, setRead } from "@/api/im/im";
import { getShopDetail } from "@/api/shop/shop";
import { getProductDetail } from "@/api/product/product";
import { getOrder } from "@/api/user/order";
import { imageFormat } from "@/utils/format";
import { getElementRect } from "@/utils/index";
import Emoji from "./src/Emoji.vue";
import emojiHtml from "./src/emojiHtml.vue";
import promptTone from "./src/promptTone.vue";
import { onLoad, onReady } from "@dcloudio/uni-app";
import { useConfigStore } from "@/store/config";
import { getSecret, baseUrl } from "@/utils/request";
import { staticResource, isJsonString } from "@/utils";
import { useI18n } from "vue-i18n";
import { isOverseas } from "@/utils";
import { useUserStore } from "@/store/user";

const { t } = useI18n();

const configStore = useConfigStore();

const userStore = useUserStore();

const filterParams = reactive<any>({
    firstId: -1,
    sortOrder: "desc",
    userFrom: "",
    shopId: 0
});
const messageList = ref<any[]>([]);
const textAreaValue = ref<string>("");
const hasTxt = ref<boolean>(false);
const moreHandle = ref<boolean>(false);
const moreEmoji = ref<boolean>(false);
let isRecord = ref<boolean>(true);
let lastScrollTop = ref<number>(0);
const loadend = ref<boolean>(false);

const scrollTop = ref(0);
const instance = getCurrentInstance();

const returnFun = () => {
    // #ifdef H5
    history.back();
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
};

const messageScrollHeight = ref(0);
const messageBoxHeight = ref(0);
const getMessageScrollHeight = async () => {
    try {
        const result = await getElementRect(".message-scroll", instance);
        messageScrollHeight.value = result!.height;
    } catch (error) {
        console.error("Error getting box info:", error);
    }
};
const getMessageBoxHeight = async () => {
    try {
        const result = await getElementRect(".message-box", instance);
        messageBoxHeight.value = result!.height;
    } catch (error) {
        console.error("Error getting box info:", error);
    }
};

const scrollToBottom = async () => {
    await getMessageBoxHeight();
    await getMessageScrollHeight();
    console.log("messageScrollHeight", messageScrollHeight.value, "messageBoxHeight", messageBoxHeight.value);
    if (messageScrollHeight.value && messageBoxHeight.value) {
        const top = messageBoxHeight.value - messageScrollHeight.value;
        if (top && top > 0) {
            scrollTop.value = top;
        }
    }
};

const handleScroll = (event: any) => {
    handleSetRead();
    if (isRecord.value) {
        lastScrollTop.value = scrollTop.value;
        isRecord.value = false;
    }
    if (event.detail.scrollTop == 0 && loadend.value == false && messageList.value.length > 0) {
        filterParams.firstId = messageList.value[0].id;
        _getConversationMessage();
    }
};
// 监听实时输入事件
function onInput(value: string) {
    hasTxt.value = value.length > 0 ? true : false;
}
const adjustPosition = computed(() => {
    // #ifdef MP-WEIXIN
    return false;
    // #endif
    return true;
});
const keyboardHeight = ref(0);
const showKeyboard = ref(false);
const handleKeyboardheightchange = (e: any) => {
    // #ifdef MP-WEIXIN
    keyboardHeight.value = e.detail.height;
    console.log("handleKeyboardheightchange", e.detail.height);
    // #endif
};

const onFocus = () => {
    showKeyboard.value = true;
    moreEmoji.value = false;
    moreHandle.value = false;
};
const onInsertEmoji = (emoji: string) => {
    textAreaValue.value += "[" + emoji + "]";
    // #ifdef MP-WEIXIN
    hasTxt.value = textAreaValue.value.length > 0 ? true : false;
    //  #endif
};
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        if (!event.shiftKey) {
            // 处理 Enter 的逻辑
            handleSendMessage();
            event.preventDefault(); // 阻止默认的换行行为
        }
    } else {
    }
};

const afterRead = (files: any) => {
    if (Array.isArray(files.file)) {
        for (const file of files.file) {
            uploadFile(file);
        }
    } else {
        uploadFile(files.file[0]);
    }
};

const uploadFile = (filePath: any) => {
    uni.uploadFile({
        url: baseUrl + import.meta.env.VITE_API_PREFIX + "user/user/uploadImg",
        filePath: filePath.url,
        name: "file",
        header: {
            Authorization: uni.getStorageSync("token"),
            Secret: getSecret()
        },
        success: (uploadFileRes: any) => {
            const { data } = JSON.parse(uploadFileRes.data);
            handleSendMessage("image", { pic: data.picUrl });
        },
        fail: (error) => {I
            console.log("error", error);
            uni.showToast({
                title: t("图片上传失败"),
                icon: "none"
            });
        }
    });
};

const sendTxt = () => {
    if (!textAreaValue.value) return;
    handleSendMessage();
};
const sendGoods = (product: any) => {
    handleSendMessage("custom", { product });
};

const showMoreHandle = () => {
    uni.hideKeyboard();
    moreHandle.value = !moreHandle.value;
    moreEmoji.value = false;

    nextTick(() => {
        scrollToBottom();
    });
};
const showEmojiHandle = () => {
    uni.hideKeyboard();
    moreEmoji.value = !moreEmoji.value;
    moreHandle.value = false;

    nextTick(() => {
        scrollToBottom();
    });
};

const _getConversationMessage = async () => {
    try {
        const result = await getConversationMessage(filterParams);
        if (result.records.length == 0) {
            loadend.value = true;
            return;
        }
        messageList.value = [...result.records, ...messageList.value];
        nextTick(async () => {
            if (filterParams.firstId == -1) {
                await scrollToBottom();
            } else {
                setTimeout(() => {
                    if (lastScrollTop.value) {
                        scrollTop.value = lastScrollTop.value; // 恢复到之前的滚动位置
                        isRecord.value = true;
                    }
                }, 0);
            }
        });
    } catch (error) {
        console.error(error);
    }
};

const handleSendMessage = async (type?: string, info?: any) => {
    try {
        const result = await sendMessage({
            content: {
                messageType: type || "text",
                content: textAreaValue.value || "",
                ...info
            },
            conversationId: filterParams.conversationId,
            shopId: filterParams.shopId,
            productId: filterParams.productId,
            orderId: filterParams.orderId
        });
        textAreaValue.value = "";
        hasTxt.value = false;
        moreHandle.value = false;
        moreEmoji.value = false;
        messageList.value = [...messageList.value, result];
        nextTick(() => {
            scrollToBottom();
        });
    } catch (error: any) {
        console.log(error);
    } finally {
    }
};

const shopInfo = ref<any>({});
const _getShopDetail = async (id: number) => {
    try {
        const result = await getShopDetail(id);
        shopInfo.value = result;
    } catch (error) {
        console.error(error);
    }
};
const _getProductDetail = async (id: any) => {
    try {
        const result = await getProductDetail(id);
        let productInfo: any = {
            messageType: "product",
            productId: result.item.productId,
            picUrl: result.item.picUrl,
            productName: result.item.productName,
            productPrice: result.item.productPrice,
            productSn: result.item.productSn
        };
        messageList.value = [...messageList.value, productInfo];
        nextTick(() => {
            scrollToBottom();
        });
    } catch (error) {
        console.error(error);
    }
};
const _getOrderDetail = async (id: any) => {
    try {
        const result = await getOrder({ id: id });
        let order = {
            messageType: "order",
            orderId: result.orderId,
            orderSn: result.orderSn,
            picUrl: result.items[0].picThumb,
            productName: result.items[0].productName,
            productNum: result.items.length,
            totalAmount: result.totalAmount,
            orderStatusName: result.orderStatusName
        };
        const orderIndex = messageList.value.findIndex(
            (item: any) => item.content.messageType === "custom" && item.content.order && item.content.order.orderId == id
        );
        if (orderIndex === -1) {
            handleSendMessage("custom", { order });
        }
    } catch (error) {
        console.error(error);
    }
};
const triggerSetReadStatus = ref(false);
const handleSetRead = () => {
    if (
        messageList.value[messageList.value.length - 1].isRead === 0 &&
        messageList.value[messageList.value.length - 1].type === 2 &&
        !triggerSetReadStatus.value
    ) {
        _setRead();
    }
};
const _setRead = async () => {
    try {
        triggerSetReadStatus.value = true;

        await setRead({
            shopId: filterParams.shopId,
            servantId: messageList.value[messageList.value.length - 1].servantId
        });
    } catch (error: any) {
        console.error(error);
    } finally {
        triggerSetReadStatus.value = false;
    }
};
const promptToneRef = ref();

const pcDomain = computed(() => {
    if (configStore.baseInfo.pcDomain) {
        return configStore.baseInfo.pcDomain;
    }
    // #ifdef H5
    return window.location.origin;
    // #endif

    return "";
});

const urlMap = reactive<{ [key: string]: { [key: string]: string } }>({
    pc: {
        detail: `${pcDomain.value}/item/`,
        order: `${pcDomain.value}/member/order/info?id=`,
        shop: `${pcDomain.value}/shop/${filterParams.shopId}`
    },
    mobile: {
        detail: `/pages/product/index?id=`,
        order: `/pages/user/order/info?id=`,
        shop: `/pages/shop/index?shopId=${filterParams.shopId}`
    }
});

const getUrl = (type: string, userFrom: string, data?: AnyObject) => {
    let url = "";
    switch (type) {
        case "detail":
            url = urlMap[userFrom][type] + (userFrom === "pc" && data ? data.content.product.productSn : data?.content.product.productId);
            break;
        case "order":
            url = urlMap[userFrom][type] + (data ? data.content.order.orderId : "");
            break;
        case "shop":
            url = urlMap[userFrom][type];
            break;
    }
    return url;
};

const handleLink = (type: string, data?: AnyObject) => {
    let url = "";
    if (platform.value === "pc") {
        url = getUrl(type, "pc", data);
        window.open(url, "_blank");
    } else {
        url = getUrl(type, "mobile", data);
        uni.navigateTo({
            url
        });
    }
};

const handleToList = (url: string) => {
    uni.navigateTo({
        url
    });
};

const shopLogo = computed(() => {
    return shopInfo.value.shopLogo ?? configStore.baseInfo.icoImg;
});
const shopTitle = computed(() => {
    return shopInfo.value.shopTitle ?? t("在线客服");
});

/** websocket 逻辑处理  */

const onOpen = (event: any) => {
    // console.log('连接成功', event)
};
const onMessage = (event: any) => {
    if (!isJsonString(event.data)) {
        console.error("收到非JSON格式数据");
        return;
    }

    const data = JSON.parse(event.data);

    if (data.type === "message") {
        if (data.data) {
            formatMessage(data.data[0]);
        }
    }

    if (data.type === "read") {
        messageList.value.forEach((item: any) => {
            if (item.type === 1) {
                item.isRead = 1;
            }
        });
    }
};

const verifyMessage = (data: any) => {
    return messageList.value.findIndex((item: any) => item.id === data.id);
};
const formatMessage = (data: any) => {
    if (data.shopId === filterParams.shopId) {
        const index = verifyMessage(data);
        if (index === -1) {
            messageList.value = [...messageList.value, data];
            promptToneRef.value?.play();
            nextTick(() => {
                scrollToBottom();
            });
        }
    }
};
const onClose = (event: any) => {
    // console.log('连接关闭', event)
};
const onError = (event: any) => {
    // console.log('连接错误', event)
};
const ws = ref();
const platform = ref("");
const getSocketUrl = () => {
    let url;
    // #ifdef H5
    if (import.meta.env.VITE_SOCKET_URL) {
        url = import.meta.env.VITE_SOCKET_URL;
    } else {
        url = location.origin ? location.origin.replace(/^http:/, "ws:").replace(/^https:/, "wss:") + "/ws" : "";
    }
    // #endif

    // #ifndef H5
    url = import.meta.env.VITE_SOCKET_URL;
    // #endif
    return url;
};
onLoad(async (options) => {
    if (options) {
        if (options.shopId && !!Number(options.shopId)) {
            filterParams.shopId = Number(options.shopId);
            await _getShopDetail(options.shopId);
        }
        if (options.productId && !!Number(options.productId)) {
            filterParams.productId = Number(options.productId);
            _getProductDetail(options.productId);
        }
        if (options.orderId && !!Number(options.orderId)) {
            filterParams.orderId = Number(options.orderId);
        }
        if (options.conversationId && !!Number(options.conversationId)) {
            filterParams.conversationId = Number(options.conversationId);
        }

        if (options.platform) {
            platform.value = options.platform;
        }

        if (options.token) {
            // uni.setStorageSync("token", options.token);
            uni.setStorage({
                key: "token",
                data: options.token,
                success: async () => {
                    userStore.getUserInfo();
                    filterParams.userFrom = configStore.XClientType;
                    ws.value = new WebSocketClient(
                        `${getSocketUrl()}?token=${options.token}&platform=${platform.value ? platform.value : filterParams.userFrom}`
                    );
                    ws.value.onclose(onClose);
                    ws.value.onopen(onOpen);
                    ws.value.onerror(onError);
                    ws.value.onmessage(onMessage);
                    // 连接
                    ws.value.connect();
                    await _getConversationMessage();
                    filterParams.orderId && (await _getOrderDetail(filterParams.orderId));
                }
            });
        }
    }
});
const gallaryBg = computed(() => {
    return `url(${staticResource("im/gallary.png")})`;
});
const goodspicBg = computed(() => {
    return `url(${staticResource("im/goodspic.png")})`;
});
const plusBg = computed(() => {
    return `url(${staticResource("im/plus@2x.png")})`;
});
const icoFaceBg = computed(() => {
    return `url(${staticResource("im/ico_face_v2@2x.png")})`;
});
const talkBg = computed(() => {
    return `url(${staticResource("im/talk@2x.png")})`;
});
const headerHeight = computed(() => {
    // #ifdef MP-WEIXIN
    return configStore.menuButtonInfo.height + 10 + "px";
    // #endif
    return "44px";
});

const headerTop = computed(() => {
    // #ifdef MP-WEIXIN
    return configStore.menuButtonInfo.top + "px";
    // #endif
    return configStore.safeAreaInsets.top + "px";
});

// #ifdef MP-WEIXIN
const paddingRight = computed(() => {
    return configStore.menuButtonInfo.width + 10 + "px";
});
// #endif
const footerHight = computed(() => {
    let num = 100;
    if (moreEmoji.value) {
        num += 324;
    }
    if (moreHandle.value) {
        num += 196;
    }
    if (showKeyboard.value) {
        return `calc(${num}rpx + ${keyboardHeight.value}px)`;
    }
    return `${num}rpx`;
});
</script>
<style>
page {
    background-color: #f5f5f5;
}
</style>
<style scoped lang="scss">
.message-scroll {
    width: 100%;
    height: 100%;
}

.icon-houtui {
    color: #000;
    font-size: 40rpx;
    padding-left: 20rpx;
}

.message-image {
    width: 300rpx;
    height: 300rpx;
}

.page-content {
    display: flex;
    height: 100vh;
    flex: 1;
    width: 100vw;
    overflow: auto;
    color: #333;
}

.thanos-layout {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    height: 100%;

    .thanos-layout-header {
        height: v-bind("headerHeight");
        box-sizing: content-box;
        display: flex;
        align-items: flex-end;
        background-color: #fff;
        padding-top: v-bind(headerTop);
        // #ifdef MP-WEIXIN
        padding-right: v-bind(paddingRight);
        // #endif
    }

    .thanos-layout-main-content {
        flex: 1;
        overflow: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding-bottom: env(safe-area-inset-bottom);
        margin-bottom: v-bind(footerHight);
        transition: all 0.1s;
        box-sizing: border-box;
    }

    .thanos-layout-footer {
        position: fixed;
        box-sizing: content-box;
        padding-bottom: env(safe-area-inset-bottom);
        left: 0;
        bottom: 0;
        width: 100%;
        height: v-bind(footerHight);
        transition: all 0.1s;
    }
}

.thanos-inputer {
    resize: none;
    width: 100%;
    height: 100%;
    max-height: 200rpx;
    box-sizing: border-box;
    border-radius: 8rpx;
    padding: 10rpx;
    line-height: 48rpx;
    font-size: 28rpx;
    border: none;

    &:focus {
        border: none;
        outline: none;
    }
}

.wapim-conversation-banner {
    height: 100%;
    width: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: content-box;
    // // #ifdef MP-WEIXIN
    // align-items: flex-start;
    // // #endif
    .shop-info {
        font-size: 30rpx;
    }

    .right-opt {
        height: 100%;
        display: flex;
        align-items: center;
        .ico-history {
            width: 80rpx;
            height: 48rpx;
            background: transparent v-bind(talkBg) center center no-repeat;
            background-size: 48rpx 40rpx;
        }

        .wapim-conversation-banner-history {
            display: inline-block;
            position: relative;
            margin-right: 20rpx;
        }
    }
}

.wapim-inputer {
    position: relative;
    background-color: #f5f5f7;
    height: 100%;
    .wapim-main-inputer {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        position: relative;
        .input-box {
            width: calc(100vw - 150rpx);
        }

        .rich-input {
            margin: 16rpx 0;
            margin-left: 20rpx;
            min-height: 60rpx;
            padding: 0 10rpx;
            background-color: #fff;
            color: #333;
            border-radius: 10rpx;
            height: 100%;
            display: flex;
            align-items: center;
            :deep(.emoji) {
                vertical-align: sub;
                cursor: default;
                height: 40rpx;
                margin: 0 4rpx;
            }
        }
        .wapim-inputer-operation {
            margin-left: 20rpx;
            width: 200rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            .operation {
                width: 60rpx;
                height: 60rpx;
                margin-right: 28rpx;
            }

            .face {
                background: transparent v-bind(icoFaceBg) center center no-repeat;
                background-size: 60rpx 60rpx;
                left: 20rpx;
            }

            .plus {
                background: transparent v-bind(plusBg) center center no-repeat;
                background-size: 60rpx 60rpx;
                position: relative;
            }

            .send {
                width: 80rpx;
                height: 60rpx;
                background-color: #0983f6;
                border-radius: 4rpx;
                line-height: 60rpx;
                text-align: center;
                font-size: 28rpx;
                color: #fff;
            }
        }
    }
}

.file-inputer-plugin {
    box-sizing: content-box;
    padding: 32rpx;
    height: 132rpx;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20rpx;

    .plugin-item {
        width: 90rpx;
        text-align: center;

        .title {
            font-size: 24rpx;
            color: #666;
            line-height: 64rpx;
        }
    }

    .plugin-item .photo {
        height: 90rpx;
        box-sizing: border-box;
        border-width: 0;
        border-radius: 4rpx;

        input {
            width: 100%;
            height: 100%;
            opacity: 0;
            display: inline-block;
        }
    }

    .pic-item .photo {
        background: #fff center center v-bind("goodspicBg") no-repeat;
        background-size: 64rpx;
    }

    .goods-list-item .icon {
        padding: 12rpx;
        background: #fff v-bind("gallaryBg") center center no-repeat;
        background-size: 64rpx;
        position: relative;
    }
}

.file-emoji-plugin {
    padding: 20rpx;
    height: 18vh;
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
    overflow-y: scroll;
}

.bg-pic {
    display: inline-block;
    width: 90rpx;
    height: 90rpx;
    overflow: hidden;
    margin: 0;

    .bg-pic-content {
        background-size: contain;
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-position: center;
    }
}

.self-service-menu {
    position: relative;
    height: 76rpx;
    z-index: 1;
    background: #f5f5f7;
    box-shadow: 0 -2rpx 0 #e5e5e5;
    -webkit-transform: translateY(2rpx);
    transform: translateY(2rpx);
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
    -webkit-box-align: end;
    -webkit-align-items: flex-end;
    align-items: flex-end;
    overflow: auto;
    gap: 16rpx;
    margin-left: 32rpx;

    .menu-item {
        -webkit-flex-shrink: 0;
        flex-shrink: 0;
        font-size: 24rpx;
        background: #f5f5f7;
        color: #666;
        padding: 12rpx 20rpx;
        border: 0.1rpx solid #bbb;
        border-radius: 24rpx;
        -webkit-user-select: none;
        user-select: none;
        cursor: pointer;
    }
}

.empty-text {
    align-items: center;
    font-size: 24rpx;
    text-align: center;
    color: #666;
    margin: 24rpx 0;
}

.message-box {
    height: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 15rpx 0;

    .message-time {
        text-align: center;
        font-size: 24rpx;
        line-height: 28rpx;
        margin-bottom: 30rpx;
        color: #999;

        span {
            padding: 6rpx 10rpx;
            background-color: #dbdbdb;
            display: inline-block;
            border-radius: 6rpx;
            min-width: 120rpx;
            color: #fff;
        }
    }

    .message-content {
        overflow: hidden;
        position: relative;

        .message-content-left {
            padding-left: 2em;
        }

        .message-avatar {
            width: 80rpx;
            height: 80rpx;
            vertical-align: middle;
            box-sizing: border-box;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
            margin: 0;
            float: right;
        }

        .message-content-inner {
            position: relative;
            width: auto;
            max-width: 70%;
            padding: 18rpx 24rpx;
            font-size: 32rpx;
            color: #333;
            vertical-align: middle;
            border-radius: 6rpx;
        }
    }
}

.thanos-rich-message {
    margin-bottom: 40rpx;
    padding: 0 30rpx;

    .thanos-text-message {
        white-space: pre-wrap;
        word-break: break-word;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.4em;
        :deep(.van-image__img) {
            border-radius: 10rpx;
        }
        :deep(.emoji) {
            vertical-align: sub;
            cursor: default;
            height: 40rpx;
            margin: 0 4rpx;
        }
        .custom-message-product {
            display: flex;
            min-width: 400rpx;
            .product-img {
                width: 120rpx;
                margin-right: 16rpx;
            }
            .product-info {
                flex: 1;
                .product-name {
                    margin-bottom: 20rpx;
                    font-size: 28rpx;
                    line-height: 30rpx;
                    display: -webkit-box; /* 使用WebKit的盒模型 */
                    -webkit-box-orient: vertical; /* 垂直排列 */
                    -webkit-line-clamp: 2; /* 显示的行数 */
                    overflow: hidden; /* 隐藏溢出的内容 */
                    text-overflow: ellipsis; /* 显示省略号 */
                }
                .product-price {
                    color: red;
                }
            }
        }
        .custom-message-order {
            min-width: 400rpx;
            .tit {
                font-size: 28rpx;
                font-weight: bold;
                margin-bottom: 10rpx;
            }
            .info {
                display: flex;
                .product-img {
                    width: 120rpx;
                    margin-right: 16rpx;
                }
                .product-info {
                    flex: 1;
                    .product-name {
                        margin-bottom: 20rpx;
                        font-size: 26rpx;
                        line-height: 35rpx;
                        display: -webkit-box; /* 使用WebKit的盒模型 */
                        -webkit-box-orient: vertical; /* 垂直排列 */
                        -webkit-line-clamp: 2; /* 显示的行数 */
                        overflow: hidden; /* 隐藏溢出的内容 */
                        text-overflow: ellipsis; /* 显示省略号 */
                    }
                    .product-txt {
                        font-size: 22rpx;
                        color: #999;
                    }
                }
            }
        }
    }

    &.out .message-content-inner {
        float: right;
        margin-right: 24rpx;
        background-color: #a0e75a;

        &::after {
            position: absolute;
            top: 20rpx;
            content: "";
            border: 20rpx solid transparent;
        }

        &::after {
            border-left-color: #a0e75a;
            right: -32rpx;
        }

        &.card-message {
            background-color: #fff;
            width: 70%;
        }

        &.card-message::after {
            border-left-color: #fff;
        }
    }

    &.in .message-avatar {
        float: left;
    }

    &.in .message-content-inner {
        float: left;
        margin-left: 24rpx;
        background-color: #fff;

        &::after {
            position: absolute;
            top: 20rpx;
            content: "";
            border: 20rpx solid transparent;
        }

        &::after {
            border-right-color: #fff;
            left: -32rpx;
        }
    }

    .read-status {
        font-size: 26rpx;
        padding-top: 8rpx;
        margin-right: 102rpx;
        display: flex;
        justify-content: flex-end;
        clear: both;

        &.read {
            color: #969799;
        }

        &.unread {
            color: #1989fa;
        }
    }
    &.card-type .message-content-inner {
        background-color: #fff;
        &::after {
            border-left-color: #fff;
        }
        &.card-message {
            background-color: #fff;
        }
        &.card-message::after {
            border-left-color: #fff;
        }
    }
    &.image-type .message-content-inner {
        padding: 0;
        background-color: rgba(0, 0, 0, 0);
        &::after {
            border-left-color: rgba(0, 0, 0, 0);
            border-right-color: rgba(0, 0, 0, 0);
        }
        &.card-message {
            background-color: rgba(0, 0, 0, 0);
        }
        &.card-message::after {
            border-left-color: rgba(0, 0, 0, 0);
        }
    }
}

.goods-card-message {
    color: #333;
    padding: 12rpx 0;
    display: flex;
    flex: 1;
}

.thanos-goods-card {
    background-color: #fff;
    text-align: left;
    display: flex;
    width: 100%;
    min-width: 336rpx;

    .goods-cover {
        flex: 0 0 120rpx;
        height: 120rpx;
    }

    .goods-image {
        display: flex;
        align-content: center;
        justify-content: center;
        overflow: hidden;
    }

    .goods-text-info {
        margin-left: 16rpx;
        font-size: 28rpx;
        line-height: 40rpx;
        min-width: 200rpx;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .goods-title {
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
            word-wrap: normal;
            white-space: pre-wrap;
            flex: 1 0 80rpx;
        }

        .goods-price {
            bottom: 0;
            color: #ff3434;
            word-break: break-all;

            .currency {
                font-size: 20rpx;
                margin-right: 4rpx;
            }
        }
    }
}

.im-goods-card {
    background-color: #fff;
    text-align: center;
    margin: 0 32rpx 32rpx;
    display: flex;
    flex-direction: column;
    border-radius: 8rpx;
    padding: 32rpx 32rpx 0 32rpx;
    color: #333;

    .content {
        display: flex;

        .pic {
            height: 144rpx;
            width: 144rpx;
            margin-bottom: 32rpx;
            margin-right: 24rpx;
            border-radius: 4rpx;
            overflow: hidden;
        }

        .desc {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex: 1;
            padding-bottom: 32rpx;

            .title {
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
                word-wrap: normal;
                white-space: pre-wrap;
                line-height: 40rpx;
                flex: 0 1 80rpx;
                text-align: left;
            }

            .price {
                display: flex;
                align-items: flex-end;
                flex: 1 0;
                font-weight: 500;
            }
        }
    }

    .line {
        height: 0.1rpx;
        background-color: #ebedf0;
    }

    .send {
        padding: 28rpx 0;
        justify-content: center;
        align-items: center;
        line-height: 32rpx;
        color: #1989fa;
        font-weight: 500;
    }
}
</style>
