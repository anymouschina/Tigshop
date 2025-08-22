<template>
    <perfect-scrollbar class="decorate-edit-con">
        <div class="dec-edit-title">
            <h3>个性商品</h3>
            <div class="dec-edit-desc">广告图与商品结合展示，更个性更醒目</div>
        </div>
        <Tabs :tabs="tabs" v-model="activeName"></Tabs>
        <div v-if="activeName === 'product'">
            <div class="dec-edit-title-box">
                <div class="title">请点击添加选择商品：最多选择4个</div>
            </div>
            <div class="dec-edit-group dec-edit-group-block">
                <div class="dec-edit-group-con">
                    <div class="dec-goods-group">
                        <ProductInfoSelect v-model:productList="module.pruductList" :isMultiple="true" :maxSelection="4"></ProductInfoSelect>
                    </div>
                </div>
                <div class="dec-edit-group-desc">
                    <div>提示：您可以通过拖拽进行商品排序</div>
                </div>
            </div>
            <div class="dec-edit-title-box">
                <div class="title">海报设置：宽280, 高600</div>
            </div>
            <div class="dec-edit-group dec-edit-group-block">
                <PicList v-model:photo="module.picUrl" :showText="false" decorateType="mobile"></PicList>
            </div>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">海报位置</div>
                    <div class="value"></div>
                </div>
                <div class="dec-edit-group-con">
                    <el-radio-group class="dec-radio-group" v-model="module.picLocation">
                        <el-tooltip effect="light" placement="bottom" content="左侧" :show-after="100">
                            <el-radio-button :value="'left'"><i class="iconfont-admin icon-alignLeft"></i></el-radio-button>
                        </el-tooltip>
                        <el-tooltip effect="light" placement="bottom" content="右侧" :show-after="100">
                            <el-radio-button :value="'right'"><i class="iconfont-admin icon-alignRight"></i></el-radio-button>
                        </el-tooltip>
                    </el-radio-group>
                </div>
            </div>
            <div class="dec-edit-title-box">
                <div class="title">参数设置</div>
            </div>
            <AnimationEdit v-model="module.animation" type="categoryA1"></AnimationEdit>
            <div class="dec-divider-line"></div>
            <CommonImageFillEdit v-model="module.picFillType"></CommonImageFillEdit>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">商品圆角半径</div>
                </div>
                <div class="dec-edit-group-con">
                    <div class="dec-range-group">
                        <el-slider v-model="module.productRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="20" />
                    </div>
                </div>
            </div>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">图片底部圆角</div>
                    <div class="value"></div>
                </div>
                <div class="dec-edit-group-con">
                    <el-radio-group class="dec-radio-group" v-model="module.picBottomRadius">
                        <el-radio-button :value="1">直角</el-radio-button>
                        <el-radio-button :value="2">圆角</el-radio-button>
                    </el-radio-group>
                </div>
            </div>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">商品划线价</div>
                    <div class="value"></div>
                </div>
                <div class="dec-edit-group-con">
                    <el-radio-group class="dec-radio-group" v-model="module.crossedOutPrice">
                        <el-radio-button :value="1">显示</el-radio-button>
                        <el-radio-button :value="0">不显示</el-radio-button>
                    </el-radio-group>
                </div>
            </div>
        </div>
        <div v-if="activeName === 'extend'">
            <div class="dec-edit-title-box">
                <div class="title">颜色设置</div>
            </div>
            <div v-if="module.moduleColor">
                <div class="dec-edit-group">
                    <div class="dec-edit-group-title">
                        <div class="label">商品背景颜色</div>
                        <div class="value"></div>
                    </div>
                    <div class="dec-edit-group-con">
                        <div class="dec-color-group">
                            <div class="dec-color-button">
                                <a class="dec-color-reset" @click="module.moduleColor.productBackgroundColor = ''">重置</a>
                                <SelectColor v-model:color="module.moduleColor.productBackgroundColor"></SelectColor>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dec-edit-group">
                    <div class="dec-edit-group-title">
                        <div class="label">商品标题颜色</div>
                        <div class="value"></div>
                    </div>
                    <div class="dec-edit-group-con">
                        <div class="dec-color-group">
                            <div class="dec-color-button">
                                <a class="dec-color-reset" @click="module.moduleColor.productNameColor = ''">重置</a>
                                <SelectColor v-model:color="module.moduleColor.productNameColor"></SelectColor>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dec-edit-group">
                    <div class="dec-edit-group-title">
                        <div class="label">商品价格颜色</div>
                        <div class="value"></div>
                    </div>
                    <div class="dec-edit-group-con">
                        <div class="dec-color-group">
                            <div class="dec-color-button">
                                <a class="dec-color-reset" @click="module.moduleColor.productPriceColor = ''">重置</a>
                                <SelectColor v-model:color="module.moduleColor.productPriceColor"></SelectColor>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dec-edit-group" v-if="module.crossedOutPrice === 1">
                    <div class="dec-edit-group-title">
                        <div class="label">商品划线价颜色</div>
                        <div class="value"></div>
                    </div>
                    <div class="dec-edit-group-con">
                        <div class="dec-color-group">
                            <div class="dec-color-button">
                                <a class="dec-color-reset" @click="module.moduleColor.crossedOutPriceColor = ''">重置</a>
                                <SelectColor v-model:color="module.moduleColor.crossedOutPriceColor"></SelectColor>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ModuleStyleEdit v-model="module.moduleStyle" type="customProduct"></ModuleStyleEdit>
            <ContentStyleEdit v-model="module.contentStyle" type="customProduct"></ContentStyleEdit>
        </div>
    </perfect-scrollbar>
</template>
<script lang="ts" setup>
import { SelectColor, SelectLink } from "@/components/select";
import { ProductInfoSelect, PicSelect, PicList } from "@/components/decorate";
import Tabs from "@/components/tabs/Index.vue";
import { ref, defineModel, watch } from "vue";
import CommonImageFillEdit from "../../src/commonImageFill/Edit.vue";
import ContentStyleEdit from "../../src/contentStyle/Edit.vue";
import ModuleStyleEdit from "../../src/moduleStyle/Edit.vue";
import AnimationEdit from "../../src/animation/Edit.vue";
import { ModuleType, ModuleCustomProductType, TextAlignmentType } from "@/types/decorate/decorate.d";
const tabs = ref<any[]>([
    { label: "商品设置", name: "product" },
    { label: "扩展设置", name: "extend" }
]);
const activeName = ref("product");
const module = defineModel<ModuleType & ModuleCustomProductType>("module", { default: () => ({}) });
</script>
