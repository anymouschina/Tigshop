<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="wrapper_title">
                <el-form ref="formRef" :model="form" label-width="auto">
                    <el-form-item label="选择修改：">
                        <el-checkbox-group v-model="form.type">
                            <el-checkbox v-for="item in checkList" :value="item" style="margin-bottom: 10px;">{{ item.lable }}</el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item label="商品信息：">
                        <div style="width: 100%;">
                            <div class="list-table-tool-row">
                                <div class="list-table-tool-col">
                                    <el-space>
                                        <DialogForm
                                            :params="{ selectedIds: ids, isMultiple: true }"
                                            isDrawer
                                            path="product/product/src/SelectProduct"
                                            title="选择商品"
                                            width="600px"
                                            @okCallback="loadList">
                                            <el-button type="primary">添加商品</el-button>
                                        </DialogForm>
                                    </el-space>
                                </div>
                                <div class="list-table-tool-col"></div>
                            </div>
                            <div class="wrapper_table">
                                <ProductBatch 
                                :types="form.type" 
                                :productStatusList="productStatusList" 
                                :selectList="selectList" 
                                @callback="batchData" 
                                :categoryList="categoryList"
                                :firstWordList="firstWordList" 
                                :brandList="brandList" 
                                :allBrandList="allBrandList"
                                :shippingTplList="shippingTplList"
                                ></ProductBatch>
                                <el-table :data="tableData" border style="width: 100%" loading>
                                    <el-table-column label="商品信息">
                                        <template #default="{row}">
                                            <div class="flex">
                                                <ProductCard
                                                    :picThumb="row.picThumb"
                                                    :productId="row.productId"
                                                    :productName="row.productName"
                                                    >
                                                </ProductCard>
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column v-for="item in form.type" width="180" align="center">
                                        <template #header>
                                            <div class="flex-column-center">
                                                <div>{{ item.lable }}</div>
                                            </div>
                                        </template>
                                        <template #default="{row}">
                                            <div v-if="item.type == 'status'">
                                                <el-select v-model="row[item.key]">
                                                    <el-option v-for="option in productStatusList" :label="option.label" :value="option.value" />
                                                </el-select>
                                            </div>
                                            <div v-if="item.type == 'shippingTpl'">
                                                <el-select v-model="row.shippingTplId">
                                                    <el-option v-for="option in shippingTplList" :label="option.shippingTplName" :value="option.shippingTplId" />
                                                </el-select>
                                            </div>
                                            <div v-if="item.type == 'select'">
                                                <el-select v-model="row[item.key]">
                                                    <el-option v-for="option in selectList" :label="option.label" :value="option.value" />
                                                </el-select>
                                            </div>
                                            <div v-if="item.type == 'input'">
                                                <el-form-item>
                                                    <TigInput v-model="row[item.key]" :placeholder="item.lable" />
                                                </el-form-item>
                                            </div>
                                            <div v-if="item.key == 'categoryId'">
                                                <el-form-item>
                                                    <SelectCategory v-model:categoryId="row.categoryId" :categoryList="categoryList"></SelectCategory>
                                                </el-form-item>
                                            </div>
                                            <div v-if="item.key == 'brandId'">
                                                <el-form-item>
                                                    <SelectBrand v-model:brandId="row.brandId" :firstWordList="firstWordList" :brandList="brandList" :allBrandList="allBrandList"></SelectBrand>
                                                </el-form-item>
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column fixed="right" label="操作" width="90" align="center">
                                        <template #default="{ row }">
                                            <el-button link type="primary" size="small" @click="del(row.productId)"> 删除 </el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <div class="extra">一次最多添加100个商品</div>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label=" ">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交
                        </el-button>
                        <el-button ref="submitBtn" class="form-submit-btn" @click="onReset()">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { DialogForm } from "@/components/dialog";
