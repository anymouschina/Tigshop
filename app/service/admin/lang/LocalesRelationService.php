<?php

namespace app\service\admin\lang;

use app\model\common\Locales;
use app\model\common\LocalesRelation;
use app\service\common\BaseService;
use exceptions\ApiException;

/**
 * 服务类
 */
class LocalesRelationService extends BaseService
{

    public function __construct(LocalesRelation $localesRelation)
    {
        $this->model = $localesRelation;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query();
        // 处理筛选条件

        if (!empty($filter['name'])) {
            $query->where('name', 'like', '%' . $filter['name'] . '%');
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
        $result = $this->model->where('id', $id)->find();
        return $result;
    }

    /**
     * 获得默认语言
     * @param string $code
     * @return Locales
     */
    public function getDefaultLocale(string $code): Locales|null
    {
        $relation = $this->model->where('code', $code)->find();
        if ($relation) {
            $locale = Locales::where('id', $relation['locales_id'])->find();
        } else {
            $locale = Locales::where('is_default', 1)->find();
        }
        return $locale;
    }


    /**
     * 添加或更新
     *
     * @param int $id
     * @param array $data
     * @param bool $isAdd
     * @return int|bool
     */
    public function update(int $id, array $data, bool $isAdd = false): bool|int
    {
        if ($isAdd) {
            $result = $this->model->save($data);
            return $this->model->getKey();
        } else {
            $result = $this->model->where('id', $id)->save($data);
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


    /**
     * 批量操作
     * @param int $id
     * @param string $type
     * @return bool
     * @throws ApiException
     */
    public function batchOperation(int $id, string $type): bool
    {
        if (!$id || empty($type)) {
            throw new ApiException(/** LANG */ '#参数错误');
        }
        $localesRelation = $this->getDetail($id);
        switch ($type) {
            case 'del':
                $result = $localesRelation->delete();
                break;
        }
        return $result !== false;
    }

}
