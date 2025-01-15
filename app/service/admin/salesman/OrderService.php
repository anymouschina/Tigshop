<?php

namespace app\service\admin\salesman;

use app\job\SalesmanOrderJob;
use app\model\finance\RefundLog;
use app\model\order\Order;
use app\model\salesman\Salesman;
use app\model\salesman\SalesmanOrder;
use app\model\salesman\SalesmanProduct;
use app\model\user\User;
use app\service\admin\user\UserService;
use app\service\common\BaseService;
use exceptions\ApiException;
use think\model\Collection;
use utils\Excel;
use utils\TigQueue;
use utils\Time;
use utils\Util;

/**
 * 服务类
 */
class OrderService extends BaseService
{

    public function __construct(SalesmanOrder $order)
    {
        $this->model = $order;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query()->alias('salesman_order');
        // 处理筛选条件
        $query->withJoin(['userOrder', 'userOrderItem','userOrderRefund'], 'LEFT');
        if (isset($filter['shop_id'])) {
            $query->where('userOrder.shop_id', $filter['shop_id']);
        }
        if (!empty($filter['order_sn'])) {
            $query->where('userOrder.order_sn', 'like', '%' . $filter['order_sn'] . '%');
        }
        if (isset($filter['status']) && $filter['status'] != -1) {
            $query->where('status', $filter['status']);
        }

        if (isset($filter['time_type']) && $filter['time_type'] != -1) {
            if (!empty($filter['order_time_start'] || !empty($filter['order_time_end']))) {
                if ($filter['time_type']) {
                    // 下单时间
                    if (!empty($filter['order_time_start'])) {
                        $query->where('userOrder.add_time', '>=', Time::toTime($filter['order_time_start']));
                    }
                    if (!empty($filter['order_time_end'])) {
                        $query->where('userOrder.add_time', '<=', (Time::toTime($filter['order_time_end']) + 86400));
                    }
                } else {
                    // 退款时间
                    if (!empty($filter['order_time_start'])) {
                        $query->where('userOrderRefund.add_time', '>=', Time::toTime($filter['order_time_start']));
                    }
                    if (!empty($filter['order_time_end'])) {
                        $query->where('userOrderRefund.add_time', '<=', (Time::toTime($filter['order_time_end']) + 86400));
                    }
                }
            }
        } else {
            if (!empty($filter['order_time_start'])) {
                $query->where('userOrder.add_time', '>=', strtotime($filter['order_time_start']));
            }
            if (!empty($filter['order_time_end'])) {
                $query->where('userOrder.add_time', '<=', strtotime($filter['order_time_end'] . ' 23:59:59'));
            }
        }



        if (!empty($filter['salesman_id'])) {
            $query->where('salesman_id', $filter['salesman_id']);
        }

        if (isset($filter['group_id']) && !empty($filter['group_id'])) {
            $salesman_ids = Salesman::where('group_id', $filter['group_id'])->column('salesman_id');
            $query->whereIn('salesman_id', $salesman_ids);
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order('userOrder.' . $filter['sort_field'], $filter['sort_order']);
        }

        if (!empty($filter['keyword'])) {
            $user = User::where('mobile', $filter['keyword'])->field(['user_id'])->find();
            $query->where(function ($query) use ($filter, $user) {
                $query->whereOr('userOrder.user_id', $user ? $user->user_id : -1)->whereOr('userOrder.order_sn', 'like',
                    '%' . $filter['keyword'] . '%')->whereOr('userOrderItem.product_name', 'like',
                    '%' . $filter['keyword'] . '%');
            });
        }

        return $query;
    }

    /**
     * 获取筛选结果
     * @param array $filter
     * @param array $with
     * @param array $append
     * @param array $withCount
     * @return Collection
     */
    public function getFilterList(
        array $filter,
        array $with = [],
        array $append = [],
        array $withCount = []
    ): Collection
    {
        $query = $this->filterQuery($filter);
        if ($with) {
            $query = $query->with($with);
        }
        if ($withCount) {
            $query = $query->withCount($withCount);
        }
        if ($append) {
            $query = $query->append($append);
        }
        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query = $query->order($filter['sort_field'], $filter['sort_order']);
        }

        if (!empty($filter['is_export'])) {
            // 导出
            $result = $query->select();
        } else {
            $result = $query->page($filter['page'], $filter['size'])->select();
        }
        foreach ($result as $k => $item) {
            // 成交金额 = 商品总金额
            $item['userOrderItem']['total_product_money'] = (float) bcmul($item['userOrderItem']['price'], $item['userOrderItem']['quantity'], 2);
            // 收益组成
            $item['profit_composition'] = $this->getOrderProductCommission($item,!empty($filter['is_export']) ? 1 : 0);
        }

