<?php

namespace app\service\admin\salesman;

use app\model\finance\RefundLog;
use app\model\order\Order;
use app\model\salesman\Salesman;
use app\model\salesman\SalesmanCustomer;
use app\model\salesman\SalesmanOrder;
use app\model\user\User;
use app\service\admin\panel\StatisticsUserService;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Excel;
use utils\Time;
use utils\Util;

/**
 * 服务类
 */
class SalesmanService extends BaseService
{

    public function __construct(Salesman $salesman)
    {
        $this->model = $salesman;
    }

    /**
     * 列表数据处理
     * @param Object $salesman
     * @param int $shop_id
     * @return Object
     * @throws ApiException
     */
    public function dealResult(Object $salesman,int $shop_id)
    {
        if (!empty($salesman)) {
            foreach ($salesman as $item) {
                // 获取分销等级
                $item->level_text = "";
                $levelConfig = app(ConfigService::class)->getDetail('salesmanConfig', $shop_id);
                if (!empty($levelConfig)) {
                    $level_name = array_column($levelConfig['level'],'name','id');
                    $item->level_text = $level_name[$item['level']] ?? 0;
                }
            }
        }
        return $salesman;
    }

    /**
     * 统计明细
     * @param Object $salesman
     * @param int $shop_id
     * @return Object
     * @throws ApiException
     */
    public function dealDetailsResult(Object $salesman,int $shop_id): Object
    {
        if (!empty($salesman->toArray())) {
            $refund_amount = $refund_count = 0;
            // 获取分销等级
            $levelConfig = app(ConfigService::class)->getDetail('salesmanConfig',$shop_id);
            $level_name = array_column($levelConfig['level'],'name','id');
            foreach ($salesman as $k => $item) {
                $item['level_text'] = $level_name[$item['level']] ?? 0;

                if (!empty($item['salesman_order_info'])) {
                    // 分销商品支付金额
                    $item['pay_money'] = array_sum(array_column($item['salesman_order_info']->toArray(),'order_amount'));
                    // 退款金额
                    foreach ($item['salesman_order_info'] as $i => $order) {
                        $refund_amount += RefundLog::where("order_id",$order['order_id'])->sum('refund_amount');
                        // 退款订单数
                        $refund_count += RefundLog::where("order_id",$order['order_id'])->group("order_id")->count();
                    }
                    // 支付订单数
                    $order_ids = array_column($item['salesman_order_info']->toArray(),'order_id');
                    $item['order_count'] = count(array_values(array_unique($order_ids)));
                    // 累计收益
                    $item['total_amount_commission'] = array_sum(array_column($item['salesman_order_info']->toArray(),'amount'));
                }
                $item['refund_amount'] = $refund_amount;
                $item['refund_count'] = $refund_count;
            }
        }
        return $salesman;
    }

    /**
     * 分销员明细导出
     * @param Object $salesman
     * @return bool
     */
    public function detailsExportData(Object $salesman):bool
    {
        $title = [
            "mobile" => "手机号",
            "nickname" => "昵称",
            "level_text" => "等级",
            "group_name" => "分组",
            "sale_amount" => "累计销售金额",
            "pay_money" => "支付金额",
            "refund_amount" => "退款金额",
            "order_count" => "支付订单数",
            "refund_count" => "退款订单数",
            "total_commission" => "已结算收益",
            "total_amount_commission" => "累计收益",
            "total_customer" => "累计客户数"
        ];
        $export_data = $export_row = [];

        foreach ($salesman as $s => $item) {
            foreach ($title as $t => $row) {
                if (isset($item[$t])) {
                    $export_row[$t] = $item[$t];
                }
                switch ($t) {
                    case "mobile":
                        $export_row[$t] = $item['base_user_info']['mobile'];
                        break;
                    case "nickname":
                        $export_row[$t] = $item['base_user_info']['nickname'];
                        break;
                    case "group_name":
                        $export_row[$t] = $item['group_info']['group_name'];
                        break;
                }
            }
            $export_data[] = array_values($export_row);
        }
        $field = array_values($title);
        $file_name = "分销员明细导出" . Time::getCurrentDatetime() . rand(100000, 999999) . ".xlsx";
        Excel::export($field, $file_name, $export_data);
        return true;
    }

