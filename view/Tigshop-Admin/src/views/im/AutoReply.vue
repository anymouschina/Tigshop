<template>
    <div class="page-container">
        <el-tabs v-model="activeName" class="demo-tabs">
            <el-tab-pane label="客服首句欢迎语" :name="1">

            </el-tab-pane>
            <el-tab-pane label="客服忙提醒语" :name="2">

            </el-tab-pane>
            <el-tab-pane label="客服离线提醒语" :name="3">

            </el-tab-pane>
        </el-tabs>
        <template v-if="activeName==1">
            <FirstGreeting></FirstGreeting>
        </template>
        <template v-else-if="activeName==2">
            <QueueGreeting></QueueGreeting>
        </template>
        <template v-else-if="activeName==3">
            <EndGreeting></EndGreeting>
        </template>
    </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import FirstGreeting from "@/views/im/src/FirstGreeting.vue";
import QueueGreeting from "@/views/im/src/QueueGreeting.vue";
import EndGreeting from "@/views/im/src/EndGreeting.vue";

const activeName = ref(1);
</script>
<style lang="less" scoped>
.page-container {
    height: 100vh;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    flex: 1 1 100%;
    padding: 20px;

    .demo-tabs {
        width: 100%;
    }
}
</style>
