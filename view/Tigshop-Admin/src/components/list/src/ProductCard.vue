<template>
    <div class="displayRow">
        <div v-if="picThumb" class="orderImage">
            <el-image style="width: 50px; height: 50px" :src="imageFormat(picThumb)" fit="cover" />
        </div>
        <div style="flex: 1;">
            <div class="product-name-wrap">
                <p class="productName">
                    {{ productName }}
                </p>
            </div>
            <p class="color999 sku" v-if="skuData">
                <div class="sku_item" v-for="(item, index) in skuData">
                    <span>{{ item?.name }}：{{ item?.value }}</span>
                    <span v-if="index < skuData.length - 1">&nbsp;|&nbsp;</span>
                </div>
            </p>
            <!-- <p class="color999 sku">
                供应商：1232
            </p> -->
        </div>
        <br/>
        <el-tag v-if="productType === 0" disable-transitions effect="plain" size="small" type="danger">虚拟产品
        </el-tag>
    </div>
</template>
<script lang="ts" setup>

import {imageFormat} from "@/utils/format";

const props = defineProps({
    productId: Number,
    productType: {
        type: Number,
        define: 1
    },
    url: String,
    picThumb: String,
    productName: String,
    skuData: Array,
});

</script>
<style lang="less" scoped>
.displayRow {
    display: flex;
    flex-direction: row;
    gap: 8px;
    flex: 1;
    .sku{
        font-size: 12px !important;
        color: #999;
        display: flex;
        flex-wrap: wrap;
    }

    .color999 {
        color: #666666;
    }
    .product-name-wrap {
        display: flex;
        flex: 1;
    }
    .productName{
        // max-width: 300px;
        flex: 1;
        width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

    }
    .alink{line-height: 22px;display: block;}
    .orderImage {
        min-width: 50px;
        min-height: 50px;
        max-width: 50px;
        max-height: 50px;
        border: 1px solid #eee;
        margin-top: 5px;
    }
}


</style>
