<template>
    <el-tree-select :style="{width: minWidth}" placeholder="请选择..." v-model="props.catId" :fit-input-width="false" :props="treeProps" :multiple="false" :data="articleCatList" check-strictly
        :render-after-expand="false" check-on-click-node />
</template>
<script setup lang="ts">
import { ref, toRefs, onMounted } from "vue"
import request from '@/utils/request'
// 传值
const props = defineProps({
    catId: { type: [Number, Array], default: null },
    multiple: { type: Boolean, default: false },
    minWidth: { type: String, default: '' },
})
const treeProps = { label: 'catName', value: 'catId', children: 'children' }
// 文章列表
const articleCatList = ref([
    { catName: '请选择...', catId: 0 }
]);
const total = ref(0);
const loaded = ref(false)
// 给父组件传值
const emit = defineEmits(['update:catId'])
onMounted(async () => {
    loadList();
});

function loadList() {
    if (loaded.value == false) {
        request({
            url: 'content/articleCat/list',
            method: 'post',
            data: {
                ids: props.catId,
            }
        }).then((result: any) => {
            articleCatList.value.push(...result.records)
            total.value = result.total
        })
    } else {
        articleCatList.value = [];
        total.value = 0
    }

}
</script>

<style lang="less" scoped></style>