    /**
     * 分销员排行
     * @param Object $data
     * @param array $filter
     * @return array|object
     * @throws ApiException
     */
    public function getSalesmanRanking(Object $data,array $filter):array|object
    {
        if (empty($data->toArray())) {
            return $data;
        }

        if (empty($filter["start_end_time"])) {
            throw new ApiException("请选择时间");
        }
        // 时间转换
        $start_end_time = app(StatisticsUserService::class)->getDateRange($filter["date_type"], $filter["start_end_time"]);
        list($start,$end) = $start_end_time;
        $start = Time::toTime($start);
        $end = Time::toTime($end) + 86400;

        $result = [];
        foreach ($data as $k => $item) {
            // 新增销售额
            if ($start <= Time::toTime($item['add_time']) && $end > Time::toTime($item['add_time'])) {
                $item['total_sale_amount'] = $item['sale_amount'];
            } else {
                $item['total_sale_amount'] = 0;
            }

            // 新增客户数
            if (!empty($item['customer'])) {
                $total_customers = 0;
                foreach ($item['customer'] as $c => $customer) {
                    if ($start <= Time::toTime($customer['add_time']) && $end > Time::toTime($customer['add_time'])) {
                        $total_customers++;
                    }
                }
            } else {
                $total_customers = 0;
            }
            $item['total_customers'] = $total_customers;

            // 支付客户数 -- 开单邀请数
            $order_num = 0;
            if (!empty($item['salesman_order_info'])) {
                $order_ids = [];
                foreach ($item['salesman_order_info'] as $i => $order) {
                    if ($start <= Time::toTime($order['add_time']) && $end > Time::toTime($order['add_time'])) {
                        array_push($order_ids,$order['order_id']);
                        $order_num++;
                    }
                }
                $item['total_pay_customers'] = Order::whereIn('order_id',$order_ids)->group('user_id')->count();
            } else {
                $item['total_pay_customers'] = 0;
            }
            $item['order_num'] = $order_num;

            $result[$k] = [
                "username" => $item['base_user_info']['username'] ?? "",
                "nickname" => $item['base_user_info']['nickname'] ?? "",
                "total_sale_amount" => $item['total_sale_amount'] ?? 0,
                "total_customers" => $item['total_customers'] ?? 0,
                "total_pay_customers" => $item['total_pay_customers'] ?? 0,
                "order_num" => $item['order_num'] ?? 0
            ];
        }

        // 排序
        if (isset($filter['real_sort_field'],$filter['sort_order']) && !empty($filter['real_sort_field']) && !empty($filter['sort_order'])) {
            if (in_array($filter['real_sort_field'], ['total_sale_amount','total_customers','total_pay_customers','order_num'])) {
                array_multisort(array_column($result, $filter['real_sort_field']), $filter['sort_order'] == "desc" ? SORT_DESC : SORT_ASC, $result);
            }
        }

        $result = array_slice($result, (($filter["page"] ?? 1) - 1) * ($filter["real_size"] ?? 20), ($filter["real_size"] ?? 20));
        return $result;
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

        if (isset($filter['keywords']) && !empty($filter['keywords'])) {
            $query->hasWhere('user', function ($query) use ($filter) {
                $query->where('nickname|mobile', 'like', '%' . $filter['keywords'] . '%');
            });
        }

        if (isset($filter['shop_id']) && !empty($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }

        if (!empty($filter['level'])) {
            $query->where('level', $filter['level']);
        }
        if (!empty($filter['group_id'])) {
            $query->where('group_id', $filter['group_id']);
        }
        if (!empty($filter['user_id'])) {
            $query->where('user_id', $filter['user_id']);
        }

        if (!empty($filter['pid'])) {
            $query->where('pid', $filter['pid']);
        }

        if (isset($filter['salesman_id'])) {
            $query->where('salesman_id', $filter['salesman_id']);
        }

        if (!empty($filter['add_time_start'])) {
            $query->where('add_time', '>=', strtotime($filter['add_time_start']));
        }
        if (!empty($filter['add_time_end'])) {
            $query->where('add_time', '<=', strtotime($filter['add_time_end'] . ' 23:59:59'));
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }

        return $query;
    }

    /**
     * 获取详情
     * @param int $id
     * @return Salesman
     * @throws ApiException
     */
    public function getDetail(int $id): Salesman
    {
        $result = $this->model->with(['base_user_info','pid_user_info','group_info'])->where('salesman_id', $id)->find();
        if (empty($result)) {
            throw new ApiException(Util::lang('数据不存在'));
        }

        // 获取分销员等级
        $result->level_text = "";
        $levelConfig = app(ConfigService::class)->getDetail('salesman_config',$result->shop_id);
        if (!empty($levelConfig)) {
            $level_name = array_column($levelConfig['level'],'name','id');
            $result->level_text = $level_name[$result['level']] ?? 0;
        }
        return $result;
    }

    /**
     * 分销员统计数据
     * @param Object $salesman
     * @return array
     * @throws ApiException
     */
    public function getStatistical(Object $salesman):array
    {
        // 累计订单数
        $order_num = SalesmanOrder::where('salesman_id', $salesman['salesman_id'])->count();
        // 累计客户数
        $customer_num = SalesmanCustomer::where('salesman_id', $salesman['salesman_id'])->count();
        // 累计邀请数
        $invite_num = Salesman::where('pid', $salesman['salesman_id'])->count();
        // 累计佣金
        $commission_amount = SalesmanOrder::where('salesman_id', $salesman['salesman_id'])->sum('amount');
        // 商品成交金额
        $product_transaction_amount = SalesmanOrder::where('salesman_id', $salesman['salesman_id'])->sum('order_amount');
        // 商品佣金比例
        $product_commission_rate = app(ConfigService::class)->getSalesmanCommissionRate($salesman['level']) / 100;
        // 商品佣金金额
        $product_commission_amount = (float) bcmul($product_transaction_amount, $product_commission_rate,2);

        return [
            'sale_amount' => $salesman['sale_amount'],
            'order_num' => $order_num,
            'customer_num' => $customer_num,
            'invite_num' => $invite_num,
            'commission_amount' => $commission_amount,
            'product_commission_amount' => $product_commission_amount
        ];
    }


    /**
     * 获取详情
     * @param int $userId
     * @return Salesman|null
     */
    public function getDetailByUserId(int $userId): Salesman|null
    {
        $result = $this->model->where('user_id', $userId)->find();
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
        } else {
            $result = $this->model->where('salesman_id', $id)->save($data);
        }

		return $isAdd ? $this->model->getKey() : $result !== false;
    }

