<template>
    <div class="gallery_warp" id="gallery_warp">
        <div class="lyecs_gallery_box">
            <div class="gallery-folder-warp">
                <div class="gallery-folder-list">
                    <div :class="'gallery-folder-item ' + (galleryStore.topGalleryId == 0 ? 'current' : '')" v-if="gallery" @click="folderChange(0)">
                        <div class="folder-item-con">
                            <i class="item-ico"></i>
                            <div class="item-name">全部</div>
                        </div>
                    </div>
                    <!-- <div :class="'gallery-folder-item ' + (galleryStore.topGalleryId == -1 ? 'current' : '')" v-if="gallery" @click="folderChange(-1)">
                        <div class="folder-item-con">
                            <i class="item-ico"></i>
                            <div class="item-name">我的服务</div>
                        </div>
                    </div> -->
                    <div :class="'gallery-folder-item ' + (galleryStore.topGalleryId == item.galleryId ? 'current' : '')" v-for="(item, key) in gallery">
                        <div :class="'folder-item-con'" @click="folderChange(item.galleryId)">
                            <i class="item-ico"></i>
                            <div class="item-name">{{ item.galleryName }}</div>
                        </div>
                        <div class="folder-item-edit">
                            <el-dropdown trigger="click">
                                <i title="编辑" class="ico-font">&#xe669;</i>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <DialogForm
                                            width="600px"
                                            @okCallback="editRecordCallback(item.galleryId, true)"
                                            title="编辑相册"
                                            path="gallery/GalleryEdit"
                                            :params="{ act: 'detail', id: item.galleryId }"
                                        >
                                            <el-dropdown-item>
                                                <div>编辑相册</div>
                                            </el-dropdown-item>
                                        </DialogForm>
                                        <el-dropdown-item @click="delRootGallery(item.galleryId, key)">
                                            <div>删除</div>
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </div>
                </div>
                <div class="add-gallery-folder-con">
                    <DialogForm
                        width="600px"
                        @okCallback="addGalleryCallback(0)"
                        title="添加相册"
                        path="gallery/GalleryEdit"
                        :params="{ act: 'add', parentId: 0 }"
                    >
                        <el-button class="add-gallery-folder-btn"><em>+</em> 添加相册</el-button>
                    </DialogForm>
                </div>
            </div>
            <div class="gallery-pics-warp">
                <div class="gallery-main" id="gallery-main">
                    <div class="gallery-pic-action">
                        <div class="gallery-pic-action-l">
                            <el-space>
                                <Upload
                                    name="file"
                                    :action="requestUrl.prefix + '/setting/galleryPic/uploadImg?galleryId=' + galleryStore.galleryId"
                                    :headers="requestUrl.headers()"
                                    @change="handleChange"
                                    :showUploadList="false"
                                    :before-upload="beforeUpload"
                                    :multiple="true"
                                >
                                    <el-button type="primary">上传图片</el-button>
                                </Upload>
                                <el-button
                                    v-if="galleryInfo && galleryInfo.parentId > 0"
                                    class="lyecs-btn return-gallery-btn"
                                    @click="galleryChange(galleryInfo.parentId)"
                                    >返回上一级</el-button
                                >
                                <DialogForm
                                    v-if="galleryInfo && galleryStore.galleryId > 0"
                                    width="600px"
                                    @okCallback="addGalleryCallback(galleryInfo.galleryId)"
                                    title="添加子相册"
                                    path="gallery/GalleryEdit"
                                    :params="{ act: 'add', parentId: galleryInfo.galleryId }"
                                >
                                    <el-button class="lyecs-btn add-gallery-btn">添加子相册</el-button>
                                </DialogForm>
                            </el-space>
                        </div>
                        <div class="gallery-pic-action-r">
                            <span style="word-break: keep-all">排序：</span>
                            <el-select @change="changeSort" class="a-select-ui gallery_pic_sort" v-model="galleryStore.sortOrder">
                                <el-option label="时间从先到后" value="asc" />
                                <el-option label="时间从后到先" value="desc" />
                            </el-select>
                        </div>
                    </div>
                    <a-spin :spinning="loading">
                        <div class="gallery-list gallery-list" :suppressScrollX="false">
                            <ul v-if="childGalleryList.length > 0 && galleryStore.galleryId > 0">
                                <template v-for="(gallery, key) in childGalleryList">
                                    <li class="gallery-item">
                                        <div class="img" @click="galleryChange(gallery.galleryId)">
                                            <a v-if="gallery.galleryPics.length == 0"><span class="img-empty">相册为空</span></a>
                                            <template v-for="(galleryPic, k) in gallery.galleryPics">
                                                <img class="gallery_pics" :src="imageFormat(galleryPic.picThumb)" />
                                            </template>
                                        </div>
                                        <p class="pic-actions">
                                            <DialogForm
                                                width="600px"
                                                @okCallback="editRecordCallback(gallery.galleryId, false)"
                                                title="编辑相册"
                                                path="gallery/GalleryEdit"
                                                :params="{ act: 'detail', id: gallery.galleryId, parentId: gallery.parentId }"
                                            >
                                                <a class="btn-edit ico-font">&#xe610;</a>
                                            </DialogForm>
                                            <a-popconfirm title="您确认要删掉该相册吗？" @confirm="delGallery(gallery.galleryId, key)" placement="bottom">
                                                <a class="btn-del ico-font" title="删除">&#xe60a;</a>
                                            </a-popconfirm>
                                        </p>
                                        <div class="desc">
                                            <input
                                                class="galleryName"
                                                v-model="gallery.galleryName"
                                                @change="changGalleryName($event, gallery.galleryId)"
                                                type="text"
                                            />
                                        </div>
                                    </li>
                                </template>
                            </ul>
                            <ul class="gallery-list-ul" v-if="picList.length > 0">
                                <template v-for="(galleryPic, key) in picList">
                                    <li :class="'gallery-pic-item ' + (selectedPics.some((selected:any) => selected.picId === galleryPic.picId) ? 'selected' : '')">
                                        <div v-if="galleryPic.picThumb">
                                            <div class="img" @click="selectPic(galleryPic, key)">
                                                <el-image fit="cover" :src="imageFormat(galleryPic.picThumb)" style="width: 100%; height: 100%" />
                                            </div>
                                            <p class="pic-actions">
                                                <a-popconfirm title="您确认要删掉该图片吗？" @confirm="delPic(galleryPic.picId)" placement="bottom">
                                                    <a class="btn-del ico-font" title="删除">&#xe60a;</a>
                                                </a-popconfirm>
                                            </p>
                                            <div class="desc">
                                                <input
                                                    class="pic_name"
                                                    autocomplete="off"
                                                    placeholder="图片名称"
                                                    v-model="galleryPic.picName"
                                                    @change="changPicName($event, galleryPic.picId)"
                                                    type="text"
                                                />
                                            </div>
                                            <div class="img-selected-box">
                                                <div class="img-selected-box-angle"></div>
                                                <div class="img-selected-box-sort ico-font">&#xe63b;</div>
                                            </div>
                                        </div>
                                        <div v-if="!galleryPic.picThumb" class="gallery-upload-con">
                                            <span class="txt">{{
                                                galleryPic.status == "error" ? "上传失败" : galleryPic.status == "done" ? "上传成功" : "图片上传中"
                                            }}</span>
                                            <Progress :percent="galleryPic.percent" :status="galleryPic.status == 'error' ? 'exception' : 'normal'" />
                                        </div>
                                    </li>
                                </template>
                            </ul>
                            <div class="empty-warp" v-if="picList.length == 0 && childGalleryList.length == 0">
                                <div v-if="!loading" class="empty-bg">暂无数据</div>
                            </div>
                        </div>
                        <div class="gallery-list-page">
                            <Pagination
                                v-model:page="galleryStore.page"
                                v-model:size="size"
                                :total="picTotal"
                                @callback="pageChange"
                                layout="slot ,prev, pager, next"
                                :background="false"
                            />
                        </div>
                    </a-spin>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, toRefs, computed, onMounted } from "vue";
