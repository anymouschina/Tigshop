<template>
    <div class="sort-main" @click="toggleSort">{{ text }}
        <div class="sort-button">
            <div :style="{ 'border-top-color': isAscending == 'desc' ? '#4d8dfa' : '#b7bec9' }" class="triangle-down"></div>
            <div :style="{ 'border-bottom-color': isAscending == 'asc' ? '#4d8dfa' : '#b7bec9' }" class="triangle-up"></div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps({
    text: String,
    sortName: String,
    sortField: String,
    sortOrder: String,
})
// asc none desc
const isAscending: any = ref(props.sortOrder);
const emit = defineEmits(["update:sortOrder", "update:sortField", 'loadData']);
if (props.sortName == props.sortField) {
    isAscending.value = "desc"
} else {
    isAscending.value = ""
}
const toggleSort = () => {
    if (isAscending.value == '') {
        isAscending.value = 'desc'
        emit("update:sortField", props.sortName);
    } else if (isAscending.value == 'desc') {
        isAscending.value = "asc"
        emit("update:sortField", props.sortName);
    } else {
        isAscending.value = ''
        emit("update:sortField", '');
    }
    emit("update:sortOrder", isAscending.value);
    emit("loadData", props.sortName)
};

</script>
<style lang="less" scoped>
.sort-main {
    vertical-align: middle;
    display: inline-block;
    cursor: pointer;
}

.sort-button {
    display: inline-block;
    position: relative;
    cursor: pointer;
    padding: 6px;
    margin-left: 4px;
    vertical-align: middle;
}

.triangle-up,
.triangle-down {
    width: 0;
    height: 0;
    display: block;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
}

.triangle-up {
    border-bottom: 4px solid gray;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.triangle-down {
    border-top: 4px solid gray;
    position: absolute;
    bottom: 1px;
    left: 50%;
    transform: translateX(-50%);
}
</style>
