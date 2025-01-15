<?php

namespace app\service\admin\pay;

use app\model\payment\PayLog;
use app\model\payment\PayLogRefund;
use app\service\admin\finance\RefundApplyService;
use app\service\admin\finance\UserRechargeOrderService;
use app\service\admin\order\OrderDetailService;
use app\service\admin\order\OrderService;
use app\service\admin\product\ECardService;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Config;
use utils\Time;
use utils\Util;

class PaymentService extends BaseService
{
    protected string|null $payType = null;

    /**
     * 获取支付配置
     * @return array
     */
    public function getConfig(): array
    {
        return Config::getConfig('payment');
    }

    /**
     * 获取平台类型
     * @return string
     */
    public function getPayType(): string
    {
        if ($this->payType === null) {
            return Util::getClientType();
        } else {
            return $this->payType;
        }
    }

    /**
     * 获取支付配置
     * @return array
     */
    public function getAvailablePayment(string $type = 'order'): array
    {
        $payment = [];
        $config = $this->getConfig();
        $platFrom = $this->getPayType();

        if (!empty($config['use_wechat']) && $config['use_wechat'] == 1) {
            $payment[] = 'wechat';
        }
        if (!empty($config['use_alipay']) && $config['use_alipay'] == 1) {
            if ($platFrom != 'miniProgram' && $platFrom != 'wechat') $payment[] = 'alipay';
        }
        if (!empty($config['use_paypal']) && $config['use_paypal'] == 1) {
            $payment[] = 'paypal';
        }
        if (!empty($config['use_yabanpay']) && $config['use_yabanpay'] == 1) {
            //检测是否开启微信/支付宝支付
            if ($config['use_yabanpay_wechat']) $payment[] = 'yabanpay_wechat';
            if ($config['use_yabanpay_alipay'] && $platFrom != 'miniProgram' && $platFrom != 'wechat') $payment[] = 'yabanpay_alipay';
        }
        if (!empty($config['use_yunpay']) && $config['use_yunpay'] == 1) {
            $payment[] = 'yunpay_wechat';
            if ($platFrom != 'miniProgram' && $platFrom != 'wechat') $payment[] = 'yunpay_alipay';
//            $payment[] = 'yunpay_yunshanfu';
        }
        if (!empty($config['use_offline']) && $config['use_offline'] == 1 && $type == 'order') {
            $payment[] = 'offline';
        }
        return $payment;
    }

    /**
     * 支付回调成功后处理
     * @param string $pay_sn
     * @param string $transaction_id
     * @return void
     * @throws ApiException
     */
    public function paySuccess(string $pay_sn, string $transaction_id = ''): void
    {
        $pay_log = app(PayLogService::class)->getPayLogByPaySn($pay_sn);
        if (!$pay_log || $pay_log['pay_status'] == 1) {
            return;
        }
        if (empty($pay_log['order_id'])) return;
        try {
            //修改支付状态
            app(PayLog::class)->where('paylog_id', $pay_log['paylog_id'])->save(['pay_status' => 1, 'transaction_id' => $transaction_id]);
            switch ($pay_log['order_type']) {
                case 0:
                    //更新订单中的支付单号
                    $order = app(OrderService::class)->getOrder($pay_log['order_id']);
                    $order->out_trade_no = $pay_sn;
                    $order->save();
                    app(OrderDetailService::class)->setOrderId($pay_log['order_id'])->setPaidMoney($pay_log['pay_amount'])->updateOrderMoney();
                    app(OrderService::class)->setOrderPaid($pay_log['order_id']);
                    //app(MessageCenterService::class)->sendUserMessage($order->user_id, $order->order_id, 2);

                    // 卡券分配
                    app(ECardService::class)->getCardByOrder($pay_log['order_id']);
                    break;
                case 1:
                    //充值
                    app(UserRechargeOrderService::class)->setRechargePaid($pay_log['order_id']);
                    break;
                default:
                    break;
            }
        } catch (\Exception $exception) {
            throw new ApiException($exception->getMessage());
        }
    }

    /**
     * 退款回调成功处理
     * @param string $refund_sn
     * @return void
     * @throws ApiException
     */
    public function refundSuccess(string $refund_sn): void
    {
        $pay_log_refund = app(PayLogRefundService::class)->getPayLogRefundByPaySn($refund_sn);
        if (!$pay_log_refund || $pay_log_refund['status'] == 1) {
            return;
        }
        if (empty($pay_log_refund['order_id'])) return;
        try {
            //修改通知状态
            app(PayLogRefund::class)->where('paylog_refund_id', $pay_log_refund['paylog_refund_id'])->save(['status' => 1, 'notify_time' => Time::now()]);
            app(RefundApplyService::class)->onlineRefundSuccess($pay_log_refund['paylog_refund_id']);
        } catch (\Exception $exception) {
            throw new ApiException(Util::lang($exception->getMessage()));
        }
    }

}
