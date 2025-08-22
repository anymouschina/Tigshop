<template>
    <el-select v-model="value" style="width:100px">
        <el-option value="" label="请选择" />
        <el-option value="hot" label="热销商品" />
        <el-option value="best" label="推荐商品" />
        <el-option value="new" label="新品商品" />
        <!-- <el-option value="promote" label="秒杀商品" /> -->
    </el-select>
</template>
<script setup lang="ts">
import { defineModel, ref, toRefs, onMounted } from "vue"
const value = defineModel('modelValue');   
</script>
<style lang="less" scoped></style>
