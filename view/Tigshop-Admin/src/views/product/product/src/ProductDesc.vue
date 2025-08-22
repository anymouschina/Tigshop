<template>
    <el-form-item :label="label" :rules="[{ required: productType == 4 }]">
        <div class="goods-info-edit-row" style="width: 100%">
            <div class="goods-info-edit-warp" v-if="!disabled">
                <div class="goods-info-edit-act flex">
                    <DialogForm type="gallery" class="item-bg" @okCallback="addPic" :params="{ isMultiple: true }">
                        <a class="add-item info-pic-add"><i class="iconfont icon-tianjiatupian"></i>添加图片</a>
                    </DialogForm>
                    <!-- <DialogForm type="galleryVideo" class="item-bg" @okCallback="addVideo" :params="{ isMultiple: true }">
                        <a class="add-item info-pic-add"><SvgIcon name="product-add-video" width="17" height="17" />添加视频</a>
                    </DialogForm> -->
                    <a class="add-item info-text-add" @click="addText"><i class="iconfont icon-wenben" style="font-size: 14px"></i>添加文本</a>
                    <span>点击按钮添加图片或者文本，您还可以通过拖拽进行排序</span>
                </div>
                <div class="goods-info-edit-con">
                    <draggable
                        class="info-edit-con-list"
                        item-key=""
                        :list="<any>descArr"
                        ghost-class="ghost"
                        chosen-class="chosenClass"
                        animation="300"
                        @start=""
                        @end=""
                    >
                        <template #item="{ element, index }">
                            <div class="info-edit-list-item" draggable="false" style="">
                                <div class="edit-list-item-img" v-if="element.type == 'pic'">
                                    <BusinessImg
                                        v-model:modelValue="element.pic"
                                        :picThumb="element.pic"
                                        :dataType="7"
                                        @Delete="onDelete"
                                        :style="{ width: '100px', height: '100px' }"
                                        :edit="false"
                                        :data="{ index: index }"
                                        @Edit="editPic"
                                    >
                                        <a class="lyecs-dialogImage" draggable="false"><img :src="imageFormat(element.pic)" draggable="false" /> </a>
                                    </BusinessImg>
                                    <DialogForm type="gallery" class="item-bg" @okCallback="editPic" :params="{ isMultiple: false }" :data="{ index: index }">
                                        <div class="btn-edit">修改</div>
                                    </DialogForm>
                                </div>
                                <div class="edit-list-item-img" v-if="element.type == 'video'">
                                    <a class="lyecs-dialogImage" draggable="false"><img :src="imageFormat(element.cover)" draggable="false" /> </a>
                                    <DialogForm
                                        type="galleryVideo"
                                        class="item-bg"
                                        @okCallback="editVideo"
                                        :params="{ isMultiple: false }"
                                        :data="{ index: index }"
                                    >
                                        <div class="btn-edit">修改</div>
                                    </DialogForm>
                                </div>
                                <div class="edit-list-item-text" v-if="element.type == 'text'">
                                    <p><i class="iconfont icon-1fuwenben"></i></p>
                                    <p>文本</p>
                                    <div class="btn-edit" @click="editText(index)">修改</div>
                                </div>
                                <i class="btn-del iconfont icon-cha" @click="del(index)"></i>
                            </div>
                        </template>
                    </draggable>
                </div>
                <Modal v-model:open="visible" title="添加文本" @ok="onOk()" :destroyOnClose="true" :width="800">
                    <div class="relative">
                        <Editor v-model:html="editorHtml.html" height="300px"></Editor>
                        <BusinessData v-model:modelValue="editorHtml.html" :dataType="9" type="editor"></BusinessData>
                    </div>
                </Modal>
            </div>
            <div class="goods-detail-preview-warp" v-if="previewHtml" v-html="previewHtml"></div>
            <div class="goods-detail-preview-warp" v-else>
                <div class="preview-warp">商品描述预览区域</div>
            </div>
        </div>
        <div class="extra" v-if="productType == 4">此处填写内容，将在商品付费后展示</div>
    </el-form-item>
</template>
<script setup lang="ts">
import BusinessData from "@/components/multilingual/BusinessData.vue";
import BusinessImg from "@/components/multilingual/BusinessImg.vue";
import { ref, onMounted, computed } from "vue";
import { DialogForm } from "@/components/dialog";
import { Editor } from "@/components/editor";
import { Modal } from "ant-design-vue";
import draggable from "vuedraggable";
import { imageFormat } from "@/utils/format";
const props = defineProps({
    descArr: { type: [Object, Array], default: [] },
    disabled: { type: Boolean, default: false },
    productType: { type: Number, default: 1 },
    label: { type: String, default: "商品详情" }
});
const descArr: any = ref(props.descArr || []);

