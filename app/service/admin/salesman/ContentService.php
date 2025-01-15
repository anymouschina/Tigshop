<?php

namespace app\service\admin\salesman;

use app\model\salesman\SalesmanContent;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Time;
use utils\Util;

class ContentService extends BaseService
{
    public function __construct(SalesmanContent $salesmanContent)
    {
        $this->model = $salesmanContent;
    }

    /**
     * 筛选查询
     * @param array $filter
     * @return object|\think\db\BaseQuery
     */
    public function filterQuery(array $filter): object
    {
        $query = $this->model->query();

        if (isset($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }

        if (isset($filter['start_time'], $filter['end_time'])) {
            if (!empty($filter['start_time']) && !empty($filter['end_time'])) {
                $start = Time::toTime($filter['start_time']);
                $end = Time::toTime($filter['end_time']);
                $query->whereBetween('start_time', [$start, $end]);
            } elseif (!empty($filter['start_time'])) {
                $start = Time::toTime($filter['start_time']);
                $query->where('start_time', '>=', $start);
            } elseif (!empty($filter['end_time'])) {
                $end = Time::toTime($filter['end_time']);
                $query->where('end_time', '<=', $end);
            }
        }


        if (isset($filter['title']) && !empty($filter['title'])) {
            $query->whereLike('title', '%' . $filter['title'] . '%');
        }

        if (isset($filter['status']) && $filter['status'] != -1) {
            $query->status($filter['status']);
        }
        if (!empty($filter['from']) && $filter['from'] == 'user') {
            $query->where('start_time', '<=', time())->where(function ($query) {
                $query->where('end_time', '>=', time())->whereOr('end_time', 0);
            })->where('is_available', 1);
            $query->order('is_top', 'desc');
        }
        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
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
     * @return SalesmanContent
     * @throws ApiException
     */
    public function getDetail(int $id): SalesmanContent
    {
        $content = $this->model->find($id);
        if (empty($content)) {
            throw new ApiException(/** LANG */ Util::lang('内容不存在'));
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
        $content = SalesmanContent::find($id);
        if (empty($content)) {
            throw new ApiException(/** LANG */ '#id错误');
        }
        if ($content->is_available) {
            throw new ApiException(/** LANG */"标题为:【{$content->title}】请先置为失效,再删除");
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
        $content = SalesmanContent::find($id);
        if (empty($content)) {
            throw new ApiException(/** LANG */ '#id错误');
        }
        $result = $content->save($data);
        return $result;
    }
}
