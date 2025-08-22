<template>
    <a-config-provider
        :theme="{
            token: {
                fontSize: 14,
                borderRadius: 2,
                colorPrimary: '#1456f0',
                wireframe: true
            }
        }"
        :locale="zhCnAnt"
        :dropdown-match-select-width="false"
    >
        <el-config-provider :locale="zhLocale">
            <RouterView />
        </el-config-provider>
    </a-config-provider>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import zhCnAnt from "ant-design-vue/es/locale/zh_CN";
import zhLocale from "element-plus/dist/locale/zh-cn.mjs";
import { useConfigStore } from "@/store/config";
import { useLoadCss } from '@/utils/domUtils'

const configStore = useConfigStore();
if (configStore.config.icoDefinedCss) {
    useLoadCss(configStore.config.icoDefinedCss)
}
// 获取当前路由对象
const route = useRoute();
</script>
<style lang="less" scoped></style>
