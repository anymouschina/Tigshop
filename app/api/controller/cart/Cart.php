<?php
//**---------------------------------------------------------------------+
//** 通用接口控制器文件 -- 购物车
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\api\controller\cart;

use app\api\IndexBaseController;
use app\Request;
use app\service\admin\promotion\CouponService;
use app\service\front\cart\CartService;
use exceptions\ApiException;
use think\App;
use think\Response;
use utils\Util;

/**
 * 用户购物车控制器
 */
class Cart extends IndexBaseController
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
     * 购物车
     *
     * @return Response
     */
    public function list(): Response
    {
        $is_checked = input('is_checked', false);
        $type = input('type', \app\model\order\Cart::TYPE_NORMAL);
        $filter = [];
        if (input('product_id')) {
            $filter['product_id'] = input('product_id');
        }
        $cart = app(CartService::class)->getCartListByStore($is_checked, $type, $filter);
        $userId = request()->userId;
        $cart = app(CartService::class)->buildCartPromotion($cart, $userId);
        return $this->success([
            'cart_list' => $cart['carts'],
            'total' => $cart['total'],
        ]);
    }

    /**
     * 获取购物车商品数量
     *
     * @return Response
     */
    public function getCount(): Response
    {

        $is_checked = input('is_checked', false);
        $type = input('type', \app\model\order\Cart::TYPE_NORMAL);
        $filter = [];
        if (input('product_id')) {
            $filter['product_id'] = input('product_id');
        }

        $count = app(CartService::class)->getCartCount($is_checked, $type, $filter);
        return $this->success([
            'count' => $count,
        ]);
    }

    /**
     * 更新购物车商品选择状态
     *
     * @return Response
     */
    public function updateCheck(): Response
    {
        $data = input('data/a', []);
        app(CartService::class)->updateCheckStatus($data);
        return $this->success(/** LANG */Util::lang('购物车更新成功'));
    }

    /**
     * 更新购物车商品数量
     *
     * @return Response
     */
    public function updateItem(): Response
    {
        $cart_id = input('cart_id/d', 0);
        $data = input('data/a', []);
        try {
            app(CartService::class)->updateCartItem($cart_id, $data);
        } catch (\Exception $exception) {
            return $this->error(['quantity' => app(CartService::class)->getProductCartNum($cart_id), 'message' => $exception->getMessage()]);
        }
        return $this->success(/** LANG */Util::lang('购物车更新成功'));
    }

    /**
     * 删除购物车商品
     *
     * @return Response
     */
    public function removeItem(): Response
    {
        $cart_ids = input('cart_ids/a', []);
        app(CartService::class)->removeCartItem($cart_ids);
        return $this->success(/** LANG */ Util::lang('购物车商品已移除'));
    }

    /**
     * 清空购物车
     *
     * @return Response
     */
    public function clear(): Response
    {
        app(CartService::class)->clearCart();
        return $this->success(/** LANG */ Util::lang('购物车已清空'));
    }

    /**
     * 获得购物车优惠卷折扣信息
     * @return Response
     */
    public function getCouponDiscount(): Response
    {
        $coupon_id = input('coupon_id/d', 0);
        $carts = app(CartService::class)->getCartList(true);
        $coupon = app(CouponService::class)->getDetail($coupon_id);
        $checkedProductPriceSum = 0;
        $quantity_count = 0;
        foreach ($carts as $cart) {
            if ($coupon['send_range'] == 1) {
                if (!in_array($cart['category_id'], $coupon['send_range_data'])) {
                    continue;
                }
            } elseif ($coupon['send_range'] == 2) {
                if (!in_array($cart['brand_id'], $coupon['send_range_data'])) {
                    continue;
                }
            } elseif ($coupon['send_range'] == 3) {
                if (!in_array($cart['product_id'], $coupon['send_range_data'])) {
                    continue;
                }
            } elseif ($coupon['send_range'] == 4) {
                if (in_array($cart['product_id'], $coupon['send_range_data'])) {
                    continue;
                }
            }
            $quantity_count = $quantity_count + $cart['quantity'];
            $price = isset($cart['sku']['sku_price']) ? $cart['sku']['sku_price'] : $cart['product_price'];
            $checkedProductPriceSum = bcadd($price * $cart['quantity'], $checkedProductPriceSum, 2);
        }

        $discount_money = $coupon['coupon_type'] == 1 ? $coupon['coupon_money'] : bcmul($checkedProductPriceSum,
            (1 - $coupon['coupon_discount'] / 10), 2);

        return $this->success([
            'min_order_amount' => $coupon['reduce_type'] == 2 ? 0 : $coupon['min_order_amount'],
            'coupon_money' => $coupon['coupon_money'],
            'coupon_unit' => $coupon['coupon_unit'],
            'product_price' => $checkedProductPriceSum,
            'quantity_count' => $quantity_count,
            'discount_money' => $discount_money,
        ]);
    }

    /**
     * 兼容后的购物车
     * @return Response
     * @throws ApiException
     */
    public function addToCart(): \think\Response
    {
        $id = input('id/d', 0);
        $number = input('number/d', 0);
        $sku_id = input('sku_id', 0);
        $sku_item = input('sku_item/a', []);
        $type = input('type/d', 1);
        $salesman_id = input('salesman_id/d', 0);
        $is_quick = input('is_quick/d', 0) == 1 ? true : false;
        //添加商品多规格属性 多个id 用逗号分割
        $extra_attr_ids = input('extra_attr_ids', '');
        // 获取 type 值
        $cart_type = app(CartService::class)->getCartTypeByProduct($id,$type);
        $result = app(CartService::class)->addToCart($id,$number,$sku_id, $is_quick, $cart_type, $salesman_id, $extra_attr_ids,$sku_item);
        return $this->success([
            "item" => $result,
            'flow_type' => $cart_type
        ]);
    }
}
