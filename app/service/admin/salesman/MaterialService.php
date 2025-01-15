<?php

namespace app\service\admin\salesman;

use app\model\salesman\SalesmanMaterial;
use app\model\salesman\SalesmanMaterialCategory;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Util;

class MaterialService extends BaseService
{
    public function __construct(SalesmanMaterial $salesmanMaterial)
    {
        $this->model = $salesmanMaterial;
    }

    /**
     * 筛选查询
     * @param array $filter
     * @return object|\think\db\BaseQuery
     */
    public function filterQuery(array $filter): object
    {
        $query = $this->model->query();

        if (isset($filter['keyword']) && !empty($filter['keyword'])) {
            $query->whereLike('content', '%' . $filter['keyword'] . '%');
        }
        if (!empty($filter['category_id'])) {
            $query->where('category_id', $filter['category_id']);
        }

        if (!empty($filter['from']) && $filter['from'] == 'user') {
            $query->where('is_available', 1);
            $query->order('is_top', 'desc');
        }
        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }


    /**
     * 素材分类
     * @return mixed
     */
    public function getAllCategory()
    {
        return SalesmanMaterialCategory::order('sort_order', 'desc')->select();
    }

    /**
     * 添加
     * @param array $data
     * @return int
     */
    public function create(array $data): int
    {
        $content = $this->model->save($data);
        return $this->model->getKey();
    }

    /**
     * 更新
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        return $this->model->find($id)->save($data);
    }

    /**
     * 获取详情
     * @param int $id
     * @return SalesmanMaterial
     * @throws ApiException
     */
    public function getDetail(int $id, bool $userShare = false): SalesmanMaterial
    {
        $content = $this->model->find($id);
        if (empty($content)) {
            throw new ApiException(/** LANG */ Util::lang('内容不存在'));
        }
        if ($userShare) {
            $content->share_num = $content->share_num + 1;
            $content->save();
        }
        return $content;
    }

    /**
     * 删除
     * @param int $id
     * @return bool
     */
    public function del(int $id): bool
    {
        $content = $this->model->find($id);
        if (empty($content)) {
            throw new ApiException(/** LANG */ '#id错误');
        }

        return $content->delete();
    }

    /**
     * 更新字段
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function updateField(int $id, array $data): bool
    {
        $content = $this->model->find($id);
        if (empty($content)) {
            throw new ApiException(/** LANG */ '#id错误');
        }
        $result = $content->save($data);
        return $result;
    }
}
