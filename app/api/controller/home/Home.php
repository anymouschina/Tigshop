<?php
//**---------------------------------------------------------------------+
//** 通用接口控制器文件 -- 首页
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\api\controller\home;

use app\api\IndexBaseController;
use app\model\decorate\Decorate;
use app\service\admin\decorate\DecorateDiscreteService;
use app\service\admin\decorate\DecorateService;
use app\service\admin\decorate\MobileCatNavService;
use app\service\admin\promotion\CouponService;
use app\service\admin\promotion\SeckillService;
use app\service\admin\setting\FriendLinksService;
use think\App;
use think\Response;
use utils\Config;

/**
 * 首页控制器
 */
class Home extends IndexBaseController
{
    /**
     * 构造函数
     *
     * @param App $app
     */
    public function __construct(App $app)
    {
        parent::__construct($app);
    }

    /**
     * 首页
     *
     * @return Response
     */
    public function index(): Response
    {
        $preview_id = input('preview_id/d', 0);
        if (env("DEMO_DEFAULT_DECORATE_ID")) {
            $preview_id = env("DEMO_DEFAULT_DECORATE_ID");
        }
        if ($preview_id > 0) {
            // 预览
            $decorate = app(DecorateService::class)->getAppPreviewDecorate($preview_id);
        } else {
            // 获取首页发布版
            $decorate = app(DecorateService::class)->getAppHomeDecorate();
        }
        return $this->success([
            'decorate_id' => $decorate['decorate_id'],
            'module_list' => $decorate['module_list'],
        ]);
    }

    /**
     * PC首页
     *
     * @return Response
     */
    public function pcIndex(): Response
    {
        $preview_id = input('preview_id/d', 0);
        $decorate_id = input('decorate_id/d', 0);
        if ($preview_id > 0) {
            // 预览
            $decorate = app(DecorateService::class)->getPcPreviewDecorate($preview_id);
        } elseif ($decorate_id > 0) {
            // 获取首页发布版
            $decorate = app(DecorateService::class)->getDecorate(Decorate::TYPE_H5, $decorate_id);
        } else {
            // 获取首页发布版
            $decorate = app(DecorateService::class)->getPcHomeDecorate();
        }
        return $this->success([
            'decorate_id' => $decorate['decorate_id'],
            'module_list' => $decorate['module_list'],
        ]);
    }

    /**
     * 首页今日推荐
     * @return Response
     * @throws \exceptions\ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getRecommend(): Response
    {
        $decorate_id = input('decorate_id/d', 0);
        $module_index = input('module_index');
        $page = input('page/d', 1);
        $preview_id = input('preview_id/d', 0);
        if ($preview_id > 0) {
            $module = app(DecorateService::class)->getPreviewDecorateModuleData($decorate_id, $module_index,
                ['page' => $page, 'size' => 10]);
        } else {
            $module = app(DecorateService::class)->getDecorateModuleData($decorate_id, $module_index,
                ['page' => $page, 'size' => 10]);
        }

        return $this->success([
            'item' => $module,
        ]);
    }

    /**
     * 首页秒杀
     * @return Response
     */
    public function getSeckill(): Response
    {

        $data = [
            'size' => 15,
            'page' => input('page/d', 1),
            'un_started' => input('un_started/d', 0),
        ];

        $filterResult = app(SeckillService::class)->getSeckillProductList($data);
        return $this->success([
            'seckill_list' => $filterResult['list'],
            'total' => $filterResult['total'],
        ]);
    }

    /**
     * 首页优惠券
     * @return Response
     */
    public function getCoupon(): Response
    {
        $data = [
            'size' => 5,
            'valid_date' => 1,
            'is_show' => 1,
            'receive_date' => 1,
            'sort_field' => 'add_time',
            'sort_order' => 'desc',
        ];
        $shop_id = input('shop_id', -1);
        if ($shop_id > -1) {
            $data['shop_id'] = $shop_id;
        }
        $filterResult = app(CouponService::class)->getFilterResult($data);
        return $this->success([
            'coupon_list' => $filterResult,
        ]);
    }

    /**
     * 首页分类栏
     * @return Response
     */
    public function mobileCatNav(): Response
    {
        $data = [
            'is_show' => 1,
            'sort_field' => 'mobile_cat_nav_id',
            'sort_order' => 'desc',
        ];

        $filterResult = app(MobileCatNavService::class)->getFilterResult($data);

        return $this->success([
            'filter_result' => $filterResult,
        ]);
    }

    /**
     * 移动端导航栏
     * @return Response
     */
    public function mobileNav(): Response
    {
        $decorateSn = input('decorate_sn', 'mobile_nav');
        $item = app(DecorateDiscreteService::class)->getDetail($decorateSn);
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 个人中心
     * @return Response
     */
    public function memberDecorate(): Response
    {
        $decorateSn = input('decorate_sn', 'member_decorate');
        $item = app(DecorateDiscreteService::class)->getDetail($decorateSn);
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 客服设置项
     * @return Response
     */
    public function customerServiceConfig(): Response
    {
        $data = ['h5_domain' => Config::get('h5_domain') ?? '', 'corp_id' => ''];
        $service_type = Config::get('kefu_setting', 'base_kefu', '', 'kefu_type');
        $open_type = Config::get('kefu_setting', 'base_kefu', '', 'kefu_yzf_type');
        switch ($service_type) {
            case 0:
                break;
            case 1:
                $data['url'] = config('app.kf.yzf_url') . Config::get('kefu_setting', 'base_kefu', '', 'kefu_yzf_sign');
                $data['corp_id'] = Config::get('kefu_setting', 'base_kefu', '', 'corp_id');
                break;
            case 2:
                $data['url'] = config('app.kf.work_url') . Config::get('kefu_setting', 'base_kefu', '', 'kefu_workwx_id');
                $open_type = 0;
                $data['corp_id'] = Config::get('kefu_setting', 'base_kefu', '', 'corp_id');
                break;
            case 3:
                $data['url'] = Config::get('kefu_setting', 'base_kefu', '', 'kefu_code');
                break;
            case 4:
                $data['url'] = '';
                break;
        }
        $data['open_type'] = $open_type;
        $data['service_type'] = $service_type;
        $data['show'] = $service_type > 0 ? 1 : 0;

        return $this->success(['item' => $data]);
    }

    /**
     * pc端友情链接接口
     * @return Response
     */
    public function friendLinks(): Response
    {
        $list = app(FriendLinksService::class)->getFilterResult([
            'sort_field' => 'sort_order',
            'sort_order' => 'desc',
            'page' => 1,
            'size' => 20,
        ]);
        return $this->success([
            'list' => $list,
        ]);
    }

}
