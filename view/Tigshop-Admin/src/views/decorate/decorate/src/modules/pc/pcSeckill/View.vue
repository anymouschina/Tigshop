<template>
    <div class="module-ad-con">
        <div class="pc-module-box" style="height: 100px">
            <div class="title">限时秒杀</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, defineModel } from "vue";
import { ModuleType, PcSeckillType } from "@/types/decorate/decorate.d";
import { mergeDefaultModule } from "@/views/decorate/decorate/src/modules/";
const defaultModule = ref({
    seckillTitle: "全场优惠限时9折起",
});
const module = defineModel<ModuleType & PcSeckillType>("module");
mergeDefaultModule(module.value, defaultModule.value);
</script>

<style lang="less" scoped></style>
