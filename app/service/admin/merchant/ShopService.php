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

use app\adminapi\controller\order\Aftersales;
use app\job\order\OrderSettlementJob;
use app\model\merchant\AdminUserShop;
use app\model\merchant\Shop;
use app\model\order\Order;
use app\service\admin\authority\AdminRoleService;
use app\service\admin\decorate\DecorateService;
use app\service\admin\order\OrderConfigService;
use app\service\admin\product\ProductService;
use app\service\admin\setting\ShippingTplService;
use app\service\common\BaseService;
use exceptions\ApiException;
use log\AdminLog;
use utils\Config;
use utils\TigQueue;
use utils\Util;

/**
 * 店铺服务类
 */
class ShopService extends BaseService
{

    public function __construct(Shop $shopModel)
    {
        $this->model = $shopModel;
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

        if (isset($filter['keyword']) && !empty($filter['keyword'])) {
            $query->where('shop_title', 'like', '%' . $filter['keyword'] . '%');
        }
        if (isset($filter['shop_ids']) && !empty($filter['shop_ids'])) {
            $query->whereIn('shop_id', $filter['shop_ids']);
        }

        if (isset($filter['shop_id']) && $filter['shop_id'] > 0) {
            $query->where('shop_id', $filter['shop_id']);
        }

        if (isset($filter['merchant_id']) && $filter['merchant_id'] > -1) {
            $query->where('merchant_id', $filter['merchant_id']);
        }

        if (isset($filter['status']) && !empty($filter['status'])) {
            $query->where('status', $filter['status']);
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }

        return $query;
    }


    /**
     * 获取详情
     *
     * @param int $id
     * @return array
     * @throws ApiException
     */
    public function getDetail(int $id): array
    {
        $result = $this->model->with(['merchant' => function ($query) {
            $query->hidden(['base_data','shop_data']);
        }, 'adminUserShop'])->where('shop_id', $id)->find();

        return $result ? $result->toArray() : [];
    }

    /**
     * 获取员工展示信息
     * @param int $id
     * @return array
     */
    public function getStaffShow(int $id):array
    {
        // 已有员工数
        $total_using_user = AdminUserShop::where(['is_using' => 0,"shop_id" => $id])->count();
        // 子管理员数
        $sub_using_user = AdminUserShop::where(['is_using' => 0,"shop_id" => $id,'is_admin' => 0])->count();

        // 停用员工数
        $stop_using_user = AdminUserShop::where(['is_using' => 1,"shop_id" => $id])->count();
        // 剩余可用名额
        $max_users = Config::get("maxSubAdministrator");
        $residue = $max_users > 0 ? $max_users - $sub_using_user : 0;

        // 获取店铺对应的管理员
        $admin_ids = AdminUserShop::where(['shop_id' => $id])->column('admin_id');
        // 员工操作日志
        $admin_log = \app\model\authority\AdminLog::with(['admin_user'])->whereIn('user_id',$admin_ids)
            ->order('log_id','desc')->limit(5)->select()->toArray();

        return [
            'using_user' => $total_using_user,
            'stop_using_user' => $stop_using_user,
            'residue' => $residue,
            'admin_log' => $admin_log,
        ];
    }

    /**
     * 获取所有店铺,用于select选择
     *
     * @return array
     * @throws ApiException
     */
    public function getAllShop(): array
    {
        $result = $this->model->field('shop_id,shop_title')->select();
        return $result->toArray();
    }

    /**
     * 获取名称
     *
     * @param int $id
     * @return string|null
     */
    public function getName(int $id): ?string
    {
        return $this->model->where('shop_id', $id)->value('shop_title');
    }

    /**
     * 创建店铺
     * @param array $data
     * @return Shop|\think\Model
     */
    public function create(array $data): Shop|\think\Model
    {
        //判断店铺名称是否重复
        if ($this->model->where('shop_title', $data['shop_title'])->count() > 0) {
            throw new ApiException(Util::lang('店铺名称重复'));
        }
        $result = $this->model->create($data);
        //后台添加店铺更新绑定的商户里面的shop_data
        if(isset($data['merchant_id'])){
            app(MerchantService::class)->updateShopDataByCreateShop($data['merchant_id'], $result->shop_id);
        }
        $this->initData($result->shop_id,$result->merchant_id);
        return $result;
    }
    /**
     * 执行店铺添加或更新
     *
     * @param int $id
     * @param array $data
     * @param bool $isAdd
     * @return \think\Model|Shop
     * @throws ApiException
     */
    public function updateShop(int $id, array $data, bool $isAdd = false): Shop|bool
    {
        if ($isAdd) {
            if ($data['merchant_id'] > 0) {
                // 单个商户最大店铺数限制
                $max_shop = Config::get("maxShopCount");
                $use_merchant = Shop::where('merchant_id', $data['merchant_id'])->count();
                if ($max_shop > 0 && $use_merchant >= $max_shop) {
                    //todo 翻译：java包了语言： "商户店铺数已达上限,上限为%d个,如需修改,请前往配置"
                    throw new ApiException("商户店铺数已达上限,上限为{$max_shop}个,如需修改,请前往配置");
                }
            }
            return $this->create($data);
        } else {
            if (!$id) {
                throw new ApiException('#id错误');
            }
            $result = $this->model->where('shop_id', $id)->save($data);
            return $result !== false;
        }
    }

