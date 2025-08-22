<template>
    <tig-layout title="商家入驻">
        <template v-if="type === 1">
            <personalForm :id="id" :is-reapply="isReapply" @send-refresh="getRefresh" />
        </template>
        <template v-if="type === 2">
            <enterpriseForm :id="id" :is-reapply="isReapply" @send-refresh="getRefresh" />
        </template>
    </tig-layout>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import personalForm from "./src/personalForm.vue";
import enterpriseForm from "./src/enterpriseForm.vue";

const type = ref(1);
const id = ref(0);
const isReapply = ref(false);
onLoad((options) => {
    if (options) {
        if (options.type) {
            type.value = Number(options.type);
        }
        if (options.id) {
            id.value = Number(options.id);
        }
        if (options.isReapply) {
            isReapply.value = options.isReapply == "true" ? true : false;
        }
    }
});

const getRefresh = (id: number) => {
    uni.redirectTo({
        url: `/pages/user/merchantEnter/index?id=${id}&type=${type.value}`
    });
};
</script>

<style lang="scss" scoped></style>