const visible = ref(false);
const editorHtml = ref({
    html: ""
});
const editTextIndex = ref<number>(0);
const emit = defineEmits(["update:descArr"]);
onMounted(() => {
    emit("update:descArr", descArr);
});
const addPic = (result: any) => {
    for (let idx in result) {
        descArr.value.push({
            pic: result[idx].picUrl,
            type: "pic"
        });
    }
};
const editPic = (result: any, data: any) => {
    descArr.value[editTextIndex.value] = {
        pic: result[0].picUrl,
        type: "pic"
    };
};
const addVideo = (result: any) => {
    for (let idx in result) {
        descArr.value.push({
            cover: result[idx].videoCover,
            type: "video"
        });
    }
};
const editVideo = (result: any, data: any) => {
    descArr.value[editTextIndex.value] = {
        cover: result[0].videoCover,
        type: "video"
    };
};
const showVideo = (data: any) => {
    console.log(data);
};
const previewHtml = computed(() => {
    let htmlArr = [];
    for (let idx in descArr.value) {
        if (descArr.value[idx].type == "pic") {
            htmlArr.push('<div class="desc-pic-item"><img src="' + imageFormat(descArr.value[idx].pic) + '"></div>');
        } else if (descArr.value[idx].type == "video") {
            htmlArr.push(`
                <div class="desc-video-item" @click="${showVideo(descArr.value[idx])}">
                    <div class="desc-video-item-wrap">
                        <i class="iconfont-admin icon-shipin"></i>
                    </div>
                    <img src="${imageFormat(descArr.value[idx].cover)}">
                </div>
            `);
        } else {
            htmlArr.push(descArr.value[idx].html);
        }
    }
    return htmlArr.join("<div data-division=1></div>");
});
const addText = () => {
    visible.value = true;
    editorHtml.value.html = "";
};
const editText = (index: number) => {
    editorHtml.value.html = descArr.value[index].html;
    editTextIndex.value = index + 1;
    visible.value = true;
};
const del = (index: number) => {
    descArr.value.splice(index, 1);
};
const onDelete = (index: number) => {
    descArr.value.splice(index, 1);
};
const onOk = () => {
    if (editTextIndex.value > 0) {
        descArr.value[editTextIndex.value - 1] = {
            html: editorHtml.value.html,
            type: "text"
        };
    } else {
        descArr.value.push({
            html: editorHtml.value.html,
            type: "text"
        });
    }
    editTextIndex.value = 0;
    visible.value = false;
};
</script>

<style lang="less" scoped>
.goods-info-edit-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}
/*商品内容编辑*/
.goods-info-edit-warp {
    flex: 1;
    padding: 15px;
    border: 1px solid #eee;
    box-sizing: border-box;
}

.goods-info-edit-act {
    margin-bottom: 10px;
    align-items: center;
    flex-wrap: wrap;
}

.goods-info-edit-act :deep .add-item {
    transition: all 0.3s;
    margin-right: 10px;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.06);
    border: 0;
    padding: 5px 20px;
    word-break: keep-all;
    color: #333;
}

.goods-info-edit-act :deep .add-item:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #333;
}

.goods-info-edit-act :deep .add-item i,
svg {
    padding-right: 3px;
}
.goods-info-edit-act :deep .add-item svg {
    padding-top: 1px;
}

.goods-info-edit-act span {
    color: #999;
    padding-left: 10px;
}

.info-edit-con-list {
    display: flex;
    flex-wrap: wrap;
    min-height: 120px;
}

.info-edit-con-list .info-edit-list-item {
    width: 100px;
    height: 100px;
    border: 1px solid #eee;
    margin-right: 10px;
    margin-bottom: 10px;
    position: relative;
    margin-top: 6px;
    cursor: pointer;
}

.info-edit-con-list .info-edit-list-item .edit-list-item-img a {
    width: 100px;
    height: 100px;
    align-items: center;
    justify-content: center;
    display: flex;
}

.info-edit-con-list .info-edit-list-item .edit-list-item-img img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    display: block;
}

.info-edit-con-list .info-edit-list-item .edit-list-item-text {
    text-align: center;
    height: 100px;
}

.info-edit-con-list .info-edit-list-item .edit-list-item-text i {
    font-size: 26px;
    padding-top: 26px;
    display: inline-block;
    padding-bottom: 10px;
    color: #666;
}

.info-edit-con-list .info-edit-list-item .btn-del {
    position: absolute;
    cursor: pointer;
    right: -10px;
    top: -10px;
    color: #fff;
    background: #dbdbdb;
    border-radius: 50%;
    z-index: 2;
    width: 18px;
    height: 18px;
    text-align: center;
    line-height: 18px;
    font-size: 12px;
    display: none;
}

.info-edit-con-list .info-edit-list-item:hover {
    border: 1px dashed #155bd4;
}

.info-edit-con-list .info-edit-list-item:hover .btn-del {
    display: block;
}

.info-edit-con-list .info-edit-list-item .btn-del:hover {
    background: #333;
}

.info-edit-con-list .info-edit-list-item :deep .btn-edit {
    display: none;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 24px;
    background: rgba(0, 0, 0, 0.6);
    font-size: 14px;
    line-height: 24px;
    color: #fff;
    text-align: center;
}

.info-edit-con-list .info-edit-list-item:hover :deep .btn-edit {
    display: block;
}

.goods-detail-preview-warp {
    width: 375px;
    overflow-y: auto;
    max-height: 750px;
    min-height: 660px;
    border: 1px dashed #eee;
    .preview-warp {
        width: 375px;
        max-height: 750px;
        min-height: 660px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #999;
        background-color: #f7f8fa;
    }
}
.goods-detail-preview-warp {
    :deep(.desc-video-item) {
        position: relative;
        .desc-video-item-wrap {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.2);
            z-index: 10;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            i {
                font-size: 50px;
                color: #fff;
            }
        }
        img {
            max-width: 100%;
            display: block;
            width: 100%;
        }
    }
    :deep(img) {
        max-width: 100%;
        display: block;
        width: 100%;
    }
}
</style>
