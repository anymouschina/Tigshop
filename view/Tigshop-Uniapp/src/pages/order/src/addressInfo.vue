<template>
    <view class="address-info">
        <view class="address-content" @click="handleAddressMore">
            <view class="address-box">
                <template v-if="data && Object.keys(data).length > 0">
                    <view class="user-info">
                        <view class="name">{{ data.consignee + " " + data.mobile }}</view>
                    </view>
                    <view class="address">{{ data.regionName }} {{ data.address }}</view>
                </template>
                <template v-else>
                    <view class="user-info">
                        <view class="name">请选择收货地址</view>
                    </view>
                </template>
            </view>
            <view class="iconfont icon-jiantou arrow_ico" />
        </view>
    </view>
</template>

<script lang="ts" setup>
defineProps({
    data: {
        type: Object,
        default: () => []
    }
});

const handleAddressMore = () => {
    uni.navigateTo({
        url: "/pages/address/list"
    });
};
</script>

<style lang="scss" scoped>
.address-info {
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAKBAMAAACOO0tGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAnUExURf///4u16Oxtbezz/J3B7NDh9vvd3fSmprjS8vGNje57e/jDw/7w8IQ3dnAAAABSSURBVCjPY2CAAG4l7GADVJ4hUBArEIXJJ2HXrw6TZ8auX7ABKs+zCLsBE2AGmGDXLwKT58SuX+sATIEjdgOcYfJF2A1Qg8lz4PCBwWgQUiMIAWCaOFG2MdFRAAAAAElFTkSuQmCC")
        #fff repeat-x scroll -14rpx bottom / 64rpx 5rpx;
    padding-bottom: 10rpx;
    border-radius: 0 0 18rpx 18rpx;
    margin-bottom: 15rpx;
    .address-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #fff;
    }

    .address-box {
        padding: 20rpx;
        display: flex;
        flex-direction: column;
    }

    .user-info {
        color: #333;
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        display: flex;
    }
    .name {
        margin-right: 10rpx;
        flex: 1;
    }

    .address {
        color: #666;
        display: block;
        font-size: 24rpx;
        flex: 1;
    }
}
</style>
