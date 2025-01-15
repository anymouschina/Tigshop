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
        }])->where('shop_id', $id)->find();

        if (!$result) {
            throw new ApiException(Util::lang('店铺不存在'));
        }

        return $result->toArray();
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
        $max_users = Config::get("max_sub_administrator",'shop');
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
        $result = $this->model->create($data);
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
                $max_shop = Config::get("max_shop_count",'merchant');
                $use_merchant = Shop::where('merchant_id', $data['merchant_id'])->count();
                if ($max_shop > 0 && $use_merchant >= $max_shop) {
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
            'data' => '{"pageModule":{"type":"page","module":[],"background_repeat":"","background_size":"","style":0,"title":"","title_color":"","title_background_color":"","background_image":{"pic_url":"","pic_thumb":""},"background_color":""},"moduleList":[{"type":"shop_info","label":"\u5e97\u94fa\u4fe1\u606f","content":"<i class=\"ico-decorate icon-dec-dianpu\"><\/i>","module":{"custom_pic":{"pic_url":"img\/gallery\/202406\/1718179284stLEJAe74L3iUwmkMW.jpeg","pic_thumb":"img\/gallery\/202406\/1718179284stLEJAe74L3iUwmkMW.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_id":1041,"pic_name":"1688012167FhGKYkR99ZkLB6a8ZEpic200x200"},"background_default":0,"style":1,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true},{"type":"notice","label":"\u516c\u544a","module":{"text":"\u516c\u544a\u5185\u5bb9\u5185\u5bb9\u5185\u5bb9","ico_pic":{"pic_url":"img\/gallery\/202406\/1718241122hZiLqFBzgB0nzTrz09.jpeg","pic_thumb":"img\/gallery\/202406\/1718241122hZiLqFBzgB0nzTrz09.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_id":1052,"pic_name":"1687857585PUWPIq3otyfgAdLZ2epic"},"frame":{"text_color":"rgba(176, 34, 34, 1)","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true,"module_index":1718934867947},{"type":"coupon","label":"\u4f18\u60e0\u5238","module":{"show_title":1,"title":"\u6bcf\u65e5\u9886\u5238","desc":"\u5929\u5929\u4f18\u60e0\u9886\u4e0d\u505c","color_style":2,"item_background_color":"#ffffff","background_color":"#ffffff","item_padding":10,"box_radius":8,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true,"module_index":1718934917078},{"type":"image_square_ad","label":"\u6a21\u5757\u56fe\u7247","module":{"pic_type":4,"pic_list":[{"pic_id":1063,"pic_thumb":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg","pic_name":"1688012604vTVgkQcOcuYKDeLgPCpic"},{"pic_id":1062,"pic_thumb":"img\/gallery\/202406\/1718242354yP1VFVsjrGkneGGxCZ.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242354yP1VFVsjrGkneGGxCZ.jpeg","pic_name":"1688012603iSi4hra7qcyaaTtsakpic"},{"pic_id":1061,"pic_thumb":"img\/gallery\/202406\/1718242339y0b21Pcsvh7jhFgWgE.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242339y0b21Pcsvh7jhFgWgE.jpeg","pic_name":"1688012512WLy0kBm6O2H7UY8Hqdpic"},{"pic_id":1060,"pic_thumb":"img\/gallery\/202406\/1718242335BxrwDMO63T7KS8CivH.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242335BxrwDMO63T7KS8CivH.jpeg","pic_name":"1688012512RlPtRimywv0iBO8uXUpic"}],"swiper_pre_view":1,"swiper_page_color":"","img_padding":4,"pic_page_type":1,"pic_radio_style":1,"is_flux_width":0,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":4,"item_height":35,"item_radius":3,"box_radius":4,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":0,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1718934463999},{"type":"image_ad","label":"\u56fe\u7247\u5e7f\u544a","module":{"pic_type":2,"pic_list":[{"pic_id":1062,"pic_thumb":"img\/gallery\/202406\/1718242354yP1VFVsjrGkneGGxCZ.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242354yP1VFVsjrGkneGGxCZ.jpeg","pic_name":"1688012603iSi4hra7qcyaaTtsakpic"},{"pic_id":1063,"pic_thumb":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg","pic_name":"1688012604vTVgkQcOcuYKDeLgPCpic"}],"swiper_pre_view":1,"swiper_page_color":"","img_padding":0,"pic_page_type":1,"pic_radio_style":1,"is_flux_width":0,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":0,"box_padding_top":0,"box_padding_bottom":0},"title":{"show_title":0,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1718241316276},{"type":"image_hotarea","label":"\u70ed\u56fe\u7ed8\u5236","module":{"pic_list":[{"pic_id":1061,"pic_thumb":"img\/gallery\/202406\/1718242339y0b21Pcsvh7jhFgWgE.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242339y0b21Pcsvh7jhFgWgE.jpeg","pic_name":"1688012512WLy0kBm6O2H7UY8Hqdpic"},{"pic_id":1060,"pic_thumb":"img\/gallery\/202406\/1718242335BxrwDMO63T7KS8CivH.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242335BxrwDMO63T7KS8CivH.jpeg","pic_name":"1688012512RlPtRimywv0iBO8uXUpic"},{"pic_id":1059,"pic_thumb":"img\/gallery\/202406\/1718242329qWyZJZA844uDL7Px5f.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242329qWyZJZA844uDL7Px5f.jpeg","pic_name":"1688012513UtCriEIr8ViNvi1wB1pic"}],"img_padding":0,"pic_radio_style":1,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":0,"box_padding_top":0,"box_padding_bottom":0},"title":{"show_title":0,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1718241540475},{"type":"product","label":"\u5546\u54c1","module":{"style":2,"goods_style":1,"goods_radio_style":1,"text_align":1,"text_weight":1,"goods_name_row":2,"goods_name_padding":1,"show_name":1,"show_brief":1,"show_price":1,"goods_padding":5,"buy_btn_style":1,"background_color":"","box_radius":0,"inner_padding":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5,"img_padding":1,"waterfall":0,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":0,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}},"products":{"product_select_type":1,"product_ids":[],"product_category_id":[],"product_number":0,"product_tag":""}},"is_show":true,"module_index":1718934618602},{"type":"white_line","label":"\u5206\u5272\u7ebf","content":"<i class=\"ico-decorate icon-dec-fengexian\"><\/i>","module":{"line_type":2,"line_style":3,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true},{"type":"white_blank","label":"\u7a7a\u767d\u8f85\u52a9","content":"<i class=\"ico-decorate icon-dec-kongbaifenge\"><\/i>","module":{"background_color":"rgba(26, 190, 56, 1)","blank_height":67},"is_show":true},{"type":"image_nav","label":"\u56fe\u6587\u5bfc\u822a","content":"<i class=\"ico-decorate icon-dec-tuwendaohang2\"><\/i>","module":{"nav_type":1,"nav_style":1,"row_num":3,"col_num":3,"pic_list":[{"pic_id":1063,"pic_thumb":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg","pic_name":"1688012604vTVgkQcOcuYKDeLgPCpic","pic_title":"\u6807\u98981"},{"pic_id":1060,"pic_thumb":"img\/gallery\/202406\/1718242335BxrwDMO63T7KS8CivH.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242335BxrwDMO63T7KS8CivH.jpeg","pic_name":"1688012512RlPtRimywv0iBO8uXUpic","pic_title":"\u6807\u98982"},{"pic_id":1063,"pic_thumb":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/17182427771ZyQly3Aor4J7SsZwG.jpeg","pic_name":"1688012604vTVgkQcOcuYKDeLgPCpic","pic_title":"\u6807\u98983"},{"pic_id":1061,"pic_thumb":"img\/gallery\/202406\/1718242339y0b21Pcsvh7jhFgWgE.jpeg?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/1718242339y0b21Pcsvh7jhFgWgE.jpeg","pic_name":"1688012512WLy0kBm6O2H7UY8Hqdpic","pic_title":"4"},{"pic_id":1064,"pic_thumb":"img\/gallery\/202406\/17188719519YNCCWHh4kOq6TbZUW.png?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202406\/17188719519YNCCWHh4kOq6TbZUW.png","pic_name":"\u672a\u547d\u540d9_\u4fee\u590d\u540e","pic_title":"5"}],"img_padding":8,"radio_style":1,"pic_page_type":1,"swiper_page_color":"","frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true},{"type":"title_ad","label":"\u6587\u672c\u6807\u9898","content":"<i class=\"ico-decorate icon-dec-biaotiwenben1\"><\/i>","module":{"frame":{"text_color":"","item_background_color":"","background_color":"rgba(254, 225, 98, 1)","inner_padding":20,"item_height":35,"item_radius":3,"box_radius":13,"box_padding":16,"box_padding_top":10,"box_padding_bottom":15},"title":{"show_title":0,"title_style":2,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":20,"title_text":"\u5927\u6807\u9898","title_color":"rgba(20, 13, 145, 1)","desc_text":"\u5c0f\u6807\u9898","desc_color":"rgba(14, 121, 197, 1)","show_more":1,"more_link":[],"more_color":"rgba(191, 20, 20, 1)","format":{"title_background":"","title_radius":""}}},"is_show":true}]}',
            'draft_data' => '{"pageModule":{"type":"page","module":[],"background_repeat":1,"background_size":1,"style":0,"title":"tig-shop","title_color":"","title_background_color":"","background_image":{"pic_url":"","pic_thumb":""},"background_color":"","active":true},"moduleList":[{"type":"cat_nav","label":"\u5206\u7c7b\u5bfc\u822a","content":"<i class=\"ico-decorate icon-dec-biaoge\"><\/i>","module":{"nav_background_pic":{"pic_url":"img\/gallery\/202309\/1694130851obc3cYPuspJphuZiqs!!pic.jpeg","pic_thumb":"img\/gallery\/202309\/1694130851obc3cYPuspJphuZiqs!!pic.jpeg?x-oss-process=image\/resize,m_fill,h_200,w_200","pic_id":903,"pic_name":"1a29134e893ce63c!400x400_big"},"logo_pic":{"pic_url":"img\/gallery\/202304\/16808586274pCSCnxSLF1ktz2Lks!!pic.png","pic_thumb":"img\/gallery\/202304\/16808586274pCSCnxSLF1ktz2Lks!!pic200x200.png","pic_id":746,"pic_name":"logo\u767d\u5e95"},"item_width":15,"text_color":"rgba(255, 255, 255, 1)","background_color":"rgba(102, 140, 241, 1)","item_background_color":"rgba(255, 255, 255, 1)","search_text_color":"rgba(85, 85, 85, 1)","is_ganged":1,"logo_height":45,"search_text":"\u641c\u7d22\u5546\u54c1","box_padding":10,"item_radius":25,"box_padding_top":7,"box_padding_bottom":5,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true,"active":false},{"type":"image_hotarea","label":"\u70ed\u56fe\u7ed8\u5236","content":"<i class=\"ico-decorate icon-dec-fuzhufenge-1\"><\/i>","module":{"pic_list":[{"pic_id":976,"pic_thumb":"img\/gallery\/202403\/1710831076EFzJzBD8esL5x908Ub.png?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202403\/1710831076EFzJzBD8esL5x908Ub.png","pic_name":"1681725616luEsQskUCtK24EzWvGpic","hotarea":[{"height":113,"width":157,"left":11,"top":131,"link":{"path":"product","label":"\u5546\u54c1","id":394,"sn":"SN0000394","name":"\u6d4b\u8bd5\u79ef\u5206\u5546\u54c1"},"position":"width:117.75px;height:84.75px;top:98.25px;left:8.25px"}]},{"pic_id":1017,"pic_thumb":"img\/gallery\/202404\/1713253936yf22l6HtrMcdprOrCW.png?x-oss-process=image\/resize,m_pad,h_200,h_200","pic_url":"img\/gallery\/202404\/1713253936yf22l6HtrMcdprOrCW.png","pic_name":"debc4a230f8142d9ad2c81d3ea5370f1.pngtplv-0es2k971ck-image","hotarea":[{"height":222,"width":182,"left":125,"top":98,"position":"width:136.5px;height:166.5px;top:73.5px;left:93.75px"}]}],"img_padding":0,"pic_radio_style":1,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":5,"box_padding":0,"box_padding_top":0,"box_padding_bottom":0},"title":{"show_title":0,"title_style":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"active":false},{"type":"image_ad","label":"\u56fe\u7247\u5e7f\u544a","module":{"pic_type":1,"pic_list":[{"pic_id":725,"pic_thumb":"img\/gallery\/demo\/1680749910f0SFaCVSOjg0UdQGCw!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680749910f0SFaCVSOjg0UdQGCw!!pic.png","pic_name":"1653978833FsCKZHoVZiFGw8BKrh!!pic"}],"swiper_pre_view":1,"swiper_page_color":"","img_padding":0,"pic_page_type":1,"radio_style":1,"is_flux_width":0,"background_color":"","inner_padding":0,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5,"title_background":"","title_color":"","desc_color":"","more_color":"","show_title":0,"title_style":1,"title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","desc_text":"\u63cf\u8ff0\u5185\u5bb9","show_more":0,"more_link":[],"pic_radio_style":1,"frame":{"background_color":"","inner_padding":0,"box_radius":6,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":0,"title_style":1,"title_background":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1703741198198,"active":false},{"type":"image_nav","label":"\u56fe\u6587\u5bfc\u822a","content":"<i class=\"ico-decorate icon-dec-tuwendaohang2\"><\/i>","module":{"nav_type":1,"nav_style":1,"row_num":6,"col_num":1,"pic_list":[{"pic_id":7577,"pic_thumb":"img\/gallery\/202403\/1710898590Mchf0j0im66cmNodKj.jpeg?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202403\/1710898590Mchf0j0im66cmNodKj.jpeg","pic_name":"16800815488spO1YEwiLHQGaxDOepic","pic_title":"\u5973\u88c5"},{"pic_id":981,"pic_thumb":"img\/gallery\/202403\/1710898601ZCSfbKovptQVQzGujy.png?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202403\/1710898601ZCSfbKovptQVQzGujy.png","pic_name":"1680142486fJuYc559tI8jDAsb20pic","pic_title":"\u7537\u88c5"},{"pic_id":979,"pic_thumb":"img\/gallery\/202403\/1710898593CDwaF26HdzWUsZAT0K.png?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202403\/1710898593CDwaF26HdzWUsZAT0K.png","pic_name":"16801476459yQrLr3TKTYDHJgJBapic","pic_title":"\u6bcd\u5a74"},{"pic_id":982,"pic_thumb":"img\/gallery\/202403\/1710898604J3HUqMAMlZzBkKw6LR.png?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202403\/1710898604J3HUqMAMlZzBkKw6LR.png","pic_name":"1680144460PpOj29cTFyJ3RyuMo0pic","pic_title":"\u978b\u5305"},{"pic_id":980,"pic_thumb":"img\/gallery\/202403\/1710898597JtR7zSIOtBfnCNnWAT.png?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202403\/1710898597JtR7zSIOtBfnCNnWAT.png","pic_name":"16801580687Rp7Igr3WNw9HIyeKbpic","pic_title":"\u8fd0\u52a8"},{"pic_id":60,"pic_thumb":"img\/gallery\/demo\/1680143337Rvp3jzg8CO6xLpCPqF!!pic200x200.jpeg","pic_url":"img\/gallery\/demo\/1680143337Rvp3jzg8CO6xLpCPqF!!pic.jpeg","pic_name":"165785682612710325_120x120_85","pic_title":"\u6d4b\u8bd5"}],"img_padding":5,"radio_style":1,"pic_page_type":2,"swiper_page_color":"rgba(255, 120, 0, 1)","frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":8,"box_padding":11,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true,"active":false},{"type":"image_ad","label":"\u56fe\u7247\u5e7f\u544a","module":{"pic_type":2,"pic_list":[{"pic_id":834,"pic_thumb":"img\/gallery\/202305\/1683260921471hMZsRzOhzk82T0u!!pic200x200.png","pic_url":"img\/gallery\/202305\/1683260921471hMZsRzOhzk82T0u!!pic.png","pic_name":"1683258803828_750x250_852"},{"pic_id":833,"pic_thumb":"img\/gallery\/202305\/1683260820KAzMNaN5akHsfox9Vh!!pic200x200.png","pic_url":"img\/gallery\/202305\/1683260820KAzMNaN5akHsfox9Vh!!pic.png","pic_name":"1683181585457_750x250_852"},{"pic_id":832,"pic_thumb":"img\/gallery\/202305\/1683260819KpszlHhOEZhRqZkGZG!!pic200x200.png","pic_url":"img\/gallery\/202305\/1683260819KpszlHhOEZhRqZkGZG!!pic.png","pic_name":"1682671063744_750x250_852"}],"swiper_pre_view":1,"swiper_page_color":"rgba(250, 212, 0, 1)","img_padding":0,"pic_page_type":2,"radio_style":1,"is_flux_width":0,"background_color":"","inner_padding":0,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5,"title_background":"","title_color":"","desc_color":"","more_color":"","show_title":0,"title_style":1,"title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","desc_text":"\u63cf\u8ff0\u5185\u5bb9","show_more":0,"more_link":[],"pic_radio_style":2,"frame":{"background_color":"","inner_padding":4,"box_radius":0,"box_padding":3,"box_padding_top":3,"box_padding_bottom":3},"title":{"show_title":1,"title_style":1,"title_background":"rgba(199, 21, 133, 0.46)","title_background_pic":{"pic_url":"img\/gallery\/202403\/1710898604J3HUqMAMlZzBkKw6LR.png","pic_thumb":"img\/gallery\/202403\/1710898604J3HUqMAMlZzBkKw6LR.png?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_id":982,"pic_name":"1680144460PpOj29cTFyJ3RyuMo0pic"},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"rgba(255, 215, 0, 1)","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"rgba(255, 120, 0, 1)","show_more":1,"more_link":[],"more_color":"rgba(255, 120, 0, 1)","format":{"title_background":"","title_radius":""}},"nav_type":1,"nav_style":1,"row_num":5,"col_num":2},"is_show":true,"module_index":1703741212957,"active":false},{"type":"coupon","label":"\u4f18\u60e0\u5238","module":{"show_title":1,"title":"\u6bcf\u65e5\u9886\u5238","desc":"\u5929\u5929\u4f18\u60e0\u9886\u4e0d\u505c","color_style":4,"item_background_color":"#ffffff","background_color":"#ffffff","item_padding":5,"box_radius":4,"box_padding":0,"box_padding_top":6,"box_padding_bottom":5,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true,"module_index":1711001584813,"active":false},{"type":"image_ad","label":"\u56fe\u7247\u5e7f\u544a","module":{"pic_type":6,"pic_list":[{"pic_id":728,"pic_thumb":"img\/gallery\/demo\/1680750731Vf40iKb0D8OlW0LT5B!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680750731Vf40iKb0D8OlW0LT5B!!pic.png","pic_name":"1653982277hfgqw1d8eQShR4Sb3F!!pic"},{"pic_id":727,"pic_thumb":"img\/gallery\/demo\/1680750730mZEToHPbfzcMivPa7k!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680750730mZEToHPbfzcMivPa7k!!pic.png","pic_name":"1653982277cBxu9F8i1gdFYObWAl!!pic"},{"pic_id":726,"pic_thumb":"img\/gallery\/demo\/1680750730OAMOP9XY2QB47s50d7!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680750730OAMOP9XY2QB47s50d7!!pic.png","pic_name":"1653982276DIh1AgqdbzSrwjoLNr!!pic"},{"pic_id":731,"pic_thumb":"img\/gallery\/demo\/1680750732qlO2uehWAPbSAy0Ztm!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680750732qlO2uehWAPbSAy0Ztm!!pic.png","pic_name":"16539822782n8Lfe2GFAbeXnUWNG!!pic"},{"pic_id":730,"pic_thumb":"img\/gallery\/demo\/1680750731iJkYlTivLw3SnFXls0!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680750731iJkYlTivLw3SnFXls0!!pic.png","pic_name":"16539822763gBjCpkNnDHMPLQTae!!pic"},{"pic_id":729,"pic_thumb":"img\/gallery\/demo\/1680750731htTrT8bY4UOzUJNQRo!!pic200x200.png","pic_url":"img\/gallery\/demo\/1680750731htTrT8bY4UOzUJNQRo!!pic.png","pic_name":"1653982277zZdQcnkwBvmv6RYFhy!!pic"}],"swiper_pre_view":1,"swiper_page_color":"rgba(255, 69, 0, 0.68)","img_padding":0,"pic_page_type":1,"pic_radio_style":1,"is_flux_width":0,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":1,"title_style":"2","title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":5,"title_text":"\u63a8\u8350\u699c\u5355","title_color":"rgba(42, 49, 69, 1)","desc_text":"HOTLISTS","desc_color":"rgba(17, 187, 85, 1)","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1711006532529,"active":false},{"type":"image_square_ad","label":"\u6a21\u5757\u56fe\u7247","module":{"pic_type":2,"pic_list":[{"pic_id":906,"pic_thumb":"img\/gallery\/202309\/1694132184MlOZ72AhP3TUZvGN5o!!pic.jpeg?x-oss-process=image\/resize,m_fill,h_200,w_200","pic_url":"img\/gallery\/202309\/1694132184MlOZ72AhP3TUZvGN5o!!pic.jpeg","pic_name":"02b5283dff3aa3d7!400x400_big"},{"pic_id":910,"pic_thumb":"img\/gallery\/202309\/1694132893dmHt1wjxyhtZ00TiUU!!pic.jpeg?x-oss-process=image\/resize,m_fill,h_200,w_200","pic_url":"img\/gallery\/202309\/1694132893dmHt1wjxyhtZ00TiUU!!pic.jpeg","pic_name":"123122323"},{"pic_id":932,"pic_thumb":"img\/gallery\/202312\/17017445366079YX7PcJjkVDJ6YO.jpg?x-oss-process=image\/resize,m_lfit,h_200,h_200","pic_url":"img\/gallery\/202312\/17017445366079YX7PcJjkVDJ6YO.jpg","pic_name":"3df196c76c3ac214400x400_big"}],"swiper_pre_view":1,"swiper_page_color":"","img_padding":3,"pic_page_type":1,"pic_radio_style":1,"is_flux_width":0,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":4,"box_padding":24,"box_padding_top":0,"box_padding_bottom":0},"title":{"show_title":0,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1711591327702,"active":false},{"type":"seckill","label":"\u79d2\u6740","module":{"style":6,"goods_style":1,"goods_radio_style":1,"text_align":1,"text_weight":1,"goods_name_row":1,"goods_name_padding":1,"show_name":1,"show_brief":1,"show_price":1,"goods_padding":5,"buy_btn_style":1,"background_color":"","box_radius":0,"inner_padding":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":1,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1711423695282,"active":false},{"type":"product","label":"\u5546\u54c1","module":{"img_padding":1,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":1,"title_style":3,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":0,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}},"products":{"product_select_type":2,"product_ids":[338,339],"product_category_id":1,"product_number":6,"product_tag":""},"style":2,"goods_style":1,"goods_radio_style":1,"text_align":1,"text_weight":1,"goods_name_row":2,"goods_name_padding":1,"show_name":1,"show_brief":1,"show_price":1,"goods_padding":7,"buy_btn_style":1,"background_color":"","box_radius":0,"inner_padding":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5,"pic_type":3,"waterfall":0},"is_show":true,"module_index":1711421511667,"active":false},{"type":"title_ad","label":"\u6587\u672c\u6807\u9898","module":{"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":0,"box_padding_top":5,"box_padding_bottom":5},"title":{"show_title":0,"title_style":1,"title_align":1,"title_background":"","title_background2":"","title_background_pic":{"pic_url":"","pic_thumb":""},"title_radius":0,"title_text":"\u6807\u9898\u5185\u5bb9","title_color":"","desc_text":"\u63cf\u8ff0\u5185\u5bb9","desc_color":"#aaaaaa","show_more":1,"more_link":[],"more_color":"#aaaaaa","format":{"title_background":"","title_radius":""}}},"is_show":true,"module_index":1711415921575,"active":false},{"type":"notice","label":"\u516c\u544a","module":{"text":"\u516c\u544a\u5185\u5bb9","ico_pic":{"pic_url":"img\/gallery\/202304\/1680508039OyeQG2SMcWjTpGbFSN!!pic.png","pic_thumb":"img\/gallery\/202304\/1680508039OyeQG2SMcWjTpGbFSN!!pic200x200.png","pic_id":620,"pic_name":"1505123972855738402"},"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":28,"item_radius":3,"box_radius":0,"box_padding":12,"box_padding_top":8,"box_padding_bottom":9}},"is_show":true,"module_index":1711355060556,"active":false},{"type":"white_blank","label":"\u7a7a\u767d\u8f85\u52a9","module":{"background_color":"rgba(250, 212, 0, 1)","blank_height":47},"is_show":true,"module_index":1711350280476,"active":false},{"type":"white_line","label":"\u5206\u5272\u7ebf","module":{"line_type":2,"line_style":2,"frame":{"text_color":"","item_background_color":"","background_color":"#ffffff","inner_padding":0,"item_height":35,"item_radius":3,"box_radius":0,"box_padding":10,"box_padding_top":5,"box_padding_bottom":5}},"is_show":true,"module_index":1711349847697,"active":false}]}',
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
        app(ProductService::class)->initNewShopData($shopId);
    }

    /**
     * 自动结算订单且计入店铺资金
     * @param array $data
     * @return bool
     */
    public function autoShopAccountByOrder(array $data): bool
    {
        $order = Order::find($data['order_id']);
        try {
            if ($order->is_settlement == 0) {
                // 未结算
                $order->save(['is_settlement' => 1]);
                $shop_data = [
                    'shop_id' => $order->shop_id,
                    "amount" => $order->paid_amount
                ];
                // 店铺资金变化
                app(ShopAccountLogService::class)->changeShopAccount($shop_data,4);
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
            $job_day = $order_config['date_type'] ? $order_config['use_day'] : 0;
            app(TigQueue::class)->later(OrderSettlementJob::class, $job_day * 24 * 3600, $data);
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
}