import { requestUrl } from "@/utils/request";
import { DialogForm } from "@/components/dialog";
import { message, Progress, Upload, Modal } from "ant-design-vue";
import type { UploadChangeParam } from "ant-design-vue";
import { imageFormat } from "@/utils/format";
import { Pagination } from "@/components/list";
import { useGalleryStore } from "@/store/gallery";
import { getGalleryList, getGalleryPicList, updateGalleryField, updateGalleryPicField, delGalleryPicField, delGalleryField } from "@/api/setting/gallery";
import type { GalleryFormState } from "@/types/setting/gallery.d";
const props = defineProps({
    isMultiple: {
        type: Boolean,
        default: false
    }
});
const galleryStore = useGalleryStore();
// 顶级相册ID
const topGalleryId = ref(0);
// 当前相册ID
const galleryId = ref(0);
// 相册目录
const gallery = ref<GalleryFormState[]>([]);
// 当前相册图片列表
const galleryPicList = ref([]);
// 新添加的图片
const uploadPicList = ref<any[]>([]);
// 图片数组
// 当前相册图片数量
const picTotal = ref();
// 当前相册信息
const galleryInfo = ref<any>({});
// 子相册
const childGalleryList = ref<any>([]);
// 是否多选
const { isMultiple } = toRefs(props);
// 已选项-ID
const selectedIds = ref([]);
// 已选项-图片
const selectedPics = ref<any>([]);
// 其它
const size = ref(15);
const loading = ref(true);

