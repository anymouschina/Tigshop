<template>
    <div class="auth-img" v-if="menusStore.isLicensed && licensedStore.licensedData.license">
        <router-link v-if="adminType !== 'shop'" :to="{ path: '/setting/licensed/index' }">
            <img :src="isShowAvatar()" style="height: 25px; margin-top: 2px" />
        </router-link>
    </div>
</template>
<script setup lang="ts">
import { isShowAvatar } from "@/utils/authorize";
import { ref } from "vue";
import { useLicensedStore } from "@/store/licensed";
import { useMenusStore } from "@/store/menu";
const menusStore = useMenusStore();
const adminType = ref(localStorage.getItem("adminType"));
const licensedStore = useLicensedStore();
licensedStore._getLicensed();
</script>
