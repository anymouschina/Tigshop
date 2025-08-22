<template>
    <div class="layout-basic">
        <div class="layout-top" >
            <pageTopBar></pageTopBar>
        </div>
        <div class="layout-main">
            <div class="layout-left-menu">
                <pageLeftMenu></pageLeftMenu>
            </div>
            <div class="layout-container">
                <el-scrollbar  class="layout-content-warp">
                    <pageContainer>
                        <router-view />
                    </pageContainer>
                </el-scrollbar >
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import pageLeftMenu from "./src/pageLeftMenu.vue";
import pageTopBar from "./src/pageTopBar.vue";
import pageContainer from "./src/pageContainer.vue";
</script>
<style lang="less" scoped>
.layout-basic{
    display: flex;
    flex-direction: column;
    height: 100%;
    .layout-top{
        z-index: 20;
    }
    .layout-main{
        display: flex;
        flex: 1;
        height: 0;
        min-height: 0;
        z-index: 10;
        .layout-left-menu{
        }
        .layout-container{
            flex: 1;
            display: flex;
            overflow-y: auto;
            position: relative;
            background-color: #f5f7fa;
            .layout-content-warp{
                width: 100%;
            }
        }
    }
}
</style>
