<template>
    <el-cascader
        ref="cascaderRef"
        v-model="categoryId"
        :options="options"
        :props="cascaderProps"
        class="cascader"
        clearable
        placeholder="选择分类"
        @change="onChange"
        @clear="onClear"
        @visible-change="visibleChange"
    />
</template>
<script lang="ts" setup>
import { defineModel, onMounted, ref, PropType } from "vue";
import { ElCascader } from "element-plus";
import { message } from "ant-design-vue";


import { getAllShopProductCategoryList } from "@/api/product/shopProductCategory";
import { useShopProductCategoryStore } from "@/store/shopProductCategory";
import type { ShopProductCategoryFilterState } from "@/types/product/shopProductCategory";
// 传值
const props = defineProps({
    multiple: { type: Boolean, default: false },
    categoryList: { type: Array as PropType<ShopProductCategoryFilterState[]>, default: () => [] }
});
const categoryId = defineModel<any>("categoryId");
const categoryName = defineModel<any>("categoryName");
const cascaderProps = { label: "categoryName", value: "categoryId", children: "children", multiple: props.multiple, checkStrictly: true };
const categoryStore = useShopProductCategoryStore();
//选项卡
const options = ref<ShopProductCategoryFilterState[]>([]);
const loading = ref(false);
const loaded = ref(false);
// 当前值
// 手动控制显示和隐藏
const open = ref(false);
// 给父组件传值
// 加载分类
onMounted(() => {
    if (props.categoryList.length > 1) {
        options.value = props.categoryList;
    } else {
        loadCategory();
    }
});
const loadCategory = async () => {
    if (loaded.value === true) return;
    loading.value = true;
    if (categoryStore.shopProductCategoryTree !== null) {
        options.value = categoryStore.shopProductCategoryTree;
        return;
    }
    try {
        const result = await getAllShopProductCategoryList();
        options.value = result;
        categoryStore.shopProductCategoryTree = result;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
        loaded.value = true;
    }
};
// 监听变化
const cascaderRef = ref();
const onChange = (ids: any) => {
    if (props.multiple == true) {
        categoryId.value = ids?.map((subArray: any) => subArray[subArray.length - 1]);
    } else {
        const item = cascaderRef.value.getCheckedNodes();

        categoryName.value = item[0] ? item[0].text : "";
        // 注意categoryName要先于categoryId设置，因为选择链接的地方监听了categoryId
        console.log(ids ? ids[ids.length - 1] : 0);
        categoryId.value = ids ? ids[ids.length - 1] : 0;
    }
};
const visibleChange = (e: any) => {
    if (e) {
        loadCategory();
    }
};
const onClear = () => {
    if (props.multiple == true) {
        categoryId.value = [];
    } else {
        categoryId.value = 0;
        categoryName.value = "";
    }
};

// 处理分类数组
function dealCatArr(arr: any) {
    arr = arr.flat();
    arr = buildTree(arr, 0);
    arr = processArray(arr);
    return arr;
}

// 定义一个递归函数，用于处理多维数组并返回新的数组
function processArray(arr: any[]): any[] {

    return arr?.map((item) => {
        if (Array.isArray(item) || typeof item === "object") {
            if (item.children) {
                item.children = processArray(item.children);
            }
            item.isLeaf = false; // 修改为新的值
        }
        return item;
    });
}

function buildTree(categories: any, parentId = 0) {
    const tree = [];
    for (const category of categories) {
        if (category.parentId === parentId) {
            const children = buildTree(categories, category.categoryId);
            if (children.length) {
                category.children = children;
            }
            tree.push(category);
        }
    }
    return tree;
}
</script>
<style lang="less" scoped></style>