        if (!empty($filter['is_export'])) {
            if ($filter['range']) {
                $rang_name = "订单维度结算报表_";
            } else {
                $rang_name = "商品维度结算报表_";
            }
            $export_data = $this->getExportOrderSalesmanData($result->toArray(), $filter['range']);
            $file_name = $rang_name . Time::getCurrentDatetime() . rand(100000, 999999) . ".xlsx";
            Excel::export($export_data['field'], $file_name, $export_data['item']);
        }
        return $result;
    }

    /**
     * 获取订单商品的佣金比例/金额
     * @param Object $salesman_order
     * @param int $is_export
     * @return string
     */
    public function getOrderProductCommission(Object $salesman_order,int $is_export = 0):string
    {
        $profit_composition = $unit = "";
        if (!empty($salesman_order['salesman_product_data']['commission_data'])) {
            foreach ($salesman_order['salesman_product_data']['commission_data'] as $levels) {
                foreach ($levels['level_arr'] as $level) {
                    if (!empty($is_export)) {
                        if (in_array($salesman_order['salesman_product_data']['commission_type'],
                            [SalesmanProduct::COMMISSION_TYPE_DEFAULT,SalesmanProduct::COMMISSION_TYPE_CUSTOM_SCALE])) {
                            // 按比例
                            $unit = "比例";
                        } else {
                            // 按金额
                            $unit = "金额";
                        }
                    }
                    if ($level['level'] == $salesman_order['salesman']['level']) {
                        $profit_composition = $unit . $level['rate'];
                    }
                }
            }
        }
        return $profit_composition;
    }

    // 获取导出数据
    public function getExportOrderSalesmanData(array $data, int $range):array
    {
        // 获取导出标题
        $title = $this->getExportOrderSalesmanTitle($range);
        $fields = array_values($title);
        $export_data = [];
        foreach ($data as $k => $item) {
            $export_data[] = $this->getExportData($item,$title,$range);
        }
        return [
            'field' => $fields,
            'item' => $export_data
        ];
    }

    /**
     * 导出数据封装
     * @param array $item
     * @param array $title
     * @param int $range
     * @return array
     */
    public function getExportData(array $item,array $title,int $range):array
    {
        $row = [];
        foreach ($title as $t => $val) {
            // 退款信息
            $refund = RefundLog::where(['order_id' => $item['order_id'],"user_id" => $item['order_user_info']['user_id']])
                ->order('log_id', 'desc');
            switch ($t) {
                case 'add_time':
                    $row[$t] = $item['order_user_info']['add_time'];
                    break;
                case 'pay_time':
                    $row[$t] = $item['order_user_info']['pay_time'];
                    break;
                case 'nickname':
                    $row[$t] = $item['salesman']['base_user_info']['nickname'];
                    break;
                case 'distribution_register_time':
                    $row[$t] = !empty($item['salesman']['base_user_info']['distribution_register_time']) ? $item['salesman']['base_user_info']['distribution_register_time'] : "";
                    break;
                case 'customer_nickname':
                    $row[$t] = $item['order_user_info']['user']['nickname'];
                    break;
                case 'customer_mobile':
                    $row[$t] = $item['order_user_info']['user']['mobile'];
                    break;
                case 'shop_title':
                    $row[$t] = $item['salesman']['shop_info']['shop_title'] ?? "自营";
                    break;
                case 'group_name':
                    $row[$t] = $item['salesman']['group_info']['group_name'];
                    break;
                case 'order_sn':
                    $row[$t] = $item['order_user_info']['order_sn'];
                    break;
                case "total_product_money":
                    $row[$t] = (float) bcmul($item['userOrderItem']['price'], $item['userOrderItem']['quantity'], 2);
                    break;
                case "profit_composition":
                    if (strpos($item['profit_composition'], "比例") !== false) {
                        $row[$t] = $item['profit_composition'] . "%";
                    }else{
                        $row[$t] = $item['profit_composition'];
                    }
                    break;
                case 'amount':
                    $row[$t] = $item['amount'];
                    break;
                case "status":
                    $status = $item['status'];
                    if ($status) {
                        $row[$t] = "已结算";
                    } else {
                        $row[$t] = "待结算";
                    }
                    break;
                case "settlement_time":
                    $row[$t] = $item['settlement_time'];
                    break;
            }

            if ($range) {
                // 订单维度结算报表
                switch ($t) {
                    case "settlement_type":
                        $row[$t] = $item['salesman_settlement_data']['settlement_type'] == 1 ? "自动结算" : "人工结算";
                        break;
                    case "inviter_nickname":
                        $row[$t] = $item['salesman']['pid_user_info']['base_user_info']['nickname'] ?? "";
                        break;
                    case "inviter_mobile":
                        $row[$t] = $item['salesman']['pid_user_info']['base_user_info']['mobile'] ?? "";
                        break;
                    case "order_source":
                        $row[$t] = $item['order_user_info']['order_source'];
                        break;
                    case "order_status":
                        $row[$t] = Order::ORDER_STATUS_MAP[$item['order_user_info']['order_status']] ?? "" ;
                        break;
                    case "refund_amount":
                        $total_refund = clone $refund;
                        $row[$t] = !empty($total_refund->sum('refund_amount')) ? $total_refund->sum('refund_amount') : "";
                        break;
                    case "refund_time":
                        $get_refund = clone $refund;
                        $row[$t] = !empty($get_refund->find()) ? $get_refund->find()->add_time : "";
                        break;

                }
            } else {
                // 商品维度结算报表
                switch ($t) {
                    case "inviter_nickname":
                        $row[$t] = $item['salesman']['pid_user_info']['base_user_info']['nickname'] ?? "";
                        break;
                    case "inviter_mobile":
                        $row[$t] = $item['salesman']['pid_user_info']['base_user_info']['mobile'] ?? "";
                        break;
                    case "product_sn":
                        $row[$t] = $item['userOrderItem']['product_sn'];
                        break;
                    case "product_name":
                        $row[$t] = $item['userOrderItem']['product_name'];
                        break;
                    case "price":
                        $row[$t] = $item['userOrderItem']['price'];
                        break;
                    case "quantity":
                        $row[$t] = $item['userOrderItem']['quantity'];
                        break;
                    case "is_join":
                        $row[$t] = $item['salesman_product_data']['is_join'] ? "参与" : "不参与";
                        break;
                    case "product_commission_type":
                        if (strpos($item['profit_composition'], "比例") !== false) {
                            $row[$t] = $item['profit_composition'] . "%";
                        }else{
                            $row[$t] = $item['profit_composition'];
                        }
                        break;
                    case "product_commission":
                        if (strpos($item['profit_composition'], "比例") !== false) {
                            $rate = (float) bcdiv(str_replace("比例", "", $item['profit_composition']),100,2);
                            $total_product = (float) bcmul($item['userOrderItem']['price'], $item['userOrderItem']['quantity'], 2);
                            $row[$t] = (float) bcmul($total_product, $rate, 2);
                        }else{
                            $row[$t] = str_replace("金额", "", $item['profit_composition']);
                        }
                        break;
                    case "order_source":
                        $row[$t] = $item['order_user_info']['order_source'];
                        break;
                    case "order_status":
                        $row[$t] = Order::ORDER_STATUS_MAP[$item['order_user_info']['order_status']] ?? "" ;
                        break;
                    case "refund_time":
                        $get_refund = clone $refund;
                        $row[$t] = !empty($get_refund->find()) ? $get_refund->find()->add_time : "";
                        break;
                }
            }
        }
        $row = array_values($row);
        return $row;
    }


    /**
     * 获取导出标题
     * @param int $range
     * @return string[]
     */
    public function getExportOrderSalesmanTitle(int $range):array
    {
        if ($range) {
            // 订单维度结算报表
            $fields = [
                'add_time' => "下单时间",
                'pay_time' => "支付时间",
                'nickname' => "分销员昵称",
                'distribution_register_time' => "分销员加入时间",
                'customer_nickname' => "客户昵称",
                'customer_mobile' => "客户手机号",
                'shop_title' => "门店信息",
                'group_name' => "所属分组",
                'order_sn' => "订单号",
                'total_product_money' => "成交金额",
                'profit_composition' => "订单佣金类型",
                'amount' => "订单佣金",
                'status' => "结算状态",
                'settlement_time' => "结算时间",
                'settlement_type' => "结算方式",
                'inviter_nickname' => "邀请方昵称",
                'inviter_mobile' => "邀请方手机号",
                'order_source' => "订单来源",
                'order_status' => "订单状态",
                'refund_amount' => "退款金额",
                'refund_time' => "退款时间"
            ];
        } else {
            // 商品维度结算报表
            $fields = [
                'add_time' => "下单时间",
                'pay_time' => "支付时间",
                'nickname' => "分销员昵称",
                'distribution_register_time' => "分销员加入时间",
                'customer_nickname' => "客户昵称",
                'customer_mobile' => "客户手机号",
                'shop_title' => "门店信息",
                'group_name' => "所属分组",
                'order_sn' => "订单号",
                'total_product_money' => "成交金额",
                'profit_composition' => "订单佣金类型",
                'amount' => "订单佣金",
                'status' => "结算状态",
                'settlement_time' => "结算时间",
                'inviter_nickname' => "邀请方昵称",
                'inviter_mobile' => "邀请方手机号",
                'product_sn' => "商品编码",
                'product_name' => "商品标题",
                'price' => "商品价格",
                'quantity' => "商品数量",
                'is_join' => "商品是否参与推广",
                'product_commission_type' => "商品佣金类型",
                'product_commission' => "商品佣金",
                'order_source' => "订单来源",
                'order_status' => "订单状态",
                'refund_time' => "退款时间"
            ];
        }
        return $fields;
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @throws ApiException
     */
    public function getDetail(int $id)
    {
        $result = $this->model->with(['order'])->where('salesman_order_id', $id)->find();
        return $result;
    }

    /**
     * 创建分销订单
     * @param $data
     * @return SalesmanOrder|\think\Model | bool
     */
    public function create($data)
    {
        $salesmanProduct = SalesmanProduct::where('product_id', $data['product_id'])->find();
        if (empty($salesmanProduct) || $salesmanProduct->is_join != 1) {
            return true;
        }
        $salesman = Salesman::where('salesman_id', $data['salesman_id'])->find();
        if ($salesmanProduct['commission_type'] == 1) {
            $rate = 0;
            $config = app(ConfigService::class)->getSalesmanConfig();
            foreach ($config['level'] as $value) {
                if ($value['id'] == $salesman['level']) {
                    $rate = $value['rate'];
                    break;
                }
            }
            $amount = $data['price'] * $data['quantity'] * $rate / 100;
        } elseif ($salesmanProduct['commission_type'] == 2) {
            $rate = 0;
            if (!empty($salesmanProduct['commission_data']['0']['level_arr'])) {
                foreach ($salesmanProduct['commission_data']['0']['level_arr'] as $table_data) {
                    if ($table_data['level'] == $salesman['level']) {
                        $rate = $table_data['rate'];
                        break;
                    }
                }
                $amount = $data['price'] * $data['quantity'] * $rate / 100;
            }
        } else {
            $amount = 0;
            foreach ($salesmanProduct['commission_data']['0']['level_arr'] as $table_data) {
                if ($table_data['level'] == $salesman['level']) {
                    $amount = $table_data['rate'];
                    break;
                }
            }

        }
        if ($amount < 0.01) {
            $amount = 0;
        }

        return SalesmanOrder::create([
            'order_id' => $data['order_id'],
            'item_id' => $data['item_id'],
            'product_id' => $data['product_id'],
            'salesman_id' => $data['salesman_id'],
            'salesman_product_data' => $salesmanProduct,
            'amount' => Util::number_format_convert($amount),
            'order_amount' => Util::number_format_convert($data['price'] * $data['quantity']),
        ]);
    }


    /**
     * 自动结算订单
     * @return void
     */
    public function autoSettlement(array $data): bool
    {
        $orders = SalesmanOrder::where('order_id', $data['order_id'])->select();
        foreach ($orders as $order) {
            if ($order['status'] !== 0) {
                continue;
            }
            SalesmanOrder::where('salesman_order_id', $order['salesman_order_id'])->update([
                'status' => 1,'settlement_time' => Time::now()
            ]);
            $salesman = Salesman::where('salesman_id', $order['salesman_id'])->find();
			// 分销员统计累计销售额
			$salesman->increment('sale_amount', $order['amount']);
			// 分销员结算佣金
            app(UserService::class)->incBalance($order['amount'], $salesman['user_id'],
                '订单' . $order['order_sn'] . '结算佣金');

        }
        return true;
    }


    /**
     * 结算订单
     * @return void
     */
    public function settlement($salesmanOrderId): bool
    {
        $order = SalesmanOrder::where('salesman_order_id', $salesmanOrderId)->find();
        if ($order['status'] !== 0) {
            return true;
        }
        SalesmanOrder::where('salesman_order_id', $salesmanOrderId)->update([
            'status' => 1,'settlement_time' => Time::now()
        ]);
        $salesman = Salesman::where('salesman_id', $order['salesman_id'])->find();
		// 分销员统计累计销售额
		$salesman->increment('sale_amount', $order['amount']);

        app(UserService::class)->incBalance($order['amount'], $salesman['user_id'],
            '订单' . $order['order_sn'] . '结算佣金');
        return true;
    }

    /**
     * 触发确认收货
     * @param array $orderDetail
     * @return void
     */
    public function triggerAutoSettlement(array $orderDetail)
    {
        $config = app(ConfigService::class)->getSalesmanSettlement();
        SalesmanOrder::where('order_id', $orderDetail['order_id'])->update([
            'salesman_settlement_data' => $config
        ]);
        if (isset($config['settlement_type']) && $config['settlement_type'] == 1) {
            $job_data = $orderDetail;
            $day = $config['date_type'] == 0 ? 15 : 0;
            app(TigQueue::class)->later(SalesmanOrderJob::class, $day * 24 * 3600, $job_data);
        }

    }


}
