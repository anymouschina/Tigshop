<template>
    <div class="div0">
        <div class="tag-container">
            <div v-for="(item, index) in filterState" :key="index" :class="{ 'active': activeItem == item.name }" class="tag" @click="selectItem(item)">
                {{ item.name }}
            </div>
        </div>

    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { LinkFilterState } from "@/types/decorate/pcNavigation.d";
import { message } from "ant-design-vue";
import { getSelectLinkList } from "@/api/decorate/pcNavigation";
const linkSelectData = defineModel('linkSelectData');
const filterState = ref<LinkFilterState[]>();
const activeItem = ref(null);
const emit = defineEmits(['update:modelValue'])
const selectItem = (value:any) => {
    activeItem.value = value.name;
    link.value = value
    linkSelectData.value = {
        path: 'base',
        label: value.name,
        name: value.name,
        link: value.link
    }
};
// 传值
const props = defineProps({
    modelValue: { type: Object },
    //multiple 是否多选，可直接写在父组件
})
const link = computed({
    get: () => props.modelValue,
    set: (newValue) => {
        emit("update:modelValue", newValue)
    }
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getSelectLinkList();
        filterState.value = result;
    } catch (error:any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}
onMounted(() => {
    loadFilter();
});

</script>
<style scoped lang="less">
.div0 {
    .tag-container {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .tag {
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 5px 12px;
        white-space: nowrap;
        cursor: pointer;
        color: #666;
        transition: all 0.3s;
        font-size: 12px;
        line-height: 20px;
    }

    .tag.active {
        border-color: #428ce8;
        color: #428ce8;
    }
}
</style>
