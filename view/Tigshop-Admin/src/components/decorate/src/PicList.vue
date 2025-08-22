<template>
    <div style="width: 100%">
        <div class="gallery-list-warp">
            <div class="dec-pic-group">
                <div class="dec-pic-group-list">
                    <draggable
                        class="gallery-list-ul"
                        item-key=""
                        :list="<any>photos"
                        ghost-class="ghost"
                        chosen-class="chosenClass"
                        animation="300"
                        @start=""
                        @end=""
                    >
                        <template #item="{ element, index }">
                            <div class="dec-pic-group-item">
                                <div class="dec-pic-group-item-con">
                                    <div class="item-image" v-if="showImage">
                                        <div class="item-image-con">
                                            <img class="item-image-src" v-if="element.picThumb" :src="imageFormat(element.picThumb)" />
                                            <DialogForm type="gallery" class="" @okCallback="onEdit" :params="{ isMultiple: false }" :data="{ index: index }">
                                                <span class="change-image">更换图片</span>
                                            </DialogForm>
                                        </div>
                                    </div>
                                    <div class="item-info">
                                        <div class="item-info-item item-info-title" v-if="showText">
                                            <span class="lable">标题</span>
                                            <TigInput width="100%" placeholder="建议10个字以内，可不填" v-model="element.picTitle"></TigInput>
                                        </div>
                                        <div class="item-info-item item-info-title" v-if="showDesc">
                                            <span class="lable">描述</span>
                                            <TigInput width="100%" placeholder="可不填" v-model="element.picDesc"></TigInput>
                                        </div>
                                        <div class="item-info-item item-info-link">
                                            <span class="lable">链接</span>
                                            <div class="lyecs-link-select">
                                                <SelectLink
                                                    v-model="element.picLink"
                                                    :disabled="element.type == 'default'"
                                                    :decorateType="decorateType"
                                                ></SelectLink>
                                            </div>
                                        </div>
                                        <div class="item-info-item item-info-color" v-if="showColor">
                                            <span class="lable">背景色</span>
                                            <div class="lyecs-link-select">
                                                <div class="flex flex-align-center">
                                                    <div><SelectColor v-model:color="element.gradientColorA"></SelectColor></div>
                                                    <div style="margin: 0 10px">-</div>
                                                    <div><SelectColor v-model:color="element.gradientColorB"></SelectColor></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="isMultiple == true" class="del-item" @click="removePic(index)"><i class="ico-decorate icon-dec-cha"></i></div>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>
                <div class="dec-pic-group-list" v-if="isMultiple == false">
                    <div class="dec-pic-group-item">
                        <div class="dec-pic-group-item-con">
                            <div class="item-image" v-if="showImage">
                                <div class="item-image-con">
                                    <img class="item-image-src" v-if="photo.picThumb" :src="imageFormat(photo.picThumb)" />
                                    <DialogForm type="gallery" class="" @okCallback="onEdit" :params="{ isMultiple: false }">
                                        <span class="change-image">{{ photo.picThumb ? "更换图片" : "添加图片" }}</span>
                                    </DialogForm>
                                </div>
                            </div>
                            <div class="item-info">
                                <div class="item-info-item item-info-title" v-if="showText">
                                    <span class="lable">标题</span>
                                    <TigInput width="100%" placeholder="建议10个字以内，可不填" v-model="photo.picTitle"></TigInput>
                                </div>
                                <div class="item-info-item item-info-title" v-if="showDesc">
                                    <span class="lable">描述</span>
                                    <TigInput width="100%" placeholder="可不填" v-model="photo.picDesc"></TigInput>
                                </div>
                                <div class="item-info-item item-info-link">
                                    <span class="lable">链接</span>
                                    <div class="lyecs-link-select">
                                        <SelectLink v-model="photo.picLink" :decorateType="decorateType"></SelectLink>
                                    </div>
                                </div>
                                <div class="item-info-item item-info-color" v-if="showColor">
                                    <span class="lable">背景色</span>
                                    <div class="lyecs-link-select">
                                        <div class="flex flex-align-center">
                                            <div><SelectColor v-model:color="photo.gradientColorA"></SelectColor></div>
                                            <div style="margin: 0 10px">-</div>
                                            <div><SelectColor v-model:color="photo.gradientColorB"></SelectColor></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="del-item" @click="removePhoto()"><i class="ico-decorate icon-dec-cha"></i></div>
                        </div>
                    </div>
                </div>
                <div class="dec-pic-add-con" v-if="isMultiple == true">
                    <DialogForm v-if="showImage" type="gallery" class="" @okCallback="onAdd" :params="{ isMultiple: isMultiple }" style="width: 100%">
                        <a class="dec-pic-add-btn"><i class="ico-decorate icon-dec-jia"></i>{{ title }}</a>
                    </DialogForm>
                    <a v-else @click="onAdd" class="dec-pic-add-btn"><i class="ico-decorate icon-dec-jia"></i>{{ title }}</a>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { reactive, ref, toRefs } from "vue";
import { SelectColor } from "@/components/select";
import type { Ref } from "vue";
import { DialogForm } from "@/components/dialog";
import draggable from "vuedraggable";
import { SelectLink } from "@/components/select";
import { imageFormat } from "@/utils/format";
const dom: Ref<HTMLDivElement> = ref(null) as any;

const props = defineProps({
    isMultiple: {
        type: Boolean,
        default: false
    },
    showDesc: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: "添加图片"
    },
    showText: {
        type: Boolean,
        default: true
    },
    showImage: {
        type: Boolean,
        default: true
    },
    showColor: {
        type: Boolean,
        default: false
    },
    backgroundColor: {
        type: Array,
        default: () => []
    },
    decorateType: {
        type: String,
        default: ""
    }
});
// 动态解析props
const photos = defineModel<any>("photos", { type: Array, default: [] });
const photo = defineModel<any>("photo", { type: Object, default: {} });
// const emit = defineEmits(['update:photo'])
const { isMultiple } = toRefs(props);

const onEdit = (result: any, data: any) => {
    if (isMultiple.value) {
        Object.assign(photos.value[data.index], result[0]);
    } else {
        photo.value = result[0];
    }
};
const onAdd = (result: any) => {
    if (!props.showImage) {
        let obj = {
            path: "",
            label: "",
            name: "",
            data: {
                name: "",
                path: ""
            }
        };
        photos.value.push(obj);
    } else if (props.showColor) {
        let obj = {
            gradientColorA: props.backgroundColor[0],
            gradientColorB: props.backgroundColor[1]
        };
        result.forEach((item: any) => {
            Object.assign(item, obj);
        });
        photos.value.push(...result);
    } else {
        photos.value.push(...result);
    }
};
const removePic = (index: number) => {
    photos.value.splice(<any>index, 1);
};
const removePhoto = () => {
    photo.value = {
        picId: "",
        picThumb: "",
        picTitle: "",
        picName: "",
        picDesc: "",
        picLink: {
            label: "",
            name: "",
            data: {
                name: "",
                path: ""
            }
        },
        gradientColorA: "",
        gradientColorB: "",
    };
};
</script>

<style lang="less" scoped></style>
