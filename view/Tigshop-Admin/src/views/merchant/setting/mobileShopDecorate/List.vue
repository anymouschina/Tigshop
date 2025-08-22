<template>
    <div class="container">
        <div class="content_wrapper">
            <el-tabs v-model="activeName" class="demo-tabs">
                <el-tab-pane label="店铺页面" :name="1">
                    <div class="lyecs-table-list-warp">
                        <div class="list-table-tool lyecs-search-warp">
                            <el-form :model="filterParams">
                                <div class="advanced-search-warp list-table-tool-row">
                                    <div class="simple-form-warp">
                                        <div class="simple-form-field">
                                            <div class="form-group">
                                                <div class="control-container">
                                                    <TigInput
                                                        v-model="filterParams.keyword"
                                                        name="keyword"
                                                        placeholder="输入页面名称"
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
                                            <div class="form-group">
                                                <DialogForm
                                                    isDrawer
                                                    @okCallback="loadFilter"
                                                    title="添加页面"
                                                    width="600px"
                                                    path="decorate/mobileDecorate/Info"
                                                    :params="{ act: 'add', decorateType }"
                                                >
                                                    <el-button type="primary">添加页面</el-button>
                                                </DialogForm>
                                            </div>
                                        </div>
                                        <div class="simple-form-field">
                                            <div class="form-group">
                                                <el-button type="success" @click="importDecorate">导入装修链接</el-button>
                                            </div>
                                        </div>
                                        <div class="simple-form-field">
                                            <div class="form-group">
                                                <el-space>
                                                    <el-popconfirm title="您确认要批量删除所选数据吗？" @confirm="onBatchSubmit('del')">
                                                        <template #reference>
                                                            <el-button :disabled="selectedIds.length === 0">批量删除</el-button>
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
                            </el-form>
                        </div>
                        <div class="table-container">
                            <a-spin :spinning="loading">
                                <el-table
                                    :data="filterState"
                                    row-key="decorateId"
                                    @selection-change="onSelectChange"
                                    :total="total"
                                    @sort-change="onSortChange"
                                    :loading="loading"
                                >
                                    <el-table-column type="selection" width="32" />
                                    <el-table-column label="页面名称" prop="decorateId" sortable="custom" :width="300">
                                        <template #default="{ row }">
                                            <div style="position: relative">
                                                <el-space>
                                                    <PopForm
                                                        label="页面名称"
                                                        type="textarea"
                                                        :requestApi="updateDecorateFiled"
                                                        v-model:org-value="row.decorateTitle"
                                                        :params="{ id: row.decorateId, field: 'decorateTitle' }"
                                                        :max="50"
                                                    >
                                                        <div>{{ row.decorateTitle }}</div>
                                                    </PopForm>
                                                </el-space>
                                            </div>
                                            <el-tag v-if="row.isHome === 1" type="success" :hit="false" effect="light" size="small" disable-transitions
                                                >首页</el-tag
                                            >
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="发布状态" prop="status" sortable="custom" :width="150">
                                        <template #default="{ row }">
                                            {{ row.status == 1 ? "已发布" : "未发布" }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="更新时间" prop="updateTime" sortable="custom">
                                        <template #default="{ row }">
                                            {{ row.updateTime }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="操作" fixed="right" :width="220">
                                        <template #default="{ row }">
                                            <router-link
                                                v-if="props.decorateType === 1"
                                                :to="{ path: '/decorate/index', query: { id: row.decorateId } }"
                                                target="_blank"
                                                class="btn-link"
                                                >编辑</router-link
                                            >
                                            <router-link
                                                v-if="props.decorateType === 2"
                                                :to="{ path: '/decorate/pc', query: { id: row.decorateId } }"
                                                target="_blank"
                                                class="btn-link"
                                                >编辑</router-link
                                            >
                                            <el-divider direction="vertical" />
                                            <template v-if="row.isHome == 0 && row.status == 1">
                                                <a class="btn-link" @click="setHome(row)">设为首页</a>
                                                <el-divider direction="vertical" />
                                            </template>
                                            <a class="btn-link" @click="onCopy(row)">复制</a>
                                            <template v-if="row.isHome == 0">
                                                <el-divider direction="vertical" />
                                                <DeleteRecord @afterDelete="loadFilter" :requestApi="delDecorate" :params="{ id: row.decorateId }"
                                                    >删除</DeleteRecord
                                                >
                                            </template>
                                            <el-divider direction="vertical" />
                                            <a class="btn-link" @click="onShare(row.decorateId)">分享</a>
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
                                <Pagination v-model:page="filterParams.page" v-model:size="filterParams.size" :total="total" @callback="loadFilter" />
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="其他模块" :name="2">
                    <OtherPage></OtherPage>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { PopForm } from "@/components/pop-form";
import { ref, reactive, onMounted } from "vue";
import { DeleteRecord, Switch, Pagination } from "@/components/list";
import { Image } from "@/components/image";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import { FilterState, FilterParams } from "@/types/decorate/mobileDecorate.d";
import {
    getDecorateList,
    batchSubmit,
    updateDecorateFiled,
    delDecorate,
    updateDecorate,
    decorateShare,
    importDecorateLink
} from "@/api/decorate/mobileDecorate";
import { Tag } from "@/components/form";
import OtherPage from "@/views/merchant/setting/mobileShopDecorate/OtherPage.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { copyDomText } from "@/utils/util";
const props = defineProps({
    decorateType: {
        type: Number,
        default: 1
    }
});
const activeName = ref(1);
const config: any = useConfigStore();
// 基本参数定义
const filterState = ref<FilterState[]>();
const loading = ref<boolean>(true);
const total = ref<number>(0);
const selectedIds = ref<number[]>([]);
const advancedSearch = ref<boolean>(false);
const filterParams = reactive<FilterParams>({
    page: 1,
    decorateType: props.decorateType,
    size: config.get("pageSize"),
    sortField: "",
    sortOrder: "",
    keyword: ""
});
const onShare = async (id: number) => {
    loading.value = true;
    try {
        const result = await decorateShare({ decorateId: id });
        copyDomText(`${window.location.protocol}//${window.location.host.split(":")[0]}${result.apiUrl}`);
        message.success("分享链接已经复制到剪贴板, 导入时可直接粘贴使用");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

const importDecorate = () => {
    ElMessageBox.prompt("请把分享链接粘贴在此处", "导入装修链接", {
        confirmButtonText: "确定",
        cancelButtonText: "取消"
    }).then(({ value }) => {
        _importDecorateLink(value);
    });
};
const _importDecorateLink = async (url: string) => {
    loading.value = true;
    try {
        const urlEncode = decodeURIComponent(url);
        const result = await importDecorateLink({ url: urlEncode });
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getDecorateList({ ...filterParams });
        filterState.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    loadFilter();
});

// 参数查询
const onSearchSubmit = () => {
    loadFilter();
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
    } finally {
    }
};
// 多选操作
const onSelectChange = (e: FilterState[]) => {
    selectedIds.value = e.map((item) => item.decorateId);
};
// 设置为首页
const setHome = async (row: FilterState) => {
    try {
        const result = await updateDecorate("setHome", { id: row.decorateId });
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    } finally {
    }
};
// 复制
const onCopy = async (row: FilterState) => {
    try {
        const result = await updateDecorate("copy", { id: row.decorateId });
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    } finally {
    }
};
</script>
