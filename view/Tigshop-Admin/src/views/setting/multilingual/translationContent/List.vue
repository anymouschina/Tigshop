<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <el-tabs v-model="filterParams.dataType" class="demo-tabs" @tab-click="handleClick">
                    <el-tab-pane label="页面文字" :name="0"></el-tab-pane>
                    <el-tab-pane label="接口文字" :name="1"></el-tab-pane>
                    <el-tab-pane label="数据维护" :name="2"></el-tab-pane>
                </el-tabs>
                <div class="list-table-tool lyecs-search-warp">
                    <div class="advanced-search-warp list-table-tool-row">
                        <div class="simple-form-warp">
                            <div class="simple-form-field" v-if="filterParams.dataType == 2 && isOverseas()">
                                <div class="form-group" v-if="adminType == 'admin'">
                                    <div class="control-container">
                                        <el-select v-model="type" placeholder="请选择数据类型" style="width: 100%" @change="onSearchSubmit">
                                            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                                        </el-select>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field" v-if="filterParams.dataType == 2 && isOverseas()">
                                <div class="form-group">
                                    <div class="control-container">
                                        <DialogForm
                                            :params="{ act: 'add', dataType: type, total: total }"
                                            isDrawer
                                            :showClose="false"
                                            :showOnOk="false"
                                            path="setting/multilingual/translationContent/Quick"
                                            title="一键翻译"
                                            width="700px"
                                            @okCallback="getDataList"
                                        >
                                            <el-button type="success">一键翻译</el-button>
                                        </DialogForm>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field" v-else-if="filterParams.dataType != 2">
                                <div class="form-group">
                                    <div class="control-container">
                                        <TigInput
                                            v-model="filterParams.translationName"
                                            name="translationName"
                                            placeholder="请输入原句"
                                            @keyup.enter="onSearchSubmit"
                                        >
                                            <template #append>
                                                <el-button @click="onSearchSubmit"><span class="iconfont icon-chakan1"></span></el-button>
                                            </template>
                                        </TigInput>
                                    </div>
                                </div>
                            </div>
                            <div class="simple-form-field">
                                <el-space>
                                    <DialogForm
                                        v-if="filterParams.dataType < 2"
                                        :params="{ act: 'add', dataType: filterParams.dataType }"
                                        isDrawer
                                        path="setting/multilingual/translationContent/Info"
                                        :title="'添加' + (filterParams.dataType == 0 ? '页面文字' : '接口文字')"
                                        width="700px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">添加语句</el-button>
                                    </DialogForm>
                                    <DialogForm
                                        v-if="filterParams.dataType < 2"
                                        :params="{ act: 'add', dataType: filterParams.dataType }"
                                        isDrawer
                                        path="setting/multilingual/translationContent/Add"
                                        :title="'添加' + (filterParams.dataType == 0 ? '页面文字' : '接口文字')"
                                        width="700px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="primary">批量添加语句</el-button>
                                    </DialogForm>
                                </el-space>
                            </div>
                            <div class="simple-form-field">
                                <el-space>
                                    <DialogForm
                                        v-if="filterParams.dataType < 2"
                                        :params="{
                                            act: 'add',
                                            dataType: filterParams.dataType,
                                            total: selectedIds.length > 0 ? selectedIds.length : total,
                                            ids: selectedIds
                                        }"
                                        isDrawer
                                        :showClose="false"
                                        :showOnOk="false"
                                        path="setting/multilingual/translationContent/Quick"
                                        :title="selectedIds.length ? '批量翻译' : '一键翻译'"
                                        width="700px"
                                        @okCallback="loadFilter"
                                    >
                                        <el-button type="success">{{ selectedIds.length ? "批量翻译" : "一键翻译" }}</el-button>
                                    </DialogForm>
                                    <el-popconfirm title="您确认要批量删除所选数据吗？" @confirm="onBatchSubmit('del')">
                                        <template #reference>
                                            <el-button v-if="filterParams.dataType < 2" :disabled="selectedIds.length === 0">批量删除</el-button>
                                        </template>
                                    </el-popconfirm>
                                    <span v-if="selectedIds.length > 0">
                                        已选择：<b>{{ selectedIds.length }}</b> 项
                                    </span>
                                </el-space>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <a-spin :spinning="loading">
                        <el-table
                            :data="filterState"
                            row-key="id"
                            @selection-change="onSelectChange"
                            :total="total"
                            @sort-change="onSortChange"
                            :loading="loading"
                            v-if="filterParams.dataType < 2"
                        >
                            <el-table-column type="selection" width="32" />
                            <el-table-column label="原句" prop="translationName" sortable="custom" show-overflow-tooltip fixed="left">
                                <template #default="{ row }">
                                    {{ row.translationName || "--" }}
                                </template>
                            </el-table-column>
                            <el-table-column v-for="(item, index) in locales" :label="item.language" :prop="item.localeCode" show-overflow-tooltip>
                                <template #default="{ row }">
                                    {{ translationData(item.id, row.tdata) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="翻译类型" prop="dataType" :width="150">
                                <template #default="{ row }">
                                    <div>{{ row.dataType == 0 ? "页面文字" : "接口文字" }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" :width="150">
                                <template #default="{ row }">
                                    <DialogForm
                                        isDrawer
                                        @okCallback="loadFilter"
                                        :title="'编辑' + (row.dataType == 0 ? '页面文字' : '接口文字')"
                                        width="700px"
                                        path="setting/multilingual/translationContent/Info"
                                        :params="{ act: 'detail', id: row.id, dataType: filterParams.dataType }"
                                    >
                                        <a class="btn-link">编辑</a>
                                    </DialogForm>
                                    <el-divider direction="vertical" />
                                    <DeleteRecord @afterDelete="loadFilter" :requestApi="delTranslations" :params="{ id: row.id }">删除</DeleteRecord>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <div class="empty-warp">
                                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                                </div>
                            </template>
                        </el-table>
                        <el-table :data="filterState" row-key="id" :total="total" :loading="loading" v-else>
                            <el-table-column label="原句" prop="name">
                                <template #default="{ row }">
                                    <div v-if="filterParams.dataType == 2">
                                        {{ type == 2 ? row.productName : type == 3 ? row.categoryName : type == 4 ? row.brandName : row.articleTitle }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="翻译类型" prop="dataType" :width="150">
                                <template #default="{ row }">
                                    <div v-if="filterParams.dataType == 2">{{ type == 2 ? "商品名称" : type == 3 ? "分类名称" : "品牌名称" }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" :width="150">
                                <template #default="{ row }">
                                    <DialogForm
                                        v-if="filterParams.dataType == 2"
                                        isDrawer
                                        @okCallback="onSearchSubmit"
                                        title="查看"
                                        width="800px"
                                        path="setting/multilingual/translationContent/BusinessDialog"
                                        :params="{
                                            act: 'detail',
                                            id: type == 2 ? row.productId : type == 3 ? row.categoryId : type == 4 ? row.brandId : row.articleId,
                                            dataType: type,
                                            translationName:
                                                type == 2 ? row.productName : type == 3 ? row.categoryName : type == 4 ? row.brandName : row.articleTitle
                                        }"
                                    >
                                        <a class="btn-link">翻译</a>
                                    </DialogForm>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <div class="empty-warp">
                                    <div v-if="!loading" class="empty-bg">暂无数据</div>
                                </div>
                            </template>
                        </el-table>
                    </a-spin>
                    <div class="pagination-con" v-if="total > 0">
                        <Pagination
                            v-if="filterParams.dataType < 2"
                            v-model:page="filterParams.page"
                            v-model:size="filterParams.size"
                            :total="total"
                            @callback="loadFilter"
                        />
                        <Pagination v-else v-model:page="optionsParams.page" v-model:size="optionsParams.size" :total="total" @callback="getDataList" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { PopForm } from "@/components/pop-form";
import { ref, reactive, onMounted } from "vue";
import { DeleteRecord, Switch, Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import type { TranslationsFilterState, TranslationsFilterParams } from "@/types/multilingual/translationContent.d";
import { getTranslationsList, getTranslationsList3, batchSubmit, delTranslations } from "@/api/multilingual/translationContent";
import { getProductList } from "@/api/product/product";
import { getBrandList } from "@/api/product/brand";
import { getCategoryList } from "@/api/product/category";
import { getArticleList } from "@/api/content/article";
import { useRouter } from "vue-router";
import { isOverseas } from "@/utils/version";
const adminType = ref<any>(localStorage.getItem("adminType"));
const config: any = useConfigStore();
const props = defineProps({
    promotionType: {
        type: Number,
        default: 1
    }
});
const type = ref(2);
const options = ref([
    {
        label: "商品",
        value: 2
    },
    {
        label: "分类",
        value: 3
    },
    {
        label: "品牌",
        value: 4
    },
    {
        label: "文章",
        value: 6
    }
]);
// 基本参数定义
const filterState = ref<TranslationsFilterState[]>();
const loading = ref<boolean>(true);
const total = ref<number>(0);
const selectedIds = ref<number[]>([]);
const filterParams = reactive<TranslationsFilterParams>({
    page: 1,
    size: config.get("pageSize"),
    sortField: "",
    sortOrder: "",
    translationName: "",
    localeCode: "",
    dataType: 0
});
const optionsParams = reactive<any>({
    page: 1,
    size: config.get("pageSize"),
    sortField: "",
    sortOrder: ""
});
const translationData = (id: number, tdata: any) => {
    const data = tdata.find((item: any) => item.localeId === id);
    return data ? data.translationValue : "";
};
const handleClick = (tab: any, event: Event) => {
    filterParams.page = 1;
    filterState.value = [];
    if (filterParams.dataType < 2) {
        loadFilter();
    } else {
        optionsParams.page = 1;
        getDataList();
    }
};
// 获取列表的查询结果
const getDataList = async () => {
    const functionMap: { [key: number]: (params: any) => Promise<any> } = {
        2: getProductList,
        3: getCategoryList,
        4: getBrandList,
        6: getArticleList
    };
    const fn = functionMap[type.value];
    if (type.value == 3) {
        optionsParams.parentId = -1;
    }
    loading.value = true;
    try {
        if (typeof fn === "function") {
            const result = await fn({ ...optionsParams });
            filterState.value = result.records;
            total.value = result.total;
        } else {
            console.error("fn 不是一个有效的函数");
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const locales = ref<any[]>([]);
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result2 = await getTranslationsList3();
        locales.value = result2;
        const result = await getTranslationsList({ ...filterParams, localeIds: locales.value.map((item: any) => item.id).join(",") });
        filterState.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const query = useRouter().currentRoute.value.query;
onMounted(() => {
    if (query.type && query.type !== "") {
        filterParams.dataType = 2;
        if (query.type === "product") {
            type.value = 2;
        }
        if (query.type === "category") {
            type.value = 3;
        }
        if (query.type === "brand") {
            type.value = 4;
        }
        if (query.type === "article") {
            type.value = 6;
        }
        getDataList();
    } else {
        loadFilter();
    }
});

// 参数查询
const onSearchSubmit = () => {
    if (filterParams.dataType < 2) {
        loadFilter();
    } else {
        getDataList();
    }
};
// 修改排序
const onSortChange = ({ prop, order }: { prop: string; order?: string }) => {
    filterParams.sortField = prop;
    filterParams.sortOrder = order == "ascending" ? "asc" : order == "descending" ? "desc" : "";
    loadFilter();
};

// 批量操作
const onBatchSubmit = async (action: string) => {
    try {
        const result = await batchSubmit(action, { ids: selectedIds.value });
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    }
};
// 多选操作
const onSelectChange = (e: TranslationsFilterState[]) => {
    selectedIds.value = e.map((item: any) => item.id);
};
defineExpose({
    loadFilter
});
</script>
<style></style>
