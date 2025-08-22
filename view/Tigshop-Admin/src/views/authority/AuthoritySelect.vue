<template>
    <el-form label-width="auto"> </el-form>
    <div class="right-body">
        <div class="title">
            <div class="left-div">
                <el-checkbox :model-value="isCheckAll" @update:model-value="handleCheckAll" :indeterminate="isCheckAllIndeterminate">
                    <span style="font-weight: 500">全选</span>
                </el-checkbox>
            </div>
            <div class="right-div">权限列表</div>
        </div>
        <a-spin :spinning="loading" style="width: 100%; margin-top: 100px"></a-spin>
        <template v-if="!loading">
            <div v-for="item in authorityList" :key="item.authorityId" class="info">
                <div class="left-div">
                    <el-checkbox
                        :model-value="isChildAllChecked(item)"
                        :indeterminate="isChildIndeterminate(item)"
                        @update:model-value="(e: any) => handleCheckChildAll(e, item)"
                    >
                        <span style="font-weight: 500">{{ item.authorityName }}</span>
                    </el-checkbox>
                </div>
                <div class="right-div">
                    <div class="child-div mb10" v-for="value in item.children" :key="value.authorityId">
                        <div class="ml10">
                            <el-checkbox
                                :indeterminate="isChildIndeterminate2(value)"
                                :model-value="isChildAllChecked2(value)"
                                @update:model-value="(e: any) => handleCheckChildAll2(e, value, item)"
                            >
                                <el-dropdown v-if="value.childAuth && value.childAuth.length > 0" :hide-on-click="false">
                                    <span
                                        >{{ value.authorityName }}<el-icon class="el-icon--right"><arrow-down /></el-icon
                                    ></span>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <!-- <el-dropdown-item>
                                                <el-checkbox
                                                    style="width: 100%"
                                                    :model-value="isChildAllChecked2(value)"
                                                    :indeterminate="isChildIndeterminate2(value)"
                                                    @update:model-value="(e: any) => handleCheckChildAll2(e, value, item)"
                                                >
                                                    <span style="font-weight: 500">{{ value.authorityName }}</span>
                                                </el-checkbox>
                                            </el-dropdown-item> -->
                                            <el-dropdown-item v-for="auth in value.childAuth" @click.native="() => {}">
                                                <el-checkbox
                                                    style="width: 100%"
                                                    :model-value="isChildChecked(auth)"
                                                    @update:model-value="(e: any) => handleChildChecked(e, auth, value, item)"
                                                >
                                                    <span style="font-weight: 500">{{ auth.authName }}</span>
                                                </el-checkbox>
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                                <span v-else>{{ value.authorityName }}</span>
                            </el-checkbox>
                        </div>
                        <div class="child-box flex" v-if="value.children && value.children.length > 0">
                            <div class="child2-div" v-for="value2 in value.children" :key="value2.authorityId">
                                <el-checkbox
                                    :indeterminate="isChildIndeterminate2(value2)"
                                    :model-value="isChildAllChecked2(value2)"
                                    @update:model-value="(e: any) => handleCheckChildAll2(e, value2, value, item)"
                                >
                                    <el-dropdown v-if="value2.childAuth && value2.childAuth.length > 0" :hide-on-click="false">
                                        <div class="flex align-center">
                                            {{ value2.authorityName }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
                                        </div>
                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <!-- <el-dropdown-item>
                                                    <el-checkbox
                                                        style="width: 100%"
                                                        :model-value="isChildAllChecked2(value2)"
                                                        :indeterminate="isChildIndeterminate2(value2)"
                                                        @update:model-value="(e: any) => handleCheckChildAll2(e, value2, item)"
                                                    >
                                                        <span style="font-weight: 500">{{ value2.authorityName }}</span>
                                                    </el-checkbox>
                                                </el-dropdown-item> -->
                                                <el-dropdown-item v-for="auth2 in value2.childAuth" @click.native="() => {}">
                                                    <el-checkbox
                                                        style="width: 100%"
                                                        :model-value="isChildChecked(auth2)"
                                                        @update:model-value="(e: any) => handleChildChecked(e, auth2, value2, value, item)"
                                                    >
                                                        <span style="font-weight: 500">{{ auth2.authName }}</span>
                                                    </el-checkbox>
                                                </el-dropdown-item>
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>
                                    <span v-else>{{ value2.authorityName }}</span>
                                </el-checkbox>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { AuthorityFormState } from "@/types/authority/authority";
import { getAllAuthority } from "@/api/authority/authority";
import { message } from "ant-design-vue";
import { ArrowDown, SemiSelect, Select } from "@element-plus/icons-vue";

const props = defineProps({
    modelValue: { type: Array, default: [] },
    adminType: { type: String, default: "" }
});
const loading = ref<boolean>(true);
const checkAll = ref(false);
const isCheckAll = computed(() => {
    return props.modelValue.includes("all");
});
const isCheckAllIndeterminate = computed(() => {
    return props.modelValue.length > 0 && !props.modelValue.includes("all");
});
const handleCheckAll = (e: any) => {
    console.log(e);
    if (e === false) {
        emit("update:modelValue", []);
    } else {
        emit("update:modelValue", ["all"]);
    }
};
// 有all且取消某一个子菜单时
const returnCheckedIfAll = () => {
    if (props.modelValue.includes("all")) {
        const authoritySns: string[] = collectAllAuthoritySns(authorityList.value);
        return authoritySns;
    } else {
        return props.modelValue;
    }
};

const collectAllAuthoritySns = (data: any) => {
    const result: any[] = [];

    const traverse = (items: any) => {
        items.forEach((item: any) => {
            // 添加当前菜单的 authoritySn
            if (item.authoritySn) {
                result.push(item.authoritySn);
            }

            // 添加子权限的 authSn
            if (item.childAuth?.length) {
                item.childAuth.forEach((auth: any) => {
                    if (auth.authSn) {
                        result.push(auth.authSn);
                    }
                });
            }

            // 递归处理子菜单
            if (item.children?.length) {
                traverse(item.children);
            }
        });
    };

    traverse(data);
    return result;
};

const recursion = (item: any): string[] => {
    let authoritySns: string[] = [item.authoritySn]; // 初始化authoritySns数组，包含当前节点的authoritySn
    if (item.children && item.children.length > 0) {
        item.children.forEach((authority: any) => {
            const childAuthSNs = authority.childAuth?.map((child: any) => child.authSn) || [];
            // 递归调用并合并结果
            authoritySns.push(...childAuthSNs, ...recursion(authority));
        });
    } else {
        const childAuthSNs = item.childAuth?.map((child: any) => child.authSn) || [];
        authoritySns.push(...childAuthSNs);
    }
    return authoritySns;
};

// ****************一级菜单****************
const handleCheckChildAll = (e: any, item: any) => {
    let resultArray = <any>[];
    resultArray = returnCheckedIfAll();
    const authoritySns: string[] = recursion(item);
    if (e === false) {
        resultArray = resultArray.filter((auth: any) => !authoritySns.includes(auth));
    } else {
        resultArray = Array.from(new Set([...resultArray, ...authoritySns]));
    }
    emit("update:modelValue", resultArray);
};
const isChildAllChecked = (item: any) => {
    if (props.modelValue.includes("all")) {
        return true;
    }
    const authoritySns: string[] = recursion(item);
    return authoritySns.every((element) => props.modelValue.includes(element));
};
const isChildIndeterminate = (item: any) => {
    const authoritySns: string[] = recursion(item);
    return !authoritySns.every((element) => props.modelValue.includes(element)) && authoritySns.some((element) => props.modelValue.includes(element));
};
//****************二级菜单********************
const handleCheckChildAll2 = (e: any, item: any, parentItem: any, grandParentItem?: any) => {
    let resultArray = <any>[];
    resultArray = returnCheckedIfAll();
    const authoritySns: string[] = recursion(item);
    // 合并结果
    if (e === false) {
        resultArray = resultArray.filter((auth: any) => !authoritySns.includes(auth));
        if (resultArray.length <= 2) {
            resultArray = resultArray.filter((auth: any) => !parentItem.authoritySn.includes(auth));
            if (grandParentItem) {
                resultArray = resultArray.filter((auth: any) => !grandParentItem.authoritySn.includes(auth));
            }
        }
    } else {
        resultArray = Array.from(new Set([...[parentItem.authoritySn], ...resultArray, ...authoritySns]));
        if (grandParentItem) {
            resultArray = Array.from(new Set([...[grandParentItem.authoritySn], ...resultArray]));
        }
    }
    emit("update:modelValue", resultArray);
};
const isChildAllChecked2 = (item: any) => {
    if (props.modelValue.includes("all")) {
        return true;
    }
    const authoritySns: string[] = recursion(item);
    return authoritySns.every((element) => props.modelValue.includes(element));
};
const isChildIndeterminate2 = (item: any) => {
    const authoritySns: string[] = recursion(item);
    return !authoritySns.every((element) => props.modelValue.includes(element)) && authoritySns.some((element) => props.modelValue.includes(element));
};
//****************三级菜单****************

const getParentIds = (item: any, authorityList: any[]): string[] => {
    const parentIds: string[] = [];
    const findParent = (childId: string, list: any[]) => {
        list.forEach((node: any) => {
            if (node.children) {
                node.children.forEach((child: any) => {
                    if (child.authorityId === childId) {
                        parentIds.push(node.authorityId);
                        findParent(node.authorityId, authorityList);
                    }
                });
            }
        });
    };
    findParent(item.authorityId, authorityList);
    return parentIds;
};
const isChildChecked = (item: any) => {
    if (props.modelValue.includes("all")) {
        return true;
    }
    if (props.modelValue.includes(item.authSn)) {
        return true;
    }
    return false;
};
const handleChildChecked = (e: any, item: any, parentItem: any, grandParentItem: any, greatGrandParentItem?: any) => {
    let resultArray = <any>[];
    resultArray = returnCheckedIfAll();
    if (e === false) {
        resultArray = resultArray.filter((element: any) => element !== item.authSn);
        // resultArray = resultArray.filter((element: any) => !parentItem.authoritySn.includes(element));
        // resultArray = resultArray.filter((element: any) => !grandParentItem.authoritySn.includes(element));
        // if (greatGrandParentItem) {
            // resultArray = resultArray.filter((element: any) => !greatGrandParentItem.authoritySn.includes(element));
        // }
    } else {
        resultArray = Array.from(new Set([...resultArray, ...[item.authSn], ...[parentItem.authoritySn], ...[grandParentItem.authoritySn]]));
        if (greatGrandParentItem) {
            console.log(resultArray);
            resultArray = Array.from(new Set([...resultArray, ...[greatGrandParentItem.authoritySn]]));
        }
    }
    console.log(resultArray);
    emit("update:modelValue", resultArray);
};

const emit = defineEmits(["update:modelValue"]);
const authorityList = ref<AuthorityFormState[]>([]);
const getAllAuthorityList = async () => {
    try {
        const result = await getAllAuthority({ type: 1, adminType: props.adminType });
        authorityList.value = result;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    getAllAuthorityList().then(() => {});
});
</script>

<style lang="less" scoped>
.right-body {
    display: flex;
    width: 100%;
    flex-direction: column;

    .title {
        height: 60px;
        background-color: #f5f6fa;
        display: flex;
        flex-direction: row;
        padding: 16px;
        box-sizing: border-box;
        font-weight: 500;
    }

    .left-div {
        min-width: 100px;
        font-weight: 500;
    }

    .info {
        padding: 16px;
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid #f0f0f0;
    }

    .right-div {
        width: 100%;
    }

    .child-box {
        background-color: #f5f7fa;
        flex-wrap: wrap;
        justify-content: flex-start;
        padding: 5px 10px;
        gap: 15px;
        .child2-div {
            width: calc(25%);
        }
    }
}
</style>
