<?php

namespace app\service\admin\salesman;

use app\model\salesman\SalesmanCustomer;
use app\service\common\BaseService;

/**
 * 服务类
 */
class CustomerService extends BaseService
{

    public function __construct(SalesmanCustomer $salesmanCustomer)
    {
        $this->model = $salesmanCustomer;
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

        if (!empty($filter['add_time_start'])) {
            $query->where('add_time', '>=', $filter['add_time_start']);
        }
        if (!empty($filter['add_time_end'])) {
            $query->where('add_time', '<=', $filter['add_time_end']);
        }
        if (!empty($filter['salesman_id'])) {
            $query->where('salesman_id', $filter['salesman_id']);
        }
        return $query;
    }


}
