<template>
    <div
        :class="
            'module-ad-con module-goods_ad ad-style__2 ' +
            ' ad-buy_btn_style__' +
            module.buyBtnStyle +
            ' ad-goods_style__' +
            module.goodsStyle +
            ' ad-goods_radio_style__' +
            module.goodsRadioStyle +
            ' ad-text_align__' +
            module.textAlign +
            ' ad-text_weight__' +
            module.textWeight +
            ' ad-goods_name_row__' +
            module.goodsNameRow +
            ' ad-goods_name_padding__' +
            module.goodsNamePadding +
            ' ad-goods-title_style__' +
            module.title?.titleStyle
        "
        :style="frameFormat.boxPadding + frameFormat.boxPaddingTop + frameFormat.boxPaddingBottom"
    >
        <div
            class="module-ad-content"
            :style="
                frameFormat.backgroundColor +
                ' ' +
                frameFormat.boxRadius +
                allFormat.boxPadding +
                allFormat.boxPaddingBottom +
                allFormat.boxPaddingTop +
                allFormat.boxRadius +
                allFormat.innerPadding
            "
        >
            <div class="module-ad-empty empty-image_ad" v-if="!productList || productList.length == 0">
                <div class="image-empty-bg"></div>
                <div class="desc">点击添加图片广告</div>
            </div>
            <div class="goods-ad-warp">
                <div class="goods-ad-con">
                    <div class="goods-ad-item" v-for="item in productList" :key="item.productId">
                        <div class="item-content" :style="allFormat.goodsPadding + allFormat.goodsRadius">
                            <div class="item-con">
                                <div class="item-photo">
                                    <a href="" title="" class="item-image-a">
                                        <div class="item-image-bg" :style="{ backgroundColor: module.imageBackgroundColor }"></div>
                                        <img :src="imageFormat(item.picThumb)" alt="" />
                                    </a>
                                </div>
                                <div class="item-info">
                                    <div class="item-name">
                                        <a href="" title="" class="item-name-a">{{ item.productName }}</a>
                                    </div>
                                    <div class="item-action">
                                        <div class="item-price">
                                            <b class="price_format">
                                                {{ priceFormat(Number(item.productPrice)) }}
                                            </b>
                                        </div>
                                        <a class="buy-btn lyecs-buyBtn">
                                            <span class="iconfont-h5 icon-gouwuche3 iconh5-style"></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, computed, Ref, watchEffect } from "vue";
import { imageFormat, priceFormat } from "@/utils/format";
import { ModuleType, ModuleActivityType } from "@/types/decorate/decorate.d";
import { getProductList } from "@/api/product/product";
import type { ProductFormState } from "@/types/product/product.d";
import { mergeDefaultModule, defaultProducts, formatFrame, CommonTitle } from "@/views/decorate/decorate/src/modules/";

const module = defineModel<ModuleType & ModuleActivityType>("module") as Ref<ModuleType & ModuleActivityType>;
const defaultModule = ref({
    imageBackgroundColor: "",
    buyBtnStyle: 0,
    goodsRadio: 0,
    boxRadius: 0,
    innerPadding: 0,
    boxPadding: 10,
    boxPaddingTop: 5,
    boxPaddingBottom: 5,
    products: defaultProducts
});
mergeDefaultModule(module.value, defaultModule.value);
const { frame, title } = module.value;
const productList = ref<ProductFormState[]>();
const frameFormat = computed(() => {
    return formatFrame(frame ?? {});
});
const allFormat = computed(() => {
    return {
        boxPadding: `margin-left: ${module?.value?.boxPadding}px;margin-right: ${module?.value?.boxPadding}px;`,
        boxPaddingBottom: `margin-bottom: ${module?.value?.boxPaddingBottom}px;`,
        boxPaddingTop: `margin-top: ${module?.value?.boxPaddingTop}px;`,
        boxRadius: `border-radius: ${module?.value?.boxRadius}px;`,
        innerPadding: `padding: ${module?.value?.innerPadding}px;`,
        goodsPadding: `padding: ${module?.value?.goodsPadding}px;`,
        goodsRadius: `border-radius: ${module?.value?.goodsRadius}px;`
    };
});

const paramsValueMap: { [key: number]: string[] } = {
    1: ["productIds"],
    2: ["productCategoryId", "productNumber"],
    3: ["productTag", "productNumber"]
};
const paramsKeyMap: { [key: string]: string } = {
    productIds: "ids",
    productCategoryId: "categoryId",
    productNumber: "size",
    productTag: "introType"
};

const _getproductList = async () => {
    let param: any = {};
    if (typeof module.value.products === "object") {
        if (module.value.products.productSelectType) {
            const type = module.value.products.productSelectType;
            const keys = paramsValueMap[type];
            if (type === 1) {
                param[paramsKeyMap[keys[0]]] = module.value.products.productIds.join(",");
            } else {
                param.page = 1;
                keys.forEach((key) => {
                    param[paramsKeyMap[key]] = module.value.products[key];
                });
            }
        }
    }
    try {
        const result = await getProductList({ productStatus: 1, checkStatus: 1, ...param });
        productList.value = result.records;
    } catch (error) {
    } finally {
    }
};
_getproductList();

watchEffect(() => {
    _getproductList();
});
</script>
<style lang="less" scoped>
.icon-gouwuche3 {
    color: #f23030;
}

.goods-ad-con {
    gap: 8px;
}
.ad-style__2 .goods-ad-warp .goods-ad-con .goods-ad-item {
    width: calc(100% / 2 - 4px);
}

.item-content {
    overflow: hidden;
}

.item-image-a {
    position: relative;
    display: block;

    .item-image-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    img {
        z-index: 1;
        position: relative;
    }
}
</style>
