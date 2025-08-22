<template>
    <template v-if="avatarType">
        <div class="flex flex-align-center">
            <div class="avatar-type">
                <FormAddGallery v-if="!loading" v-model:photo="avatar"></FormAddGallery>
            </div>
            <div class="extra">选择<span class="tips" @click="toggle">系统头像</span></div>
        </div>
    </template>
    <template v-else>
        <div class="flex flex-align-center">
            <div class="avatar-type">
                <DefaultAvatar v-if="!loading" v-model:avatar="avatar"></DefaultAvatar>
            </div>
            <div class="extra">选择<span class="tips" @click="toggle">自定义头像</span></div>
        </div>
    </template>
</template>
<script setup lang="ts">
import { DefaultAvatar, FormAddGallery } from "@/components/gallery";

const avatarType = defineModel<any>("avatarType", { type: Number, default: true });
const avatar = defineModel<any>("avatar", { type: String, default: "" });
const props = defineProps({
    loading: {
        type: Boolean,
        default: true
    }
});
const toggle = () => {
    avatar.value = "";
    avatarType.value = !avatarType.value;
};
</script>
<style scoped lang="less">
.avatar-type {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    margin-right: 20px;
}

.tips {
    color: #1456f0;
    margin-right: 2px;
    cursor: pointer;
}
</style>
