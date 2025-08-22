<template>
    <view>
        <shareCard
            v-model="showShareCard"
            :link="link"
            :qrcode-path="qrcodePath"
            :current-data="currentData"
            @show-save-image-text-card="handleShowSaveImageTextCard"
            @show-share-qrcode="handleShowShareQrcode"
        />
        <saveImageTextCard v-model="showSaveImageTextCard" :current-data="currentData" />
        <shareQrcode v-model="showShareQrcode" :qrcode-path="qrcodePath" :link="link" />
        <tig-qrcode v-if="showShareCard" ref="qrcodeRef" :immediately-create="true" :value="link" :margin="10" :show="false" @success="qrcodeSuccess" />
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import shareCard from "./shareCard.vue";
import saveImageTextCard from "./saveImageTextCard.vue";
import shareQrcode from "./shareQrcode.vue";
import { useConfigStore } from "@/store/config";

const configStore = useConfigStore();

const userInfo = uni.getStorageSync("userInfo");

const props = defineProps({
    showShareCard: {
        type: Boolean,
        default: false
    },
    currentData: {
        type: Object,
        default: () => {}
    }
});
const emit = defineEmits(["update:showShareCard"]);
const qrcodeRef = ref();
const showShareCard = computed({
    get() {
        if (props.showShareCard) {
            qrcodeRef.value?.drawQrcode();
        }
        return props.showShareCard;
    },
    set(val) {
        emit("update:showShareCard", val);
    }
});

const link = computed(() => {
    let domain = configStore.baseInfo.h5Domain;

    // #ifdef H5
    domain = domain ? domain : `${window.location.origin}/mobile`;
    // #endif

    return `${domain}/pages/product/index?id=${props.currentData.productId}&salesmanId=${userInfo?.salesman?.salesmanId}`;
});

const showSaveImageTextCard = ref(false);

const handleShowSaveImageTextCard = () => {
    emit("update:showShareCard", false);
    showSaveImageTextCard.value = true;
};

const showShareQrcode = ref(false);
const handleShowShareQrcode = () => {
    emit("update:showShareCard", false);
    showShareQrcode.value = true;
};

const qrcodePath = ref("");
const qrcodeSuccess = (val: string) => {
    qrcodePath.value = val;
};
</script>

<style lang="scss" scoped></style>
