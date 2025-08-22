<template>
    <div :style="{ width: `${minWidth}px`}">
        <div v-for="(item,index) in list" class="dynamic-style">
            <div class="content-style">
                <slot :item="item" name="dynamicSlot"></slot>
            </div>
            <div class="delete-style" @click="deleteList(index)">
                <em class="main_pel_m iconfont">&#xe62c;</em>
            </div>
        </div>
        <el-button :type="buttonType" @click="addList">{{ buttonName }}</el-button>
        <div v-if="extra" class="extra">{{ extra }}</div>
    </div>
</template>
<script lang="ts" setup>
import {computed} from "vue";

const props = defineProps({
    modelValue: {
        default: [],
        type: Array
    },
    templateList: {
        default: [],
        type: Array
    },
    templateListType: {
        default: [],
        type: Array
    },
    minWidth: {
        default: 400,
        type: Number
    },
    buttonName: {
        default: '添加',
        type: String
    },
    extra: {
        default: '',
        type: String
    },
    buttonType: {
        default: '',
        type: String
    }
});

const list = computed({
    get: () => props.modelValue,
    set: (newValue) => {
        emit("update:modelValue", newValue)
    }
});


const emit = defineEmits(["update:modelValue"]);
const addList = () => {
    const newItem = {};
    console.log(props.templateList);
    props.templateList.forEach((item: any, index: number) => {
        if (props.templateListType[index] === 'number') {
            (newItem as any)[item] = null;
        } else if (props.templateListType[index] === 'string') {
            (newItem as any)[item] = '';
        } else if (props.templateListType[index] === 'boolean') {
            (newItem as any)[item] = false;
        }else{
            (newItem as any)[item] = '';
        }
    });
    list.value = [...list.value, newItem];
};

const deleteList = (index: number) => {
    if (index >= 0 && index < list.value.length) {
        const updatedList = [...list.value];
        updatedList.splice(index, 1);
        list.value = updatedList;
    }
};
</script>
<style lang="less" scoped>
.dynamic-style {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;

    .delete-style {
        cursor: pointer;
        margin-left: 8px;
    }

    .content-style {
        width: 100%
    }

}
</style>
<style>
.dynamic-div {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    width: 100%;
    font-size: 12px;
    gap: 8px;
    white-space: nowrap;
}
</style>
