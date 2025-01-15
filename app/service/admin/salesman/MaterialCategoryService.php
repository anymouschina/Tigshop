<?php

namespace app\service\admin\salesman;

use app\model\salesman\SalesmanMaterialCategory;
use app\service\common\BaseService;
use exceptions\ApiException;

/**
 * 服务类
 */
class MaterialCategoryService extends BaseService
{

    public function __construct(SalesmanMaterialCategory $salesmanMaterialCategory)
    {
        $this->model = $salesmanMaterialCategory;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query()->alias('c');
        // 处理筛选条件

        if (isset($filter['shop_id'])) {
            $query->where('c.shop_id', $filter['shop_id']);
        }
        if (!empty($filter['category_name'])) {
            $query->where('c.category_name', 'like', '%' . $filter['category_name'] . '%');
        }
        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @throws ApiException
     */
    public function getDetail(int $id)
    {
        $result = $this->model->where('category_id', $id)->find();
        return $result;
    }


    /**
     * 添加或更新
     *
     * @param int $id
     * @param array $data
     * @param bool $isAdd
     * @return int|bool
     * @throws ApiException
     */
    public function update(int $id, array $data, bool $isAdd = false): bool|int
    {
        if ($isAdd) {
            $result = $this->model->save($data);
            return $this->model->getKey();
        } else {
            $result = $this->model->where('category_id', $id)->save($data);
            return $result !== false;
        }
    }


    /**
     * 删除分类
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $result = $this->model::destroy($id);

        return $result !== false;
    }

}
