<?php
//**---------------------------------------------------------------------+
//** 服务层文件 -- 订单统一处理
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\service\admin\order;

use app\model\authority\AdminUser;
use app\model\logistics\LogisticsApiLog;
use app\model\order\Aftersales;
use app\model\order\AftersalesItem;
use app\model\order\Order;
use app\model\order\OrderItem;
use app\model\product\Product;
use app\model\setting\LogisticsCompany;
use app\model\setting\Region;
use app\service\admin\product\ProductService;
use app\service\admin\user\UserRankService;
use app\service\admin\user\UserService;
use app\service\common\BaseService;
use app\service\front\cart\CartService;
use app\validate\order\OrderValidate;
use exceptions\ApiException;
use tig\Http;
use utils\Config;
use utils\Excel;
use utils\Time;
use utils\Util;

/**
 * 订单服务类
 */
class OrderService extends BaseService
{
    protected Order $orderModel;
    protected OrderValidate $orderValidate;
    protected OrderLogService $orderLogService;
    protected $userId = null;

    public function __construct()
    {
        $this->model = new Order();
    }

    /**
     * 设置会员id
     * @param int|null $user_id
     * @return object|$this
     */
    public function setUserId(int|null $user_id): object
    {
        $this->userId = $user_id;
        return $this;
    }

