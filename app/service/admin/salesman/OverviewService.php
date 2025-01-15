<?php

namespace app\service\admin\salesman;

use app\model\order\Order;
use app\model\salesman\SalesmanOrder;
use app\service\admin\panel\StatisticsUserService;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Time;

class OverviewService extends BaseService
{
    /**
     * 核心数据汇总
     * @param int $shop_id
     * @param int $summary_type
     * @return array
     */
    public function coreSummary(int $shop_id,int $summary_type = 0):array
    {
        if ($summary_type) {
            // 累计
            $start = "";
        } else {
            // 今日
            $start = date("Y-m-d",Time::now());
        }
        // 新增分销员数
        $new_salesman_count = app(SalesmanService::class)->getFilterCount([
            "shop_id" => $shop_id,
            "add_time_start" => $start,
            'add_time_end' => $start
        ]);
        // 分销员销售额
        $salesman_amount = app(SalesmanService::class)->getFilterSum([
            "shop_id" => $shop_id,
            "add_time_start" => $start,
            'add_time_end' => $start
        ],'sale_amount');
        // 成交客户数
        $order_ids = SalesmanOrder::hasWhere('salesman',function ($query) use ($shop_id) {
                        $query->where('shop_id',$shop_id);
                    })->addTime($start,$start)->column('order_id');
        $custom_num = Order::whereIn('order_id',$order_ids)->group('user_id')->count();
        // 支出佣金
        $salesman_commission = SalesmanOrder::hasWhere('salesman',function ($query) use ($shop_id) {
                        $query->where('shop_id',$shop_id);
                    })->addTime($start,$start)->where("status",1)->sum('amount');
        return [
            "new_salesman_count" => $new_salesman_count,
            "salesman_amount" => $salesman_amount,
            "custom_num" => $custom_num,
            "salesman_commission" => $salesman_commission
        ];
    }

    /**
     * 核心指标趋势
     * @param int $shop_id
     * @param array $data
     * @return array
     * @throws ApiException
     */
    public function coreTrend(int $shop_id,array $data):array
    {
        if (empty($data["start_end_time"])) {
            throw new ApiException('请选择日期');
        }
        // 获取时间区间
        $start_end_time = app(StatisticsUserService::class)->getDateRange($data["date_type"], $data["start_end_time"]);

        $trend = $this->getTrendStatisticsData($shop_id,$data["date_type"],$start_end_time);
        return $trend;
    }

    /**
     * 核心指标趋势-图表封装
     * @param int $shop_id
     * @param int $date_type
     * @param array $start_end_time
     * @return array
     */
    public function getTrendStatisticsData(int $shop_id,int $date_type,array $start_end_time):array
    {
        list($start_date, $end_date) = $start_end_time;
        // 横轴
        $horizontal_axis = app(StatisticsUserService::class)->getHorizontalAxis($date_type, $start_date, $end_date);
        $trend_data = app(SalesmanService::class)->filterQuery([
            "shop_id" => $shop_id,
            "add_time_start" => $start_date,
            'add_time_end' => $end_date
        ])->select()->toArray();
        // 纵轴
        $longitudinal_axis = app(StatisticsUserService::class)->getLongitudinalAxis($horizontal_axis, $trend_data, $date_type, 8);
        return [
            "horizontal_axis" => $horizontal_axis,
            "longitudinal_axis" => $longitudinal_axis
        ];
    }
}
