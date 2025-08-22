<template>
    <tig-layout title="账户安全">
        <view class="profile-edit-main">
            <view class="profile-edit-content">
                <view class="item input">
                    <uni-easyinput
                        :input-border="false"
                        :value="mobile"
                        class="uni-input item-input"
                        :placeholder="$t('请输入新手机号')"
                        primary-color="rgb(192, 196, 204)"
                        @input="inputMobile"
                    />
                </view>
                <view class="flex align-center">
                    <view class="item line">
                        <uni-easyinput
                            :input-border="false"
                            :value="mobileCode"
                            class="uni-input item-input"
                            focus
                            :placeholder="$t('新手机短信验证码')"
                            primary-color="rgb(192, 196, 204)"
                            @input="inputMobileCode"
                        />
                    </view>
                    <VerificationCode
                        v-model:is-checked="isChecked"
                        v-model:mobile="mobile"
                        v-model:verify-token-data="verifyToken"
                        style="height: 65rpx"
                        :request-api="sendMobileCodeByMobileMobile"
                        @mobile-error-callback="mobileErrorCallback"
                    />
                </view>
                <view class="item" style="height: 60rpx">
                    <tig-button :disabled="isRegisterDisabled" class="next" @click="onsubmit">{{ $t("提交") }}</tig-button>
                </view>
            </view>
        </view>
    </tig-layout>
</template>
<script lang="ts" setup>
import { computed, ref } from "vue";
import VerificationCode from "@/components/verificationCode/index.vue";
import { mobileMobile, sendMobileCodeByMobileMobile } from "@/api/user/security";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const inputMobileCode = (e: any) => {
    mobileCode.value = e;
};

const inputMobile = (e: any) => {
    mobile.value = e;
};

const mobileCode = ref("");
const mobile = ref("");
const verifyToken = ref("");
const isChecked = ref(true);

const isRegisterDisabled = computed(() => {
    return !mobile.value || !mobileCode.value;
});

const mobileErrorCallback = (msg: string) => {
    uni.showToast({
        title: msg,
        duration: 1500,
        icon: "none"
    });
};

const onsubmit = async () => {
    try {
        let temp = {
            mobile: mobile.value,
            code: mobileCode.value
        };
        await mobileMobile({ ...temp });

        uni.showToast({
            title: t("修改成功"),
            icon: "none"
        });

        setTimeout(() => {
            // 一秒后执行这里的代码
            uni.redirectTo({
                url: "/pages/user/profile/index"
            });
        }, 1000);
    } catch (error: any) {
        if (error.message) {
            uni.showToast({
                title: error.message,
                icon: "none"
            });
        }
    }
};
</script>
<style lang="scss" scoped>
.line {
    padding-bottom: 10rpx;
    border-bottom: 1px solid #dfdfdf;
    width: 390rpx;
}
.profile-edit-main {
    padding: 30rpx;

    .profile-edit-content {
        background-color: #fff;
        border-radius: 15rpx;
        padding: 20rpx;
        margin-bottom: 30rpx;
        display: flex;
        flex-direction: column;
        gap: 16rpx;

        .item {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            margin: 20rpx;

            .next {
                width: 100%;
            }

            .title {
                font-size: 24rpx;
                display: flex;
                gap: 16rpx;

                .info {
                    color: #999999;
                }
            }
        }

        .btn-item {
            display: flex;
            flex-direction: column;
            margin: 20rpx;
            font-size: 24rpx;
            gap: 8rpx;

            .big-title {
                font-size: 28rpx;
            }

            .info {
                color: #999999;
            }
        }

        .input {
            padding-bottom: 10rpx;
            border-bottom: 1px solid #dfdfdf;
        }
    }
}
</style>