import { onMounted, reactive, ref, shallowRef } from "vue";
import ProductBatch from "./src/ProductBatch.vue";
import { SelectBrand, SelectCategory } from "@/components/select";
import { getProductList, getShippingTplList, BatchProduct } from "@/api/product/product";
import { useConfigStore } from "@/store/config";
import { Pagination } from "@/components/list";
import { message } from "ant-design-vue";
import {ProductCard} from '@/components/list';
import { getAllCategoryList } from "@/api/product/category";
import { CategoryFilterState } from "@/types/product/category";
import { getBrandSearch } from "@/api/product/brand";
import { BrandFilterState } from "@/types/product/brand";
import { ProductFilterParams, ProductFilterState } from "@/types/product/product";
const formRef = shallowRef();
const config = useConfigStore();
const filterParams = reactive<ProductFilterParams>({
    page: 1,
    size: 100,
    sortField: "",
    sortOrder: "",
    keyword: "",
});
interface CheckList {
    lable: string;
    key: string;
    type: string;
}
const form = ref({
    type: [] as CheckList[]
});
const checkList = ref<CheckList[]>([
    {
        lable: "商品上下架状态",
        key: "productStatus",
        type: "status"
    },
    {
        lable: "商品名称",
        key: "productName",
        type: "input"
    },
    {
        lable: "商品分类",
        key: "categoryId",
        type: "category"
    },
    {
        lable: "商品品牌",
        key: "brandId",
        type: "brand"
    },
    {
        lable: "商品货号",
        key: "productSn",
        type: "input"
    },
    {
        lable: "条形编码",
        key: "productTsn",
        type: "input"
    },
    {
        lable: "商品售价",
        key: "productPrice",
        type: "input"
    },
    {
        lable: "市场价",
        key: "marketPrice",
        type: "input"
    },
    {
        lable: "运费模板",
        key: "shippingTplId",
        type: "shippingTpl"
    },
    {
        lable: "是否包邮",
        key: "freeShipping",
        type: "select"
    },
    {
        lable: "是否新品",
        key: "isNew",
        type: "select"
    },
    {
        lable: "是否精品",
        key: "isBest",
        type: "select"
    },
    {
        lable: "是否热销",
        key: "isHot",
        type: "select"
    },
    {
        lable: "排序",
        key: "sortOrder",
        type: "input"
    }
]);
const productStatusList = ref([
    {
        label: "上架",
        value: 1
    },
    {
        label: "下架",
        value: 0
    }
])
const selectList = ref([
    {
        label: "是",
        value: 1
    },
    {
        label: "否",
        value: 0
    }
])
const tableData = ref<ProductFilterState[]>([]);
const total = ref(0);
const loading = ref<boolean>(true);
const ids = ref<number[]>([])
const loadList = async (data:any) => {
    try {
        if(data){
            ids.value.push(...data)
        }
        const result = await getProductList({ ids: ids.value.join(','), ...filterParams });
        result.records.map(item => {
            if(item.shippingTplId == 0){
                item.shippingTplId = ''
            }
        })
        tableData.value = result.records;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const batchData = (data: any) => {
    tableData.value.map(item => {
        Object.assign(
          item,
          data
        )
    })
};
const del = (id:number) => {
    tableData.value = tableData.value.filter((product:any) => product.productId !== id);
    let idArr:any[] = []
    tableData.value.map((item:any) => {
        idArr.push(item.productId)
    })
    ids.value = idArr
};
const shippingTplList = ref<any[]>([]);
const categoryList = ref<CategoryFilterState[]>([]);
//首字母列表
const firstWordList = ref<string[]>([]);
// 实际数据
const brandList = ref<BrandFilterState[]>([]);
// 全部品牌
const allBrandList = ref<BrandFilterState[]>([]);
const loadFilter = async () => {
    try {
        const shippingTpl = await getShippingTplList();
        shippingTplList.value = shippingTpl.shippingTplList;
        const category = await getAllCategoryList();
        categoryList.value = category;
        const brand = await getBrandSearch();
        firstWordList.value = brand.firstwordList;
        brandList.value = brand.brandList;
        allBrandList.value = brand.brandList;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    loadFilter();
});

// 表单通过验证后提交
const onSubmit = async () => {
    if(tableData.value.length < 1){
        message.error('未选择商品');
        return
    }
    if(form.value.type.length < 1){
        message.error('未选择修改项');
        return
    }
    let data = filterProducts()
    if (validateProducts(data)) {
        try {
            const result = await BatchProduct({editItems:data});
            message.success('操作成功');
            onReset();
        } catch (error: any) {
            message.error(error.message);
        }
    }
    
};
const onReset = () => {
    tableData.value = [];
    form.value.type = [];
    ids.value = [];
}
// 提交前的验证函数
const validateProducts = (data:any) => {
  for (let product of data) {
    if (product.productName == "" || product.productSn == "") {
      message.error(`商品名称或商品货号不能为空`);
      return false; // 验证失败，直接返回
    }
  }
  return true; // 验证通过
};
const filterProducts = () => {
    // 提取校验列表中所有的key
    const additionalKeys = ['productId'];
    const keysFromValidation = form.value.type.map(item => item.key);
    const keysToKeep = [...keysFromValidation, ...additionalKeys];
    // 处理商品列表，仅保留校验列表中的key对应的值
    let list = tableData.value.map((product: any) => {
        const filteredProduct:any = {};
        keysToKeep.forEach((key:any) => {
            if (product[key] !== undefined) {
                filteredProduct[key] = product[key]
            }
        });
        return filteredProduct;
    });
    return list
};

</script>
<style lang="less" scoped>
.list-table-tool-row {
    margin-bottom: 20px;
}
.flex-column-center {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