    /**
     * 获取筛选结果
     * @param array $filter
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getFilterResult(array $filter): array
    {
        $result = $this->getFilterList($filter, ['items', 'user', 'shop'],
            ['order_status_name', "user_address", "shipping_status_name", "pay_status_name"]);
        foreach ($result as $item) {
            $orderStatusService = new OrderStatusService();
            $item->available_actions = $orderStatusService->getAvailableActions($item);

            foreach ($item->items as $val) {
                $val->aftersales_item = AftersalesItem::where("order_item_id",
                    $val->item_id)->order("aftersales_item_id", "desc")->limit(1)->find();
            }
        }
        return $result->toArray();
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
		if (isset($filter['suppliers_id']) && !empty($filter['suppliers_id'])) {
			$suppliers_id = $filter['suppliers_id'];
			$product_ids = Product::where(["suppliers_id" => $suppliers_id,'is_delete' => 0])->column("product_id");
			$query->hasWhere("items",function ($query) use ($product_ids) {
				$query->whereIn("product_id", $product_ids);
			});
		}

        // 关键词检索 收货人 + 订单号 + 订单id
        if (isset($filter["keyword"]) && !empty($filter['keyword'])) {
            $query->where(function ($query) use ($filter) {
                $query->where('order_sn', 'like', '%' . $filter['keyword'] . '%')
                    ->whereOr("consignee", 'like', '%' . $filter['keyword'] . '%')
                    ->whereOr("order_id", $filter['keyword']);
            });
        }

        //订单状态
        if (isset($filter["order_status"]) && $filter["order_status"] >= 0) {
            $query->whereIn('order_status',
                is_array($filter['order_status']) ? $filter['order_status'] : [$filter['order_status']]);
        }
        if (isset($filter["order_status"]) && $filter["order_status"] == -2) {
            // 查询删除的订单
            $query->where('is_del', 1);
        } else {
            $query->where('is_del', 0);
        }

        // 店铺检索
        if (isset($filter["shop_id"]) && $filter['shop_id'] > -1) {
            $query->where('shop_id', $filter['shop_id']);
        }
        // 是否结算检索
        if (isset($filter["is_settlement"]) && $filter['is_settlement'] > -1) {
            $query->where('is_settlement', $filter['is_settlement']);
        }
        // 是否积分订单
        if (isset($filter["is_exchange_order"]) && $filter['is_exchange_order'] > -1) {
            $query->where('is_exchange_order', $filter['is_exchange_order']);
        }
        // 支付状态
        if (isset($filter["pay_status"]) && $filter["pay_status"] != -1) {
            $query->where('pay_status', $filter['pay_status']);
        }

        // 发货状态
        if (isset($filter["shipping_status"]) && $filter["shipping_status"] != -1) {
            $query->where('shipping_status', $filter['shipping_status']);
        }

        // 评价状态
        if (isset($filter["comment_status"]) && $filter["comment_status"] != -1) {
            if ($filter["comment_status"]) {
                $query->where('comment_status', $filter["comment_status"]);
            } else {
                $query->awaitComment();
            }
        }

        // 详情地址
        if (isset($filter["address"]) && !empty($filter['address'])) {
            $query->where('address', 'like', '%' . $filter['address'] . '%');
        }

        // 收货人的email
        if (isset($filter["email"]) && !empty($filter['email'])) {
            $query->where('email', 'like', '%' . $filter['email'] . '%');
        }

        // 手机号
        if (isset($filter["mobile"]) && !empty($filter['mobile'])) {
            $query->where('mobile', 'like', '%' . $filter['mobile'] . '%');
        }

        //配送物流
        if (isset($filter["logistics_id"]) && !empty($filter['logistics_id'])) {
            $query->where('logistics_id', $filter['logistics_id']);
        }

        // 下单时间
        if (isset($filter["add_start_time"], $filter["add_end_time"]) && !empty($filter["add_start_time"]) && !empty($filter["add_end_time"])) {
            $add_time = [$filter["add_start_time"], $filter["add_end_time"]];
            $query->addTime($add_time);
        }

        // 支付时间
        if (isset($filter['pay_time']) && !empty($filter['pay_time'])) {
            $filter['pay_time'] = is_array($filter['pay_time']) ? $filter['pay_time'] : explode(',', $filter['pay_time']);
            list($start_date, $end_date) = $filter['pay_time'];
            $start_date = Time::toTime($start_date);
            $end_date = Time::toTime($end_date) + 86400;
            $query->whereTime('pay_time', 'between', [$start_date, $end_date]);
        }

        if (isset($filter["user_id"]) && $filter["user_id"] > 0) {
            $query->where('user_id', $filter['user_id']);
        }

        // PC 端 日期检索
        if (isset($filter["date_type"]) && !empty($filter["date_type"])) {
            // 获取时间区间
            $date_range = $this->getDateRange($filter["date_type"]);
            $query->addTime($date_range);
        }

        if (isset($filter["sort_field"], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 获取时间区间
     *
     * @param int $type
     * @return array
     */
    public function getDateRange(int $type): array
    {
        switch ($type) {
            case 1:
                // 最近三个月
                $date_range = Time::format(Time::monthAgo(3), "Y-m-d");
                break;
            case 2:
                // 最近六个月
                $date_range = Time::format(Time::monthAgo(6), "Y-m-d");
                break;
            case 3:
                // 最近一年
                $date_range = Time::format(Time::monthAgo(12), "Y-m-d");
                break;
        }
        return [$date_range, Time::getCurrentDatetime("Y-m-d")];
    }

    /**
     * 获取详情（对象）
     * @param int $id
     * @param int|null $user_id
     * @return Order
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getOrder(int $id, int|null $user_id = null,int $suppliers_id = 0): Order
    {
        $order = app(OrderDetailService::class)->setId($id)->setUserId($user_id)->getOrder($suppliers_id);
        $order->available_actions = app(OrderStatusService::class)->getAvailableActions($order);
        $order->step_status = app(OrderStatusService::class)->getStepStatus($order);

        foreach ($order->items as $value) {
            $value->aftersales_item = AftersalesItem::hasWhere('aftersales', function ($query) {
                $query->whereIn('status', Aftersales::VALID_STATUS);
            })->where("order_item_id",
                $value->item_id)->order("aftersales_item_id", "desc")->limit(1)->find();
            $value->subtotal = bcmul($value->price, $value->quantity, 2);
        }
        return $order;
    }

    /**
     * 获取详情（数组）
     * @param int $id
     * @param int|null $user_id
     * @return array
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getDetail(int $id, int|null $user_id = null,int $suppliers_id = 0): array
    {
        return $this->getOrder($id, $user_id,$suppliers_id)->toArray();
    }

    /**
     * 是否允许使用电子面单
     * @return bool
     */
    public function getUseWayBillStatus(): bool
    {
        $config = Config::getConfig('base_logistics');
        if (empty($config) || (isset($config['logistics_type']) && empty($config['logistics_type']))) {
            return false;
        }
        return true;
    }