const picList = computed<any>(() => {
    return uploadPicList.value.concat(galleryPicList.value);
});

const beforeUpload = (file: FileItem) => {
    const isLtSize = file.size / 1024 / 1024 < 10;
    if (!isLtSize) {
        message.error("只能上传10M以内的图片");
    }
    return isLtSize;
};
const handleChange = (info: UploadChangeParam) => {
    if (info.file.status == "uploading") {
    }
    if (info.file.status !== "uploading") {
    }
    if (info.file.status === "done") {
        // 上传完成
        if (info.file.response.code !== 0) {
            info.file.status = "error";
            message.error(info.file.response.message);
        } else {
            loadGallery(galleryStore.galleryId);
            message.success("图片上传成功！");
        }
    } else if (info.file.status === "error") {
        message.error(`${info.file.name} 图片上传失败！`);
    }
};

// 加载目录和全部相册
const loadGallery = async (galleryId: number) => {
    try {
        const result = await getGalleryList({ galleryId: galleryId });
        Object.assign(gallery.value, result.records);
        galleryChange(galleryId, galleryStore.page);
        loadTopGallery();
    } catch (error: any) {
        message.error(error.message);
    }
};
onMounted(() => {
    loadTopGallery();
});
const loadTopGallery = async () => {
    try {
        const result = await getGalleryList({ galleryId: 0 });
        gallery.value = result.records;
        galleryChange(galleryStore.galleryId, galleryStore.page);
    } catch (error: any) {
        message.error(error.message);
    }
};
const folderChange = (galleryId: number) => {
    galleryChange(galleryId);
    galleryStore.page = 1;
    galleryStore.topGalleryId = galleryId;
};
const pageChange = (curPage: number) => {
    // galleryStore.page = curPage;
    galleryChange(galleryStore.galleryId, curPage);
};
// 加载相册，仅改变图片选择区域
const galleryChange = async (galleryId: number, pageId: number = 1) => {
    loading.value = true;
    galleryStore.page = pageId;
    try {
        const result = await getGalleryPicList({ galleryId, page: pageId, sortOrder: galleryStore.sortOrder });
        uploadPicList.value = [];
        galleryPicList.value = result.galleryPicPage.records;
        childGalleryList.value = result.childGalleryList;
        picTotal.value = result.galleryPicPage.total;
        galleryStore.galleryId = galleryId;
        galleryInfo.value = result.galleryInfo;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

const changeSort = (value: any) => {
    galleryStore.sortOrder = value;
    galleryChange(galleryStore.galleryId);
};
//  编辑相册
const editRecordCallback = (id: number, isMain: Boolean) => {
    if (isMain == true) {
        loadGallery(galleryStore.galleryId);
    } else {
        galleryChange(galleryStore.galleryId);
    }
};
// 添加相册
const addGalleryCallback = (parentId: number) => {
    if (parentId == 0) {
        loadGallery(galleryStore.galleryId);
    } else {
        galleryChange(galleryStore.galleryId);
    }
};
// 修改相册名称
const changGalleryName = async (event: any, galleryId: number) => {
    try {
        const result = await updateGalleryField({ id: galleryId, val: event.target.value, field: "galleryName" });
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    }
};
// 修改图片名称
const changPicName = async (event: any, picId: number) => {
    try {
        const result = await updateGalleryPicField({ id: picId, val: event.target.value, field: "picName" });
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    }
};
// 删除图片
const delPic = async (picId: number) => {
    try {
        const result = await delGalleryPicField({ id: picId });
        message.success("操作成功");
        // galleryStore.topGalleryId = 0;
        // galleryStore.galleryId = 0;
        loadGallery(galleryStore.galleryId);
    } catch (error: any) {
        message.error(error.message);
    }
};

// 删除相册
const delGallery = async (galleryId: number, key: number) => {
    try {
        const result = await delGalleryField({ id: galleryId });
        message.success("操作成功");
        childGalleryList.value.splice(<any>key, 1);
        if (galleryStore.galleryId == galleryId) {
            galleryStore.topGalleryId = 0;
            galleryStore.galleryId = 0;
        }
        loadGallery(galleryStore.galleryId);
    } catch (error: any) {
        message.error(error.message);
    }
};

// 删除根相册
const delRootGallery = (galleryId: number, key: number) => {
    Modal.confirm({
        title: "您确认要删除所选相册吗？",
        okType: "danger",
        onOk() {
            delGallery(galleryId, key);
            loadTopGallery();
        }
    });
};
// 父组件回调
const emit = defineEmits(["submitCallback", "okType"]);
emit("okType", false);
// 选择图片
const selectPic = (pic: any, key: number) => {
    let selected = false; //当前图片在不在选择里
    if (selectedPics.value.length > 0) {
        for (let idx in selectedPics.value) {
            if (selectedPics.value[idx]["picId"] == pic.picId) {
                picList.value[key]["selected"] = false;
                selectedPics.value.splice(<any>idx, 1);
                selected = true;
            }
        }
    }
    // 如果是新钩选
    if (selected == false) {
        // 如果是单选，清除所有选项项
        if (isMultiple.value == false) {
            selectedPics.value = [];
            for (let idx in picList.value) {
                picList.value[idx]["selected"] = false;
            }
        }
        picList.value[key]["selected"] = true;
        selectedPics.value.push({
            picId: pic.picId,
            picThumb: pic.picThumb,
            picUrl: pic.picUrl,
            picName: pic.picName
        });
    }
    // 确认按钮状态，false为disabled
    emit("okType", selectedPics.value.length > 0 ? true : false);
};
// 弹窗回调
const onFormSubmit = () => {
    // 弹窗确认按钮提交
    emit("submitCallback", selectedPics.value);
};

defineExpose({
    onFormSubmit
});
</script>
<style lang="less" scoped>
@import "./gallery.less";
</style>
