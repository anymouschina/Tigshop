<template>
    <perfect-scrollbar class="decorate-edit-con">
        <div class="dec-edit-title">
            <h3>页面设置</h3>
        </div>
        <div class="dec-edit-group dec-edit-group-block">
            <div class="dec-edit-group-title">
                <div class="title">页面标题</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-input-group" dynamic-class=".title-item">
                    <el-input v-model="module.title" placeholder="请输入页面标题，可不填，默认为页面名称"></el-input>
                </div>
            </div>
        </div>
        <div class="dec-edit-group pc-dec-show">
            <div class="dec-edit-group-title">
                <div class="label">头部风格</div>
            </div>
            <div class="dec-edit-group-con">
                <el-radio-group class="dec-radio-group" v-model="module.headerStyle">
                    <el-radio-button :value="1">默认风格</el-radio-button>
                    <el-radio-button :value="2">简约风格</el-radio-button>
                </el-radio-group>
            </div>
        </div>
        <div class="dec-edit-group">
            <div class="dec-edit-group-title">
                <div class="label">标题栏背景颜色</div>
                <!-- <div class="value">{{ selectLabel.colorStyle[module.colorStyle || ''] }}</div> -->
            </div>
            <div class="dec-edit-group-con">
                <SelectColor v-model:color="module.titleBackgroundColor"></SelectColor>
                <!-- <el-radio-group class="dec-radio-group dec-radio-color-group" v-model="module.colorStyle">
                    <el-radio :value="1">
                        <div class="dec-radio-button dec-tip" :class="{'selected': module.colorStyle == 1}"><span class="dec-radio-color-button-con"><i style="background-color: rgb(0, 0, 0);"></i></span></div>
                    </el-radio>
                    <el-radio :value="2">
                        <div class="dec-radio-button dec-tip" :class="{'selected': module.colorStyle == 2}"><span class="dec-radio-color-button-con"><i style="background-color: #333;"></i></span></div>
                    </el-radio>
                    <el-radio :value="3">
                        <div class="dec-radio-button dec-tip" :class="{'selected': module.colorStyle == 3}"><span class="dec-radio-color-button-con"><i style="background-color: #e0f4e4;"></i></span></div>
                    </el-radio>
                </el-radio-group> -->
            </div>
        </div>
        <div class="dec-edit-group pc-dec-hide">
            <div class="dec-edit-group-title">
                <div class="label">标题栏文字颜色</div>
                <div class="value"></div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-color-group">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="module.titleColor = defaultModule.titleColor">重置</a>
                        <SelectColor v-model:color="module.titleColor"></SelectColor>
                    </div>
                </div>
            </div>
        </div>
        <div class="dec-edit-group pc-dec-hide">
            <div class="dec-edit-group-desc">
                <div class="">提示：标题背景颜色和文字修改仅适用于微信小程序和原生/半原生APP。</div>
            </div>
        </div>

        <div class="dec-divider-line pc-dec-hide"></div>
       <div class="dec-edit-group">
           <div class="dec-edit-group-title">
               <div class="label">页面背景颜色</div>
               <div class="value"></div>
           </div>
           <div class="dec-edit-group-con">
               <div class="dec-color-group">
                   <div class="dec-color-button">
                       <a class="dec-color-reset" @click="module.backgroundColor = defaultModule.backgroundColor">重置</a>
                       <SelectColor v-model:color="module.backgroundColor"></SelectColor>
                   </div>
               </div>
           </div>
       </div>
        <div class="dec-edit-group">
            <div class="dec-edit-group-title">
                <div class="label">背景图</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-pic-group">
                    <PicSelect v-model:photo="module.backgroundImage" v-model:defaultValue="defaultModule.backgroundImage"></PicSelect>
                </div>
            </div>
        </div>
        <div class="dec-edit-group dec-edit-group-block">
            <div class="dec-edit-group-title">
                <div class="label">背景图显示</div>
                <div class="value">{{ selectLabel.backgroundRepeat[module.backgroundRepeat] }}</div>
            </div>
            <div class="dec-edit-group-con">
                <el-radio-group class="dec-radio-group" v-model="module.backgroundRepeat">
                    <el-radio-button :value="1">不平铺</el-radio-button>
                    <el-radio-button :value="2">平铺</el-radio-button>
                    <el-radio-button :value="3">纵向平铺</el-radio-button>
                    <el-radio-button :value="4">横向平铺</el-radio-button>
                </el-radio-group>
            </div>
        </div>
        <div class="dec-edit-group dec-edit-group-block">
            <div class="dec-edit-group-title">
                <div class="label">背景图填充大小</div>
                <div class="value">{{ selectLabel.backgroundSize[module.backgroundSize] }}</div>
            </div>
            <div class="dec-edit-group-con">
                <el-radio-group class="dec-radio-group" v-model="module.backgroundSize">
                    <el-radio-button :value="1">横向100%</el-radio-button>
                    <el-radio-button :value="2">纵向100%</el-radio-button>
                    <el-radio-button :value="3">100%填充</el-radio-button>
                </el-radio-group>
            </div>
        </div>
    </perfect-scrollbar>
</template>
<script lang="ts" setup>
import { SelectColor } from "@/components/select";
import { PicSelect } from "@/components/decorate";
import { ref, onMounted, reactive } from "vue";
const selectLabel = ref<any>({
    backgroundRepeat: {
        1: "不平铺",
        2: "平铺",
        3: "纵向平铺",
        4: "横向平铺"
    },
    backgroundSize: {
        1: "横向100%",
        2: "纵向100%",
        3: "100%填充"
    }, colorStyle: {
        1: "纯黑",
        2: "深灰",
        3: "浅绿",
    },
});

// 页面设置
const defaultModule = {
    title: "",
    titleColor: "",
    titleBackgroundColor: "",
    backgroundImage: {
        picUrl: "",
        picThumb: ""
    },
    backgroundColor: "",
    backgroundRepeat: 1,
    backgroundSize: 1
};
const props = defineProps({
    module: {
        type: Object,
        default: () => {
            return {};
        }
    }
});
const module = ref(props.module);
const dealDefault = () => {
    for (let i in defaultModule) {
        if (typeof (module.value as any)[i] === "undefined") {
            (module.value as any)[i] = (defaultModule as any)[i];
        }
    }
};
onMounted(async () => {
    dealDefault();
});
</script>
<style lang="less" scoped>
.dec-edit-group :deep(.el-radio .el-radio__input){
    display: none;
}
</style>
