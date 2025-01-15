<?php

namespace app\job;

use app\service\admin\salesman\OrderService;

class SalesmanOrderJob extends BaseJob
{
    /**
     * 结算销售员订单
     * @param $data ['salesman_order_id']
     * @return bool
     */
    public function doJob($data): bool
    {
        try {
            app(OrderService::class)->autoSettlement($data);
            return true;
        } catch (\Exception $exception) {
            return false;
        }
    }
}