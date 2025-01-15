<?php

namespace app\service\admin\lang;

use app\model\common\Locales;
use app\model\common\LocalesRelation;
use app\service\common\BaseService;
use exceptions\ApiException;

class LocalesService extends BaseService
{
    /**
     * 筛选查询
     * @param array $filter
     * @return object|\think\db\BaseQuery
     */
    public function filterQuery(array $filter): object
    {
        $query = Locales::query();

        if (isset($filter['language']) && !empty($filter['language'])) {
            $query->whereLike('language','%' . $filter['language'] . '%');
        }

        if (isset($filter['currency_id']) && !empty($filter['currency_id'])) {
            $query->where('currency_id',$filter['currency_id']);
        }

        if (isset($filter['is_enabled']) && $filter['is_enabled'] != -1) {
            $query->where('is_enabled',$filter['is_enabled']);
        }
        return $query;
    }

    /**
     * 根据浏览器识别对应的语言
     * @return void
     */
    public function getListByCode(string $code)
    {
        $relation = LocalesRelation::where('code', $code)->find();
        if (empty($relation)) {

        }
    }

    /**
     * 创建
     * @param array $data
     * @return int
     */
    public function createLocales(array $data): int
    {
        if (isset($data['is_default']) && $data['is_default']) {
            if (Locales::where('is_default',1)->count()) {
                Locales::where('is_default',1)->save(['is_default' => 0]);
            }
        }
        $locales = Locales::create($data);
        return $locales->getKey();
    }

    /**
     * 更新
     * @param int $id
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function updateLocales(int $id, array $data): bool
    {
        $locales = $this->getDetail($id);
        if (isset($data['is_default']) && $data['is_default']) {
            if (Locales::where('is_default',1)->count()) {
                Locales::where('is_default',1)->save(['is_default' => 0]);
            }
        }
        return $locales->save($data);
    }

    /**
     * 详情
     * @param int $id
     * @return Locales
     * @throws ApiException
     */
    public function getDetail(int $id): Locales
    {
        $locales = Locales::find($id);
        if (empty($locales)) {
            throw new ApiException(/** LANG */'语言不存在');
        }
        return $locales;
    }

    /**
     * 删除
     * @param int $id
     * @return bool
     * @throws ApiException
     */
    public function deleteLocales(int $id): bool
    {
        $locales = Locales::find($id);
        if (empty($locales)) {
            throw new ApiException(/** LANG */'#id错误');
        }
        return $locales->delete();
    }

    /**
     * 更新字段
     * @param int $id
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function updateLocalesField(int $id, array $data): bool
    {
        $locales = $this->getDetail($id);
        if (in_array('is_default',array_keys($data))) {
            if ($data['is_default']) {
                if (Locales::where('is_default',1)->count()) {
                    Locales::where('is_default',1)->save(['is_default' => 0]);
                }
            }
        }
        return $locales->save($data);
    }

    /**
     * 批量操作
     * @param int $id
     * @param string $type
     * @return bool
     * @throws ApiException
     */
    public function batchOperation(int $id,string $type): bool
    {
        if (!$id || empty($type)) {
            throw new ApiException(/** LANG */'#参数错误');
        }
        $locales = $this->getDetail($id);
        switch ($type) {
            case 'del':
                $result = $locales->delete();
                break;
            case 'enabled':
                $result = $locales->save(['is_enabled' => 1]);
                break;
            case 'cancel_enabled':
                $result = $locales->save(['is_enabled' => 0]);
                break;
        }
        return $result !== false;
    }
}