    /**
     * 获取名称
     * @param int $id
     * @return string|null
     */
    public function getSn(int $id): ?string
    {
        return Order::where('order_id', $id)->value('order_sn');
    }

    /**
     * 获取订单状态
     * @param int $id
     * @return int
     */
    public function getPayStatus(int $id): int
    {
        return Order::where('order_id', $id)->value('pay_status');
    }

    /**
     * 获取订单评价状态
     * @param int $id
     * @return int
     */
    public function getCommentStatus(int $id): int
    {
        return Order::where('order_id', $id)->value('comment_status');
    }

    public function getAddProductInfoByIds(array $ids): ?array
    {
        $filter = [
            'ids' => $ids,
        ];
        $result = app(ProductService::class)->filterQuery($filter)->field('pic_thumb,product_id,product_name,product_type,product_sn,product_price as price')->select();
        return $result->toArray();
    }

    public function creatNewOrderSn(): ?string
    {
        return Time::format(Time::now(), 'YmdHi') . mt_rand(10000000, 99999999);
    }

    /**
     * 设置订单已确认
     * @param int $id
     * @return void
     */
    public function setOrderConfirm(int $id): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->setOrderConfirm();
        $orderDetail->addLog('设置订单已确认');
    }

    /**
     * 拆分订单
     * @param int $id
     * @return void
     */
    public function splitStoreOrder(int $id): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->splitStoreOrder();
        $orderDetail->addLog('设置订单已确认');
    }

    /**
     * 设置订单已支付
     * @param int $id
     * @return void
     */
    public function setOrderPaid(int $id): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->setOrderPaid();
        $orderDetail->addLog('设置订单已支付');
    }

    /**
     * 取消订单
     * @param int $id
     * @param int|null $user_id
     * @return void
     * @throws ApiException
     */
    public function cancelOrder(int $id, int $user_id = null): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id)->setUserId($user_id);
        $orderDetail->cancelOrder();
        $orderDetail->addLog('取消订单');
    }

    /**
     * 确认收货
     * @param int $id
     * @param int|null $user_id
     * @return void
     * @throws ApiException
     */
    public function confirmReceipt(int $id, int $user_id = null): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id)->setUserId($user_id);
        $orderDetail->confirmReceipt();
        $orderDetail->addLog('确认收货');
        app(\app\service\admin\salesman\OrderService::class)->triggerAutoSettlement([
            'order_id' => $id
        ]);
    }

    /**
     * 删除订单
     * @param int $id
     * @param int|null $user_id
     * @return void
     */
    public function delOrder(int $id, int $user_id = null): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id)->setUserId($user_id);
        $orderDetail->delOrder();
        $orderDetail->addLog('删除订单');
    }

    /**
     * 修改订单金额
     * @param int $id
     * @param array $data
     * @return void
     */
    public function modifyOrderMoney(int $id, array $data): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->modifyOrderMoney($data);
        $orderDetail->addLog('更新订单金额');
    }

    /**
     * 修改收货人信息
     * @param int $id
     * @param array $data
     * @return void
     */
    public function modifyOrderConsignee(int $id, array $data): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->modifyOrderConsignee($data);
        $orderDetail->addLog('修改订单收货人信息');
    }

    /**
     * 修改配送信息
     * @param int $id
     * @param array $data
     * @return void
     */
    public function modifyOrderShipping(int $id, array $data): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->modifyOrderShipping($data);
        $orderDetail->addLog('修改订单配送信息');
    }

    /**
     * 修改订单商品
     * @param int $id
     * @param array $data
     * @return void
     */
    public function modifyOrderProduct(int $id, array $data): void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->modifyOrderProduct($data);
        $orderDetail->addLog('修改订单商品');
    }

    /**
     * 订单发货
     * @param int $id
     * @param array $deliver_data
     * @param $shipping_method
     * @param $logistics_id
     * @param $tracking_no
     * @param $bill_remark
     * @return void
     * @throws ApiException
     */
    public function deliverOrder(int $id, array $deliver_data, $shipping_method, $logistics_id = 0, $tracking_no = '', $bill_remark = '') :void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->deliverOrder($deliver_data, $shipping_method, $logistics_id, $tracking_no, $bill_remark);
    }

    /**
     * 设置商家备注
     * @param int $id
     * @param string $note
     * @return void
     */
    public function setAdminNote(int $id, string $note) :void
    {
        $orderDetail = app(OrderDetailService::class)->setId($id);
        $orderDetail->setAdminNote($note);
        $orderDetail->addLog('订单商家备注已更新');
    }

    /**
     * 打印订单
     * @param int $id
     * @return array
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getOrderPrintInfo(int $id) :array
    {
        $result = $this->getOrder($id);
        $result = !empty($result) ? $result->toArray() : [];
        unset($result["available_actions"]);
        $result["shop_name"] = Config::get("shop_name");

        $url = isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'http' ? "http://" : "https://";
        $url .= $_SERVER['HTTP_HOST'];
        $result["host"] = $url;
        $result["print_time"] = Time::format();
        return $result;
    }

    /**
     * 打印电子面单
     * @param int $id
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getOrderPrintWaybillInfo(int $id): array
    {
        $model = new LogisticsApiLog();
        $find = $model->where('order_id', $id)
            ->order('id', 'desc')
            ->find();
        if ($find) {
            return $find->toArray();
        } else {
            return [];
        }
    }

    /**
     * 订单导出标签列表
     * @return string[]
     */
    public function getExportItemList(): array
    {
        $export_item_list = [
            "order_sn" => "订单编号",
            "add_time" => "下单时间",
            "order_status_name" => "订单状态",
            "pay_status_name" => "支付状态",
            "shop_title" => "店铺名称",
            "username" => "会员名称",
            "consignee" => "收件人姓名",
            "mobile" => "收件人电话",
            "address" => "收件人地址",
            "country" => "国家",
            "total_amount" => "订单总价",
            "balance" => "使用余额",
            "discount_amount" => "折扣",
            "points_amount" => "积分抵金额",
            "coupon_amount" => "优惠券金额",
            "pay_time" => "支付时间",
            "pay_type_id" => "支付类型",
            "paid_amount" => "支付金额",
            "shipping_time" => "发货时间",
            "shipping_fee" => "运费",
            "logistics_name" => "物流名称",
            "tracking_no" => "发货单号",
            "buyer_note" => "订单备注",
            "admin_note" => "商家备注",
            "product_info" => "商品信息",
            "shipping_status_name" => "发货状态",
            "product_weight" => "总重量(KG)",
            "use_points" => "使用积分",
        ];
        return $export_item_list;
    }

    /**
     * 保存标签的详情
     * @return array
     */
    public function getExportItemInfo(): array
    {
        $item = AdminUser::where("admin_id", request()->adminUid)->value("order_export") ?? [];
        // 获取订单导出标签列表
        $export_info = [];
        $export_list = $this->getExportItemList();
        foreach ($item as $k => $v) {
            if (isset($export_list[$v])) {
                $export_info[$v] = $export_list[$v];
            }
        }
        return $export_info;
    }

    /**
     * 保存订单标签
     * @param array $data
     * @return bool
     */
    public function saveExportItem(array $data): bool
    {
        $result = AdminUser::where("admin_id", request()->adminUid)->save(['order_export' => $data]);
        return $result !== false;
    }

    // 获取订单导出标题
    public function getOrderExportTitle(array $exportItem): array
    {
        // 获取订单标题
        $export_all_list = $this->getExportItemList();
        // 获取要导出的字段
        $export_title = [];
        foreach ($exportItem as $key => $value) {
            if (isset($export_all_list[$value])) {
                $export_title[] = $export_all_list[$value];
                if ($value == 'product_info') {
                    unset($export_title[$key]);
                }
            }
        }
        if (in_array("product_info", $exportItem)) {
            // 商品信息放在最后
            $export_title[] = "商品信息";
        }
        $export_title = array_values($export_title);
        return $export_title;
    }

    /**
     * 组装订单导出数据
     * @param array $exportItem
     * @param array $data
     * @return array
     */
    public function getOrderExportData(array $exportItem, array $data = []): array
    {
        $row = [];
        $product_info = false;
        // 获取要导出的字段
        foreach ($exportItem as $key => $value) {
            if (isset($data[$value])) {
                $row[$value] = $data[$value];
            }
            if ($value == 'address') {
                // 收件人地址
                $row['address'] = $data["user_address"];
            } elseif ($value == 'country') {
                // 国家
                $country = Config::get("region_setting", 'base_display', '', 'default_country');
                $row["country"] = Region::where("region_id", $country)->value("region_name") ?? "";
            } elseif ($value == 'product_weight') {
                //总重量
                $row["product_weight"] = 0;
                if (!empty($data["items"])) {
                    foreach ($data["items"] as $item) {
                        $row["product_weight"] += $item["product_weight"];
                    }
                }
            } elseif ($value == "product_info") {
                // 商品信息
                unset($exportItem[$key]);
                $product_info = true;
            }

        }
        if ($product_info) {
            $row["product_info"] = "";
            foreach ($data["items"] as $k => $item) {
                $product_info = [
                    $item["product_name"], // 商品名称
                    $item["sku_value"], // 商品属性
                    $item["product_sn"], // 商品编号
                    $item["quantity"], // 购买数量
                    $item["price"], // 购买价格
                    $item["price"] * $item["quantity"], // 小计
                ];
                $row["product_info"] .= implode(" | ", $product_info) . "\r\n";
            }

        }
        // 重置下标
        $row = array_values($row);
        return $row;
    }

    /**
     * 订单导出
     * @param array $data
     * @param array $exportItem
     * @return bool
     */
    public function orderExport(array $data, array $exportItem): bool
    {
        $export_title = $this->getOrderExportTitle($exportItem);
        // 组装导出数据
        $export_data = [];
        foreach ($data as $k => $v) {
            $export_data[] = $this->getOrderExportData($exportItem, $v);
        }
        $file_name = "订单导出" . Time::getCurrentDatetime("Ymd") . rand(1000, 9999);
        Excel::export($export_title, $file_name, $export_data);
        return true;
    }

    /**
     * 获取支付订单人数
     * @param array $data
     * @param int $shopId
     * @return mixed
     */
    public function getPayOrderUserTotal(array $data, int $shopId = 0): mixed
    {
        return $this->filterQuery([
            'pay_time' => $data,
            'pay_status' => Order::PAYMENT_PAID,
            'shop_id' => $shopId
        ])->group("user_id")->count();
    }

    /**
     * 获取下单件数
     * @param array $data
     * @return float
     */
    public function getOrderTotal(array $data, int $shopId = 0): float
    {
        return OrderItem::hasWhere("orders", function ($query) use ($data) {
            $query->where('pay_status', Order::PAYMENT_PAID)->PayTime($data)->where("is_del", 0);
        })
            ->where(function ($query) use ($shopId) {
                if ($shopId) {
                    $query->where("OrderItem.shop_id", $shopId);
                }
            })->sum("OrderItem.quantity");
    }

    /**
     * 获取商品支付金额统计
     * @param array $data
     * @return float
     */
    public function getPayMoneyTotal(array $data, int $shopId = 0): float
    {
        return $this->filterQuery([
            'pay_time' => $data,
            'shop_id' => $shopId,
            'pay_status' => Order::PAYMENT_PAID
        ])->sum('total_amount');
    }

    /**
     * 获取商品支付金额统计
     * @param array $data
     * @param int $shopId
     * @return float|int
     */
    public function getPayBalanceTotal(array $data, int $shopId = 0): float|int
    {
        return $this->filterQuery([
            'pay_time' => $data,
            'shop_id' => $shopId,
            'order_status' => [Order::ORDER_CONFIRMED, Order::ORDER_PROCESSING, Order::ORDER_COMPLETED]
        ])->sum('balance');
    }

    /**
     * 获取订单金额
     * @param array $data
     * @param int $shopId
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getPayMoneyList(array $data, int $shopId = 0): array
    {
        return $this->filterQuery([
            'pay_time' => $data,
            'shop_id' => $shopId,
            'pay_status' => Order::PAYMENT_PAID
        ])
            ->field('total_amount,pay_time')
            ->select()->toArray();
    }

    /**
     * 各类型下订单数量
     * @param int $user_id
     * @return array
     */
    public function getOrderQuantity(int $user_id): array
    {
        $result = [];
        $result['await_pay'] = Order::where('user_id', $user_id)->awaitPay()->where("is_del", 0)->count();
        $result['await_shipping'] = Order::where('user_id', $user_id)->awaitShip()->where("is_del", 0)->count();
        $result['await_received'] = Order::where('user_id', $user_id)->awaitReceived()->where("is_del", 0)->count();
        $result['await_comment'] = Order::where('user_id', $user_id)->awaitComment()->where("is_del", 0)->count();
        $result['order_completed'] = Order::where('user_id', $user_id)->Completed()->where("is_del", 0)->count();
        $result['product_collect'] = \app\model\user\CollectProduct::where('user_id', $user_id)->count();
        $result['shop_collect'] = \app\model\user\CollectShop::where('user_id', $user_id)->count();
        return $result;
    }

    /**
     * 获得订单物流信息
     * @param int $order_id
     * @return mixed
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getOrderShipping(int $order_id): mixed
    {
        $url = config('tigshop.api_shipping_url');
        $order_info = Order::find($order_id);
        if (empty($order_info['tracking_no'])) {
            return [];
        }
        $logistics = LogisticsCompany::where('logistics_id', $order_info['logistics_id'])->find();
        $param = [
            'apiKey' => Config::get('api_key'),
            'code' => $logistics['api_logistics_code'] ?? $logistics['logistics_code'],
            'number' => $order_info['tracking_no'] ?? '',
        ];
        $p_url = $url . http_build_query($param);
        $data = Http::post($p_url);
        $res_arr = json_decode($data, true);
        if ($res_arr['error']) {
            return [];
        }
        //@todo 按逻辑加入缓存
        return !empty($res_arr['content']) ? $res_arr['content'] : [];

    }

    /**
     * 再次购买
     * @param int $order_id
     * @param int $user_id
     * @return bool
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function buyAgain(int $order_id, int $user_id): bool
    {
        $itemList = OrderItem::where('order_id', $order_id)->field(['sku_id', 'product_id', 'quantity'])->select();
        if (empty($itemList)) {
            throw new ApiException(Util::lang('订单不存在！'));
        }
        $cartService = new CartService();
        $cartService->is_checked($user_id, 0);
        foreach ($itemList as $item) {
            $return = $cartService->addToCart($item['product_id'], $item['quantity'], $item['sku_id']);
            if (!$return) {
                throw new ApiException(Util::lang('再次购买失败！'));
            }
        }
        return true;
    }

    /**
     * 多个订单详情
     * @param array $ids
     * @return object|Order[]|array|\think\Collection
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getSeveralDetail(array $ids,int $suppliers_id = 0): object
    {
        $result = Order::whereIn('order_id', $ids)->with(['items'])
            ->field("order_id,order_sn,order_status,shipping_status,pay_status")
            ->select();
        if ($result->isEmpty()) {
            throw new ApiException("请选择有效订单");
        }
		if ($suppliers_id) {
			foreach ($result as $value) {
				foreach ($value->items as $key => $item) {
					if ($item->suppliers_id != $suppliers_id) {
						unset($value->items[$key]);
					}
				}
				// 重置下标
				$value->items = $value->items->values();
			}
		}
        return $result;
    }


    /**
     * 批量操作
     * @param int $order_id
     * @param string $type
     * @param array $data
     * @return void
     * @throws ApiException
     */
    public function batchOperation(int $order_id, string $type, array $data = []): void
    {
        switch ($type) {
            case "deliver":
                // 批量发货
                if (empty($data) || empty($data['deliver_data'])) {
                    throw new ApiException("请选择发货信息");
                }

                $order = Order::with(['items', 'user'])->append(['order_status_name', "user_address", "shipping_status_name", "pay_status_name", "total_product_weight"])->find($order_id);
                if ($order['order_status'] != Order::ORDER_CONFIRMED) {
                    throw new ApiException("订单编号为【{$order['order_sn']}】:订单状态错误");
                }

                $deliver_data = [];
                $tracking_no = "";
                foreach ($data['deliver_data'] as $key => $deliver) {
                    if ($deliver['id'] == $order_id) {
                        $deliver_data = $deliver['deliver_info'];
                        $tracking_no = $deliver['tracking_no'];
                    }
                }
                $orderDetail = app(OrderDetailService::class)->setOrder($order);
                $orderDetail->deliverOrder($deliver_data, $data['shipping_method'], $data['logistics_id'], $tracking_no);
                break;
        }
    }

    /**
     * 批量打印订单
     * @param array $ids
     * @return object|Order[]|array|\think\Collection
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function printSeveral(array $ids): object
    {
        if (empty($ids)) {
            throw new ApiException("请选择订单");
        }
        $orders = Order::with(['user', 'items', 'shop'])
            ->whereIn("order_id", $ids)
            ->field("order_id,order_sn,user_id,add_time,pay_type_id,pay_time,shipping_time,logistics_name,tracking_no,consignee,mobile,region_names,address,
			total_amount,shipping_fee,service_fee,discount_amount,balance,product_amount,points_amount,coupon_amount,order_source,shop_id")
            ->append(['user_address', 'pay_type_name'])
            ->select();

        $shop_name = Config::get("shop_name");
        $url = isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'http' ? "http://" : "https://";
        $url .= $_SERVER['HTTP_HOST'];
        $host = $url;
        foreach ($orders as $order) {
            if (!empty($order->items)) {
                foreach ($order->items as $item) {
                    $item->subtotal = $item->price * $item->quantity;
                }
            }
            $order->shop_name = $shop_name;
            $order->host = $host;
            $order->print_time = Time::format();
        }
        return $orders;
    }

    /**
     * 根据订单金额赠送积分
     * @param $orderMoney
     * @param $userId
     * @return void
     */
    public function orderSuccessPoint($orderMoney, $userId, $orderId)
    {
        $points = $this->getOrderSendPoint($orderMoney);
        if ($points) {
            $points = ceil($points * $orderMoney);

            $ranks_list = app(UserRankService::class)->getUserRankList();
            $user_rank_id = app(UserService::class)->getUserRankId($userId);
            $rankPoint = 1;
            foreach ($ranks_list as $key => $value) {
                if ($value['rank_id'] == $user_rank_id) {
                    $rankPoint = $value['rank_point'];
                }
            }
            $points = ceil($points * $rankPoint);
            app(UserService::class)->incPoints($points, $userId, '下单送积分', 1, $orderId);
        }
    }

    /**
     * 获得下单送积分数量
     * @return void
     */
    public function getOrderSendPoint($orderMoney)
    {
        $order_send_point = Config::get('points_setting', 'base_shopping', '', 'order_send_point');
        $points = 0;
        if ($order_send_point > 0) {
            $points = ceil($order_send_point * $orderMoney);
        }
        return $points;
    }




}
