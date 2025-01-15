<?php
//**---------------------------------------------------------------------+
//** 服务层文件 -- 店铺
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\service\admin\merchant;

use app\model\merchant\Shop;
use app\model\merchant\ShopAccountLog;
use app\service\common\BaseService;
use exceptions\ApiException;
use think\model\Collection;
use utils\Excel;
use utils\Time;

/**
 * 店铺资金服务类
 */
class ShopAccountLogService extends BaseService
{

    public function __construct(ShopAccountLog $shopAccountLog)
    {
        $this->model = $shopAccountLog;
    }




    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $alias = $this->model->getTable();
        $query = $this->model->query()->alias($alias);
        // 处理筛选条件
        if (isset($filter['shop_title']) && !empty($filter['shop_title'])) {
            $query->hasWhere('shop', function ($query) use ($filter) {
                $query->where('shop_title', 'like', '%' . $filter['shop_title'] . '%');
            });
        }

        // 添加时间
        if (isset($filter['start_time'],$filter['end_time']) && !empty($filter['start_time']) && !empty($filter['end_time'])) {
            $query->whereBetweenTime('add_time', Time::toTime($filter['start_time']), Time::toTime($filter['end_time']));
        }

        if (isset($filter['shop_id']) && $filter['shop_id'] > -1) {
            $query->where("$alias.shop_id", $filter['shop_id']);
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order("$alias." . $filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 资金日志列表
     *
     * @param array $filter
     * @return Collection
     */
    public function getFilterList(
        array $filter,
        array $with = [],
        array $append = [],
        array $withCount = []): Collection
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

        if (isset($filter['is_export'])) {
            if ($filter['is_export']) {
                // 导出
                $export = clone $query;
                $export_info = $export->select()->toArray();
                $export_title = ["店铺名称","原店铺资金","原不可用余额","资金变动类型","现店铺资金","现不可用余额","待结算金额","备注","添加时间"];
                $file_name = '资金明细日志导出' . Time::getCurrentDatetime("Ymd") . rand(1000, 9999);
                $this->exportData($export_title,$file_name,$export_info);
            }
        }
        return $query->page($filter['page'], $filter['size'])->select();
    }

    /**
     * 资金明细导出
     * @param array $export_title
     * @param string $file_name
     * @param array $export_info
     * @return bool
     */
    public function exportData(array $export_title,string $file_name,array $export_info):bool
    {
        if (empty($export_info)) return false;
        $export_data = $arr_export = [];
        foreach ($export_info as $key => $value) {
            $arr_export["shop_title"] = $value['shop_title'];
            $arr_export["shop_money"] = $value['shop_money'];
            $arr_export["frozen_money"] = $value['frozen_money'];
            $arr_export["type"] = $value['type'] == 1 ? '提现' : '充值';
            $arr_export["new_shop_money"] = $value['new_shop_money'];
            $arr_export["new_frozen_money"] = $value['new_frozen_money'];
            $arr_export["un_settlement_order"] = $value['un_settlement_order'];
            $arr_export["remarks"] = $value['remarks'];
            $arr_export["add_time"] = $value['add_time'];
            $export_data[$key] = array_values($arr_export);
        }
        Excel::export($export_title, $file_name, $export_data);
        return true;
    }


    /**
     * 创建
     * @param array $data
     * @return Shop|\think\Model
     */
    public function create(array $data): Shop|\think\Model
    {
        $result = $this->model->create($data);
        return $result;
    }

    /**
     * 创建提现
     * @return void
     */
    public function addWithDrawLog($data): void
    {
        $shop = $this->changeShopAccount($data, 1);
        $new_shop_money = bcsub($shop['shop_money'], $data['amount'], 2);
        $new_frozen_money = bcadd($shop['frozen_money'], $data['amount'], 2);
        $this->create([
            'shop_money' => $shop['shop_money'],
            'frozen_money' => floatval($shop['frozen_money']),
            'new_shop_money' => $new_shop_money,
            'new_frozen_money' => $new_frozen_money,
            'shop_id' => $data['shop_id'],
            'type' => 1,
        ]);

    }

    /**
     * 退回提现
     * @return void
     */
    public function refundWithDrawLog($data): void
    {
        $shop = $this->changeShopAccount($data, 2);
        $new_shop_money = bcadd($shop['shop_money'], $data['amount'], 2);
        $new_frozen_money = bcsub($shop['frozen_money'], $data['amount'], 2);
        $this->create([
            'shop_money' => $shop['shop_money'],
            'frozen_money' => $shop['frozen_money'],
            'new_shop_money' => $new_shop_money,
            'new_frozen_money' => $new_frozen_money,
            'shop_id' => $data['shop_id'],
            'type' => 1,
        ]);

    }

    /**
     * 完成提现
     * @param $data
     * @return void
     */
    public function completeWithDrawLog($data): void
    {
        $shop = $this->changeShopAccount($data, 3);
        $new_frozen_money = bcsub($shop['frozen_money'], $data['amount'], 2);
        $this->create([
            'shop_money' => $shop['shop_money'],
            'frozen_money' => $shop['frozen_money'],
            'new_shop_money' => $shop['shop_money'],
            'new_frozen_money' => $new_frozen_money,
            'shop_id' => $data['shop_id'],
            'type' => 1,
        ]);
    }

    /**
     * 店铺资金变化
     * @param array $data
     * @param int $type
     * @return Shop
     * @throws ApiException
     */
    public function changeShopAccount(array $data,int $type = 0): Shop
    {
        $shop = Shop::where('shop_id', $data['shop_id'])->find();
        if (empty($shop)) {
            throw new ApiException("店铺不存在");
        }
        switch ($type) {
            case 1:
                // 店铺资金减少，冻结资金增加
                Shop::where('shop_id', $data['shop_id'])->dec('shop_money', $data['amount'])->inc("frozen_money",$data['amount'])->save();
                break;
            case 2:
                // 店铺资金增加，冻结资金减少
                Shop::where('shop_id', $data['shop_id'])->inc('shop_money', $data['amount'])->dec('frozen_money', $data['amount'])->save();
                break;
            case 3:
                // 店铺资金不变，冻结资金减少
                Shop::where('shop_id', $data['shop_id'])->dec('frozen_money', $data['amount'])->save();
                break;
            case 4:
                // 店铺资金增加，冻结资金不变
                Shop::where('shop_id', $data['shop_id'])->inc('shop_money', $data['amount'])->save();
                break;
            default:
                break;
        }
        return $shop;
    }
}
