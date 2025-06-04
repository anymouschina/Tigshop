<?php

namespace app\job\order;

use app\job\BaseJob;
use app\service\admin\order\OrderService;
use think\Log;

class OrderConfirmReceiptJob extends BaseJob
{
    /**
     * 自动收货
     */
    public function doJob(array $data)
    {
        //只处理已发货的
        $order = app(OrderService::class)->getOrder($data['order_id']);

        if($order->order_status == 2) {
            app(OrderService::class)->confirmReceipt($data['order_id']);
        }
        return true;
    }
}