    /**
     * 删除
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
     * 获取佣金明细
     * @param Object $salesman
     * @return array
     */
    public function getCommissionDetails(Object $salesman):array
    {
        $result = [];
        $salesman_order = SalesmanOrder::with(['salesman'])->where('salesman_id', $salesman['salesman_id'])->select();
        // 自动/人工已结算佣金
        $auto_settlement_amount = $artificial_settlement_amount = 0;
        // 自动/人工待结算佣金
        $auto_wait_settlement_amount = $artificial_wait_settlement_amount = 0;
        if (!$salesman_order->isEmpty()) {
            // 商品收益总额
            $product_transaction_amount = array_sum(array_column($salesman_order->toArray(), 'amount'));
            foreach ($salesman_order as $order) {
                // 获取订单内商品佣金比例/金额
                $profit_composition = app(OrderService::class)->getOrderProductCommission($order,1);
                $commission_amount = $this->calculateCommissionAmount($order['order_amount'],$profit_composition);
                if ($order['salesman_settlement_data']['settlement_type'] == 1) {
                    // 自动结算
                    if ($order['status']) {
                        // 已结算
                        $auto_settlement_amount += $commission_amount;
                    } else {
                        // 未结算
                        $auto_wait_settlement_amount += $commission_amount;
                    }
                } else {
                    // 人工结算
                    if ($order['status']) {
                        // 已结算
                        $artificial_settlement_amount += $commission_amount;
                    } else {
                        // 未结算
                        $artificial_wait_settlement_amount += $commission_amount;
                    }
                }
            }
            $result = [
                "product_transaction_amount" => $product_transaction_amount,
                "auto_settlement_amount" => $auto_settlement_amount,
                "auto_wait_settlement_amount" => $auto_wait_settlement_amount,
                "artificial_settlement_amount" => $artificial_settlement_amount,
                "artificial_wait_settlement_amount" => $artificial_wait_settlement_amount
            ];
        }
        return $result;
    }

    /**
     * 计算商品佣金金额
     * @param string $order_amount
     * @param string $profit_composition
     * @return float
     */
    public function calculateCommissionAmount(string $order_amount,string $profit_composition): float
    {
        if (strpos($profit_composition, "比例") !== false) {
            $commission_rate = str_replace("比例", "", $profit_composition);
            $commission_rate = (float) bcdiv($commission_rate, 100, 2);
            return (float) bcmul($order_amount, $commission_rate, 2);
        } else {
            $commission_amount = str_replace("金额", "", $profit_composition);
            return (float) $commission_amount;
        }
    }


}
