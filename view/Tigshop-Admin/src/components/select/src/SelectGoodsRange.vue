<template>
    <div class="range-con">
        <el-space>
            <el-radio-group v-model="rangeType" @change="onChange" :disabled="props.disabled">
                <el-radio :value="0">全部商品</el-radio>
                <!-- <el-radio :value="1">以下分类</el-radio>
                <el-radio :value="2">以下品牌</el-radio> -->
                <el-radio :value="3">以下商品</el-radio>
                <el-radio :value="4">不含以下商品</el-radio>
            </el-radio-group>
        </el-space>
    </div>
    <div class="tags" v-if="type == 'productBatch'">
        <el-tag v-for="(tag, index) in tagList" :key="tag" closable @close="onClose(index)">
            {{ tag.brandName }}
        </el-tag>
    </div>
    <div v-if="rangeType == 1">
        <SelectCategory :multiple="true" style="width: 260px" v-model:categoryId="rangeIds" @update:categoryId="selectChange"> </SelectCategory>
    </div>
    <div v-if="rangeType == 2">
        <SelectBrand v-if="type == 'productBatch'" style="width: 260px" v-model:brandForm="brandForm"> </SelectBrand>
        <SelectBrand v-else style="width: 260px" v-model:brandId="rangeIds"> </SelectBrand>
        <el-button v-if="type == 'productBatch'" class="addBtn" type="primary" @click="add">添加</el-button>
    </div>
    <div v-if="rangeType == 3">
        <SelectProduct v-model:ids="rangeIds" :isSelf="props.isSelf"></SelectProduct>
    </div>
    <div v-if="rangeType == 4">
        <SelectProduct v-model:ids="rangeIds" :isSelf="props.isSelf"></SelectProduct>
    </div>
</template>
<script setup lang="ts">
import { defineModel, ref, nextTick } from "vue";
import { SelectCategory, SelectBrand, SelectProduct } from "@/components/select";
import { message } from "ant-design-vue";
// 传值
const props = defineProps({
    disabled: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: ""
    },
    //是否自营商品
    isSelf: {
        type: Number,
        default: 0
    }
});
const tagList = ref<any>([]);
const brandForm = ref<any>({});
const rangeIds = defineModel<any>("rangeIds");
const rangeType = defineModel<Number>("rangeType");
const emit = defineEmits(["update:rangeType", "update:rangeIds"]);
const onChange = (e: any) => {
    rangeType.value = e;
    tagList.value = [];
    if (e == 2 && props.type != "productBatch") {
        rangeIds.value = "";
    } else {
        rangeIds.value = [];
    }
};
const selectChange = (e: any) => {
    rangeIds.value = e;
};
const onClose = (index: number) => {
    tagList.value.splice(index, 1);
    rangeIds.value = screenBrand(tagList.value);
};
const add = () => {
    const isContain = tagList.value.some((itemB: any) => {
        return itemB.brandId === brandForm.value.brandId && itemB.brandName === brandForm.value.brandName;
    });
    if (!isContain) {
        tagList.value.push(brandForm.value);
        rangeIds.value = screenBrand(tagList.value);
    } else {
        message.error("已存在相同品牌");
    }
};
const screenBrand = (tagList: Object[]) => {
    let arr: number[] = [];
    tagList.some((item: any) => {
        arr.push(item.brandId);
    });
    return arr;
};
</script>

<style lang="less" scoped>
.range-con {
    margin-bottom: 10px;
    width: 100%;
    display: flex;
    align-items: center;
}
.addBtn {
    margin-left: 10px;
}
.tags {
    width: 100%;
    margin-bottom: 10px;
    .el-tag {
        margin-right: 10px;
    }
}
</style>
