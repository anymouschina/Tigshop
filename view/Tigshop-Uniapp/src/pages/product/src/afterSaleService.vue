<template>
    <view>
        <view class="tab_body">
            <rich-text :nodes="formState.templateContent" />
        </view>
    </view>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from "vue";
import { getAfterSaleService } from "@/api/product/product";
const props = defineProps({
    id: {
        type: [String, Number],
        default: ""
    }
});
const formState = ref<any>({});
const fetchAfterSaleService = async (id: any) => {
    try {
        const result = await getAfterSaleService(id);
        Object.assign(formState.value, result);
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none"
        });
    } finally {
    }
};
watchEffect(() => {
    if (props.id) {
        fetchAfterSaleService(props.id);
    }
});
</script>

<style lang="scss" scoped>
.tab_body {
    text-align: start;
    color: #333;
    font-family: 微软雅黑, 微软雅黑;
}
</style>