    public function checkShopTitle($title)
    {
        $result = $this->model->where('shop_title', $title)->count();
        return $result > 0;
    }

    /**
     * 更新单个字段
     *
     * @param int $id
     * @param array $data
     * @return int|bool
     * @throws ApiException
     */
    public function updateShopField(int $id, array $data): bool|int
    {
        $result = $this->model::where('shop_id', $id)->save($data);
        return $result !== false;
    }

    /**
     * 删除店铺
     *
     * @param int $id
     * @return bool
     */
    public function deleteShop(int $id): bool
    {
        if (!$id) {
            throw new ApiException('#id错误');
        }
        $get_name = $this->getName($id);
        $result = $this->model->destroy($id);

        if ($result) {
            AdminLog::add('删除店铺:' . $get_name);
        }

        return $result !== false;
    }

    /**
     * 初始化店铺数据
     *
     * @param int $shopId
     * @param int $merchantId
     */
    private function initData(int $shopId,int $merchantId): void
    {
        //初始化运费模板
        $shippingTpl = [
            'shipping_time' => '1天内',
            'shipping_tpl_name' => '默认模板',
            'is_free' => 0,
            'pricing_type' => 1,
            'is_default' => 1,
            'shop_id' => $shopId,
            'shipping_tpl_info' => [
                [
                'shipping_type_id' => 1,
                'is_free' => 0,
                'is_default' => 1,
                    'is_checked' => 1,
                    'default_tpl_info' => [],
                    'area_tpl_info' => [],
                'region_data' => ['area_regions'=>[],'area_region_names'=>[]],
                'start_number' => 1,
                'start_price' => 1,
                'add_number' => 1,
                'add_price' => 1,
                'free_price' => 0,
                    'pricing_type' => 1
                ]
            ]
        ];
        app(ShippingTplService::class)->createShippingTpl($shippingTpl);

        //初始化模板
        $decorate = [
            'decorate_title' => '默认模板',
            'data' => '{"pageModule":{"type":"page","module":[],"backgroundRepeat":"","backgroundSize":"","style":0,"title":"","titleColor":"","headerStyle":1,"titleBackgroundColor":"","backgroundImage":{"picUrl":"","picThumb":""},"backgroundColor":""},"moduleList":[{"type":"shopInfo","url":"mobilePromotion","label":"\u5e97\u94fa\u4fe1\u606f","module":{"customPic":{"picUrl":"","picThumb":""},"backgroundDefault":1,"style":1,"frame":{"textColor":"","itemBackgroundColor":"","backgroundColor":"#ffffff","innerPadding":0,"itemHeight":35,"itemRadius":3,"boxRadius":0,"boxPadding":10,"boxPaddingTop":5,"boxPaddingBottom":5}},"isShow":true,"moduleIndex":1747214062755},{"type":"product","url":"mobile","label":"\u5546\u54c1","module":{"style":1,"goodsStyle":1,"goodsRadioStyle":1,"textAlign":1,"textWeight":1,"goodsNameRow":2,"goodsNamePadding":1,"showName":1,"showBrief":1,"showPrice":1,"goodsPadding":5,"buyBtnStyle":1,"backgroundColor":"","boxRadius":0,"innerPadding":0,"boxPadding":10,"boxPaddingTop":5,"boxPaddingBottom":5,"imgPadding":1,"waterfall":0,"swiperPageColor":"","frame":{"textColor":"","itemBackgroundColor":"","backgroundColor":"#ffffff","innerPadding":0,"itemHeight":35,"itemRadius":3,"boxRadius":0,"boxPadding":10,"boxPaddingTop":5,"boxPaddingBottom":5},"title":{"showTitle":0,"titleStyle":1,"titleAlign":1,"titleBackground":"","titleBackground2":"","titleBackgroundPic":{"picUrl":"","picThumb":""},"titleRadius":0,"titleText":"\u6807\u9898\u5185\u5bb9","titleColor":"","descText":"\u63cf\u8ff0\u5185\u5bb9","descColor":"#aaaaaa","showMore":0,"moreLink":[],"moreColor":"#aaaaaa","format":{"titleBackground":"","titleRadius":""}},"products":{"productSelectType":1,"productIds":[],"productCategoryId":[],"productNumber":0,"productTag":""}},"isShow":true,"moduleIndex":1747214064724}]}',
            'draft_data' => '{"pageModule":{"type":"page","module":[],"backgroundRepeat":"","backgroundSize":"","style":0,"title":"","titleColor":"","headerStyle":1,"titleBackgroundColor":"","backgroundImage":{"picUrl":"","picThumb":""},"backgroundColor":""},"moduleList":[{"type":"shopInfo","url":"mobilePromotion","label":"\u5e97\u94fa\u4fe1\u606f","module":{"customPic":{"picUrl":"","picThumb":""},"backgroundDefault":1,"style":1,"frame":{"textColor":"","itemBackgroundColor":"","backgroundColor":"#ffffff","innerPadding":0,"itemHeight":35,"itemRadius":3,"boxRadius":0,"boxPadding":10,"boxPaddingTop":5,"boxPaddingBottom":5}},"isShow":true,"moduleIndex":1747214062755},{"type":"product","url":"mobile","label":"\u5546\u54c1","module":{"style":1,"goodsStyle":1,"goodsRadioStyle":1,"textAlign":1,"textWeight":1,"goodsNameRow":2,"goodsNamePadding":1,"showName":1,"showBrief":1,"showPrice":1,"goodsPadding":5,"buyBtnStyle":1,"backgroundColor":"","boxRadius":0,"innerPadding":0,"boxPadding":10,"boxPaddingTop":5,"boxPaddingBottom":5,"imgPadding":1,"waterfall":0,"swiperPageColor":"","frame":{"textColor":"","itemBackgroundColor":"","backgroundColor":"#ffffff","innerPadding":0,"itemHeight":35,"itemRadius":3,"boxRadius":0,"boxPadding":10,"boxPaddingTop":5,"boxPaddingBottom":5},"title":{"showTitle":0,"titleStyle":1,"titleAlign":1,"titleBackground":"","titleBackground2":"","titleBackgroundPic":{"picUrl":"","picThumb":""},"titleRadius":0,"titleText":"\u6807\u9898\u5185\u5bb9","titleColor":"","descText":"\u63cf\u8ff0\u5185\u5bb9","descColor":"#aaaaaa","showMore":0,"moreLink":[],"moreColor":"#aaaaaa","format":{"titleBackground":"","titleRadius":""}},"products":{"productSelectType":1,"productIds":[],"productCategoryId":[],"productNumber":0,"productTag":""}},"isShow":true,"moduleIndex":1747214064724}]}',
            'decorate_type' => 1,
            'is_home' => 1,
            'shop_id' => $shopId,
            'status' => 1,
            'update_time' => time()
        ];
        app(DecorateService::class)->createDecorate($decorate);

        //初始化角色
        app(AdminRoleService::class)->initMerchantRole($merchantId);

        //初始化商品
        //app(ProductService::class)->initNewShopData($shopId);
    }

