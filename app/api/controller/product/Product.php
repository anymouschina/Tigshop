<?php
//**---------------------------------------------------------------------+
//** 通用接口控制器文件 -- 商品
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\api\controller\product;

use app\api\IndexBaseController;
use app\service\admin\product\ProductDetailService;
use app\service\admin\product\ProductService;
use app\service\admin\promotion\PointsExchangeService;
use app\service\admin\user\FeedbackService;
use app\service\admin\user\UserCouponService;
use app\service\front\promotion\CouponService;
use app\service\front\promotion\PromotionService;
use exceptions\ApiException;
use think\App;
use think\Response;
use utils\Util;

/**
 * 商品控制器
 */
class Product extends IndexBaseController
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
     * 商品信息
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function detail(): \think\Response
    {
        // 此处id有可能传的是sn
        $product_id = input('id', 0);
        $sku_id = input('sku_id', 0);
        $goods_sn = input('sn', '');
        if (!empty($goods_sn)) {
            [$product_id, $sku_id] = app(ProductService::class)->getProductKeyBySn($goods_sn);
        }

        $productDetailService = new ProductDetailService($product_id);
        $product = $productDetailService->getDetail();
        if ($product['is_delete'] == 1 || $product['product_status'] != 1){
            return $this->error(Util::lang('商品不存在'));
        }
        return $this->success([
            'item' => $product,
            'desc_arr' => $productDetailService->getDescArr(),
            'sku_list' => $productDetailService->getSkuList(),
            'pic_list' => $productDetailService->getPicList(),
            'attr_list' => $productDetailService->getAttrList(),
            'rank_detail' => $productDetailService->getProductCommentRankDetail(),
            'seckill_detail' => $productDetailService->getSeckillInfo(),
            'service_list' => $productDetailService->getServiceList(),
            'checked_value' => $productDetailService->getSelectValue($sku_id),
            'consultation_total' => $productDetailService->getConsultationCount(),
        ]);
    }

    public function getComment(): \think\Response
    {
        $id = input('id/d', 0);
        $productDetailService = new ProductDetailService($id);
        return $this->success([
            'item' => $productDetailService->getProductCommentDetail(),
        ]);
    }

    public function getCommentList(): \think\Response
    {
        $id = input('id/d', 0);
        $filter = $this->request->only([
            'id' => $id,
            'type/d' => 1,
            'page/d' => 1,
        ], 'get');
        if ($filter['type'] == 5) {
            $filter['is_showed'] = 1;
        }
        $productDetailService = new ProductDetailService($id);
        return $this->success([
            'filter_result' => $productDetailService->getProductCommentList($filter),
            'filter' => $filter,
            'total' => $productDetailService->getProductCommentCount($filter),
        ]);
    }

    /**
     * 获取商品咨询列表
     * @return \think\Response
     */
    public function getFeedbackList(): \think\Response
    {
        $filter = $this->request->only([
            'page/d' => 1,
            'size/d' => 15,
            'product_id/d' => 0,
            'sort_field' => 'id',
            'sort_order' => 'desc',
        ], 'get');
        if (empty($filter['product_id'])) {
            return $this->error(Util::lang('请选择商品'));
        }
        $result = app(FeedbackService::class)->orderInquiryList($filter);
		$count = app(FeedbackService::class)->getFilterCount($filter);
        return $this->success([
            'filter_result' => $result,
            'filter' => $filter,
            'total' => $count,
        ]);
    }

    /**
     * 获取商品信息
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getProductAvailability(): \think\Response
    {
        $id = input('id/d', 0);
        $sku_id = input('sku_id/d', 0);
        $is_exchange = input('is_exchange/d', 0);
        //商品附加属性
        $extra_attr_ids = input('extra_attr_ids', '');
        $productDetailService = new ProductDetailService($id);
        $result = $productDetailService->getProductSkuDetail($sku_id, $is_exchange, $extra_attr_ids);
        if ($is_exchange){
            $exchange_info = app(PointsExchangeService::class)->getInfoByProductId($result['product_id'],$sku_id);
            if (isset($exchange_info['points_deducted_amount'])){
                $result['price'] -= $exchange_info['points_deducted_amount'];
                $result['price'] = Util::number_format_convert(max($result['price'], 0));
            }
        }

        return $this->success([
            'origin_price' => $result['origin_price'],
            'price' => $result['price'],
            'stock' => $result['stock'],
            'promotion' => $result['promotion'],
        ]);
    }

    /**
     * 商品优惠信息
     * @return Response
     */
    public function getProductsPromotion(): \think\Response
    {
        $products = input('products', []);
        $shopId = input('shop_id', null);
        $from = input('from', 'list');
        $promotion = app(PromotionService::class)->getProductsPromotion($products, $shopId, $from);
        return $this->success([
            'list' => $promotion
        ]);
    }

    public function getProductAmount()
    {
        $id = input('id/d', 0);
        $sku_item = input('sku_item/a', [
        ]);
        $return = [
            'count' => 0,
            'total' => 0,
        ];
        foreach ($sku_item as $item) {
            $itemData = (new ProductDetailService($id))->getProductSkuDetail($item['sku_id'], 1);
            $return['count'] += $item['num'];
            $return['total'] = bcadd(bcmul($item['num'], $itemData['price'], 2), $return['total'], 2);
        }
        return $this->success([
            'item' => $return
        ]);
    }

    /**
     * 商品列表
     * @return \think\Response
     */
    public function list(): \think\Response
    {
        $filter = $this->request->only([
            'is_show/d' => -1,
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'product_id',
            'sort_order' => 'desc',
            'product_id/d' => 0,
            'is_delete/d' => -1,
            'category_id/d' => 0,
            'brand_id/d' => 0,
            'product_group_id' => 0,
            'ids' => null,
            'shop_id/d' => -2, // 店铺id
            'intro_type' => '', // 商品类型
            'coupon_id' => 0,
            'shop_category_id' => -1,
            'with_cart_sum' => 0
        ], 'get');
        $filter['is_delete'] = 0;
        $filter['product_status'] = 1;
        $filterResult = app(ProductService::class)->getFilterResult($filter);
        $total = app(ProductService::class)->getFilterCount($filter);
        $waiting_checked_count = app(ProductService::class)->getWaitingCheckedCount();

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
            'waiting_checked_count' => $waiting_checked_count,
        ]);
    }

    /**
     * 商品优惠劵
     * @return \think\Response
     */
    public function getCouponList(): \think\Response
    {
        $filter = $this->request->only([
            'id/d' => 0,
        ], 'get');
        $product = app(ProductService::class)->getDetail($filter['id']);

        $coupon = app(CouponService::class)->getProductCouponList($product['product_id'],
            $product['shop_id'], request()->userId);
        $userCoupon = app(UserCouponService::class)->getFilterResult([
            'size' => 10000,
            'page' => 1,
            'used_time' => 0,
            'user_id' => request()->userId
        ]);
        $userCouponArr = [];
        if (!empty($userCoupon['list']) && is_array($userCoupon['list'])) {
            foreach ($userCoupon['list'] as $item) {
                $userCouponArr[] = $item['coupon_id'];
            }
        }
        $exist_coupon = [];
        foreach ($coupon as $k => $c) {
            if (in_array($c['coupon_id'], $userCouponArr)) {
                $c['is_receive'] = 1;
                $exist_coupon[] = $c;
                unset($coupon[$k]);
            } else {
                $coupon[$k]['is_receive'] = 0;
            }

        }
        $coupon = array_merge($coupon, $exist_coupon);
        return $this->success([
            'list' => $coupon,
        ]);
    }

    /**
     * 判断商品是否被收藏
     * @return \think\Response
     * @throws \exceptions\ApiException
     */
    public function isCollect(): \think\Response
    {
        $id = input('id/d', "");
        $productDetailService = new ProductDetailService($id);
        $result = $productDetailService->getIsCollect();
        return $this->success([
            'item' => $result,
        ]);
    }

    /**
     * 获取相关商品
     * @return Response
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function getProductRelated():Response
    {
        $id = input('product_id/d', "");
        $productDetailService = new ProductDetailService($id);
        $result = $productDetailService->getRelatedList();
        return $this->success([
            'related_list' => $result,
        ]);
    }

    /**
     * 商品询价
     * @return Response
     * @throws ApiException
     */
    public function priceInquiry():Response
    {
        $data = $this->request->only([
            "mobile" => '',
            "content" => '',
            'product_id/d' => '',
        ], 'post');
        $productDetailService = new ProductDetailService($data['product_id']);
        $result = $productDetailService->getPriceInquiry($data);
        return $result ? $this->success("操作成功") : $this->error("操作失败");
    }
}
