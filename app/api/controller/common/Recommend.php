<?php
//**---------------------------------------------------------------------+
//** 通用接口控制器文件 -- 通用
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\api\controller\common;

use app\api\IndexBaseController;
use app\service\admin\product\ProductDetailService;
use app\service\admin\product\ProductService;
use think\App;
use think\Response;

/**
 * 首页控制器
 */
class Recommend extends IndexBaseController
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
     * 猜你喜欢
     *
     * @return Response
     */
    public function guessLike(): Response
    {
        $product_list = app(ProductService::class)->getProductList([
            'intro_type' => 'hot',
            'size' => 30,
            'sort_order' => 'rand',
        ]);
        foreach ($product_list as &$item) {
            $productDetailService = new ProductDetailService($item['product_id']);
            $productAvailability = $productDetailService->getProductSkuDetail($item['product_sku']['0']['sku_id'] ?? 0,
                0,
                '');
            $item['price'] = $productAvailability['price'];
        }
        return $this->success($product_list);
    }

}