    /**
     * 自动结算订单且计入店铺资金
     * @param array $data
     * @return bool
     */
    public function autoShopAccountByOrder(array $data): bool
    {
        $order = Order::find($data['order_id']);
        $amount = $order->paid_amount;
        $refund_amount = \app\model\order\Aftersales::where('order_id', $order->order_id)->whereIn('status', [
            \app\model\order\Aftersales::STATUS_COMPLETE
        ])->sum('refund_amount');
        try {
            if ($order->is_settlement == 0) {
                // 未结算
                $order->save(['is_settlement' => 1]);
                $amount = $amount - $refund_amount;
                $shop_data = [
                    'shop_id' => $order->shop_id,
                    "amount" => $amount
                ];
                // 店铺资金变化
                $shop = app(ShopAccountLogService::class)->changeShopAccount($shop_data,4);
                $new_shop_money = bcadd($shop['shop_money'], $amount, 2);
                app(\app\service\admin\merchant\ShopAccountLogService::class)->create(
                    [
                        'shop_money' => $amount,
                        'frozen_money' => $shop['frozen_money'],
                        'new_shop_money' => $new_shop_money,
                        'new_frozen_money' => $shop['frozen_money'],
                        'shop_id' => $data['shop_id'],
                        'type' => 1,
                    ]
                );
            }
        } catch (\Exception $e) {

        }
        return true;
    }

    /**
     * 确定收货触发订单结算并修改店铺资金
     * @param array $data
     * @return void
     */
    public function triggerAutoOrderSettlement(array $data):void
    {
        $order_config = app(OrderConfigService::class)->getDetail("order_config",$data['shop_id']);
        if (!empty($order_config)) {
            $job_day = $order_config['date_type'] > 0 ? $order_config['use_day'] : 0;
            app(TigQueue::class)->later(OrderSettlementJob::class, $job_day * 24 * 3600, $data);
        } else {
            //没有配置改完延时一秒后立即执行
            app(TigQueue::class)->later(OrderSettlementJob::class, 0, $data);
        }
    }


    /**
     * 检测店铺状态
     * @param int $shop_id
     * @return bool
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
        public function checkShopStatus(int $shop_id, string $product_name): bool
    {
        if(empty($shop_id)){
            return false;
        }
        $shop_status = Shop::where('shop_id',$shop_id)->value('status');
        //后面可添加其他状态
        if(in_array($shop_status, [SHOP::STATUS_CLOSE])){
            throw new ApiException(Util::lang('商品：%s 所属的店铺暂停营业中，请联系平台处理！','', [$product_name]));
        }
        return true;
    }

    /**
     * 获取店铺列表
     * @return Shop[]|array|\think\Collection
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getShopList()
    {
        return Shop::where('status',1)->select()->toArray();
    }
}
