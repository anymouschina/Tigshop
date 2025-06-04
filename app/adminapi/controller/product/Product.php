<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 商品管理
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\product;

use app\adminapi\AdminBaseController;
use app\model\product\ProductArticle;
use app\service\admin\authority\SuppliersService;
use app\service\admin\participle\ParticipleService;
use app\service\admin\product\ECardGroupService;
use app\service\admin\product\ProductAttributesService;
use app\service\admin\product\ProductAttributesTplService;
use app\service\admin\product\ProductGalleryService;
use app\service\admin\product\ProductMemberPriceService;
use app\service\admin\product\ProductService;
use app\service\admin\product\ProductServicesService;
use app\service\admin\product\ProductSkuService;
use app\service\admin\product\ProductVideoService;
use app\service\admin\shipping\ShippingTplService;
use app\service\admin\user\UserRankService;
use app\validate\product\ProductValidate;
use think\App;
use utils\Config;
use utils\Time;

/**
 * 商品管理控制器
 */
class Product extends AdminBaseController
{
    protected ProductService $productService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param ProductService $productService
     */
    public function __construct(App $app, ProductService $productService)
    {
        parent::__construct($app);
        $this->productService = $productService;
    }

    /**
     * 列表页面
     *
     * @return \think\Response
     */
    public function list(): \think\Response
    {
        $filter = $this->request->only([
            'keyword' => '',
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'product_id',
            'sort_order' => 'desc',
            'product_id/d' => 0,
            'is_delete/d' => -1,
            'category_id/d' => 0,
            'brand_id/d' => 0,
            'ids' => null,
            'product_group_id' => 0,
            'shop_id/d' => -2, // 店铺id
            'intro_type' => '', // 商品类型
            'product_status/d' => -1, // 上下架状态
            'check_status/d' => -1, // 审核状态
            'search_shop/d' => 0
        ], 'get');

        if (request()->shopId) {
            $filter['shop_id'] = request()->shopId;
        }

        if (request()->suppliersId) {
            $filter['suppliers_id'] = request()->suppliersId;
        }
        $filterResult = $this->productService->getFilterResult($filter);
        $total = $this->productService->getFilterCount($filter);

        return $this->success([
            'records' => $filterResult,
            'total' => $total,
        ]);
    }

    /**
     * 待审核商品数量
     * @return \think\Response
     * @throws \think\db\exception\DbException
     */
    public function getWaitingCheckedCount(): \think\Response
    {
        $waiting_checked_count = $this->productService->getWaitingCheckedCount();
        return $this->success(
            $waiting_checked_count,
        );
    }

    /**
     * 配置型
     * @return \think\Response
     */
    public function config(): \think\Response
    {
        $shop_id = request()->shopId;
        //获取商品类型存在规格的类型
        $attr_tpl_list = app(ProductAttributesTplService::class)->getAttrTplList();
        //运费模板
        $shipping_tpl_list = app(ShippingTplService::class)->getShippingTplList($shop_id);
        // 供应商
        $suppliers_list = app(SuppliersService::class)->getSuppliersList();
        // 服务说明
        $service_list = app(ProductServicesService::class)->getProductService();
        $item = [];
        $item['user_rank_list'] = app(UserRankService::class)->getUserRankList();
        //电子卡券组
        $e_card_list = app(ECardGroupService::class)->cardList();

        // foreach ($item['user_rank_list'] as $key => $value) {
        //     if (isset($member_price_list[$value['rank_id']]) && !empty($member_price_list[$value['rank_id']])) {
        //         $item['user_rank_list'][$key]['price'] = $member_price_list[$value['rank_id']];
        //     } else {
        //         $item['user_rank_list'][$key]['price'] = -1;
        //     }
        // }
        if (request()->shopId > 0) {
            if (Config::get('storeProductNeedCheck') == 1) {
                $item['check_status'] = 0;
                $item['product_status'] = 0;
            } else {
                $item['check_status'] = 1;
                $item['product_status'] = 1;
            }
            $item['shop_id'] = request()->shopId;
        }
        $item['product_service_ids'] = \app\model\product\ProductServices::where('default_on',
            1)->column('product_service_id');
        return $this->success([
            'shipping_tpl_list' => $shipping_tpl_list,
            'suppliers_list' => $suppliers_list,
            'service_list' => $service_list,
            'attr_tpl_list' => $attr_tpl_list,
            'item' => $item,
            'e_card_list' => $e_card_list,
        ]);
    }

    /**
     *详情数据
     * @return \think\Response
     */
    public function detail(): \think\Response
    {
        $id =$this->request->all('id/d', 0);
        $item = $this->productService->getDetail($id);

        if ($item['check_status'] != 1) {
            $item['product_status'] = 0;
        }
        /* 根据商品重量的单位重新计算 */
        if ($item['product_weight'] > 0) {
            $item['product_weight_by_unit'] = ($item['product_weight'] >= 1) ? $item['product_weight'] : ($item['product_weight'] / 0.001);
        }
        // 关联文章
        $item["product_article_list"] = ProductArticle::where("goods_id", $id)->column('article_id');

        //属性
        $item['attr_list'] = app(ProductAttributesService::class)->getAttrList($item['product_id']);
        //规格
        $item['product_list'] = app(ProductSkuService::class)->getSkuList($item['product_id']);
        if(!empty($item['paid_content'])) {
            if(!is_array($item['paid_content'])) {
                $item['paid_content'] = [
                    [
                    'html' => $item['paid_content'],
                    'type' => 'text'
                ]
                ];
            }
        }
        return $this->success(
            $item
        );
    }

    /**
     * 商品复制
     * @return \think\Response
     */
    public function copy(): \think\Response
    {
        $id =$this->request->all('product_id/d', 0);
        $item = $this->productService->getDetail($id);
        // 关联文章
        $item["product_article_list"] = ProductArticle::where("goods_id", $id)->column('article_id');

        //属性
        $item['attr_list'] = app(ProductAttributesService::class)->getAttrList($item['product_id']);
        //规格
        $item['product_list'] = app(ProductSkuService::class)->getSkuList($item['product_id']);
        unset($item['product_id']);
        $item['product_sn'] = $this->productService->creatNewProductSn(0);

        $result = $this->productService->updateProduct($id, $item, true);
        if ($result) {
            $id = $result;
            /* 处理属性 */
            app(ProductAttributesService::class)->dealProductAttr($id, $item['attr_list']);
            /* 处理规格 */
            app(ProductSkuService::class)->copyProductSpec($id, $item['product_list']);
            //处理相册
            $img_list = $item['img_list'];
            app(ProductGalleryService::class)->copyProductGallery($id, $img_list);
            //处理视频
            $video_list = $item['video_list'];
            app(ProductVideoService::class)->copyProductVideo($id, $video_list);
            return $this->success();
        } else {
            return $this->error('商品复制失败');
        }
    }

    /**
     * 获取分词
     * @return \think\Response
     */
    public function getParticiple(): \think\Response
    {
        $product_name =$this->request->all('product_name', '');
        $keywords = htmlspecialchars(str_replace(' ', '', trim($product_name)));
        $keyword = app(ParticipleService::class)->cutForSearch($keywords);
        return $this->success(
           $keyword
        );
    }

    /**
     * 运费模板列表
     * @return \think\Response
     */
    public function shippingTplList(): \think\Response
    {
        //运费模板
        $shop_id = request()->shopId;
        $shipping_tpl_list = app(ShippingTplService::class)->getShippingTplList($shop_id);
        return $this->success(
            $shipping_tpl_list
        );
    }

    /**
     * 新增接口
     * @return \think\Response
     * @throws \exceptions\ApiException
     * @throws \think\Exception
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function create(): \think\Response
    {
        $id =$this->request->all('product_id/d', 0);
        $data = $this->request->only([
            'product_id' => $id,
            'product_name' => '',
            'product_desc_arr' => [],
            'product_sn' => '',
            'sort_order/d' => 50,
            'product_type/d' => 1,
            'check_status/d' => 1,
            'product_price/f' => 0.00,
            'is_promote/d' => 1,
            'promote_price/f' => 0.00,
            'product_tsn' => '',
            'virtual_sales/d' => 0,
            'limit_number/d' => 0,
            'category_id/d' => 0,
            'brand_id/d' => 0,
            'product_related' => [],
            'product_service_ids' => [],
            'market_price/f' => 0.00,
            'prepay_price/d' => 0,
            'keywords' => '',
            'product_brief' => '',
            'remark' => '',
            'product_stock/d' => 0,
            'product_weight/f' => 0.000,
            'is_best/d' => 0,
            'is_new/d' => 0,
            'is_hot/d' => 0,
            'product_status/d' => 1,
            'is_support_cod/d' => 0,
            'free_shipping/d' => 0,
            'product_video' => '',
            'integral/d' => 0,
            'rank_integral/d' => -1,
            'give_integral/d' => -1,
            'suppliers_id/d' => 0,
            'product_care' => '',
            'is_support_return/d' => 0,
            'shipping_tpl_id/d' => 0,
            'check_reason' => '',
            'no_shipping' => 0,
            'product_article_list' => [],
            'img_list' => [],
            'video_list' => [],
            'shop_id' => request()->shopId,
            'shop_category_id' => 0,
            'card_group_id/d' => 0,
            'paid_content' => '',
            'virtual_sample' => '',
            'card_group_id' => 0,
            'product_video_info' => []
        ], 'post');
        $data['shop_id'] = request()->shopId;
        validate(ProductValidate::class)->only(array_keys($data))->check($data);
        if ($data['product_price'] <= 0) {
            return $this->error('商品售价不能小于或等于0');
        }
        $result = $this->productService->updateProduct($id, $data, true);
        if ($result) {
            $id = $result;
            /* 处理属性 */
            app(ProductAttributesService::class)->dealProductAttr($id,$this->request->all('attr_list/a', []));
            /* 处理规格 */
            app(ProductSkuService::class)->dealProductSpec($id,$this->request->all('product_list/a', []));
            /* 处理会员价格 */
            app(ProductMemberPriceService::class)->dealMemberPrice($id,$this->request->all('user_rank_list', []));
            //处理相册
            $img_list = $data['img_list'];
            unset($data['img_list']);
            //处理图片
            app(ProductGalleryService::class)->updateProductGallery($id, $img_list);
            //处理视频
            $video_list = $data['product_video_info'];
            unset($data['product_video_info']);
            app(ProductVideoService::class)->updateProductVideo($id, $video_list, false);

            if (request()->shopId > 0) {
                if (Config::get('shopProductNeedCheck') == 1) {
                    return $this->success('商品已添加，等待管理员审核');
                }
            }
            return $this->success('商品已添加');
        } else {
            return $this->error('商品管理更新失败');
        }
    }

    /**
     * 执行添加或更新操作
     *
     * @return \think\Response
     */
    public function update(): \think\Response
    {
        $id =$this->request->all('product_id/d', 0);
        $data = $this->request->only([
            'product_id' => $id,
            'product_name' => '',
            'product_desc_arr' => [],
            'product_sn' => '',
            'sort_order/d' => 50,
            'product_type/d' => 1,
            'check_status/d' => 1,
            'product_price/f' => 0.00,
            'is_promote/d' => 1,
            'promote_price/f' => 0.00,
            //'promote_start_date' => Time::format(),
            //'promote_end_date' => Time::format(strtotime('+1 month'), 'Y-m-d 23:59:59'),
            'product_tsn' => '',
            'virtual_sales/d' => 0,
            'limit_number/d' => 0,
            'category_id/d' => 0,
            'brand_id/d' => 0,
            'product_related' => [],
            'product_service_ids' => [],
            'market_price/f' => 0.00,
            'prepay_price/d' => 0,
            'keywords' => '',
            'product_brief' => '',
            'remark' => '',
            'product_stock/d' => 0,
            'product_weight/f' => 0.000,
            'is_best/d' => 0,
            'is_new/d' => 0,
            'is_hot/d' => 0,
            'no_shipping' => 0,
            'product_status/d' => 1,
            'is_support_cod/d' => 0,
            'free_shipping/d' => 0,
            'product_video' => '',
            'integral/d' => 0,
            'rank_integral/d' => -1,
            'give_integral/d' => -1,
            'suppliers_id/d' => 0,
            'product_care' => '',
            'is_support_return/d' => 0,
            'shipping_tpl_id/d' => 0,
            'check_reason' => '',
            'product_article_list' => [],
            'img_list' => [],
            'shop_category_id' => 0,
            'card_group_id/d' => 0,
            'paid_content' => '',
            'virtual_sample' => '',
            'card_group_id' => 0,
            'product_video_info' => []
        ], 'post');
        $data['shop_id'] = request()->shopId;
        if ($data['product_price'] <= 0) {
            return $this->error('商品售价不能小于或等于0');
        }
        /* 处理属性 */
        if ($this->request->all('attr_changed') == true) {
            app(ProductAttributesService::class)->dealProductAttr($id,$this->request->all('attr_list/a', []));
        }
        /* 处理规格 */
        app(ProductSkuService::class)->dealProductSpec($id,$this->request->all('product_list/a', []));
        /* 处理会员价格 */
        app(ProductMemberPriceService::class)->dealMemberPrice($id,$this->request->all('user_rank_list', []));
        //处理相册
        $img_list = $data['img_list'];
        unset($data['img_list']);

        $video_list = $data['product_video_info'];
        unset($data['product_video_info']);
        $result = $this->productService->updateProduct($id, $data, false);
        if ($result) {
            //处理图片
            app(ProductGalleryService::class)->updateProductGallery($id, $img_list);
            //处理视频
            app(ProductVideoService::class)->updateProductVideo($id, $video_list, true);
            return $this->success('商品管理更新成功');
        } else {
            return $this->error('商品管理更新失败');
        }
    }

    /**
     * 更新单个字段
     *
     * @return \think\Response
     */
    public function updateField(): \think\Response
    {
        $id =$this->request->all('id/d', 0);
        $field =$this->request->all('field', '');

        if (!in_array($field, [
            'product_name',
            'product_sn',
            'product_stock',
            'is_show',
            'is_best',
            'is_new',
            'is_hot',
            'product_price',
            'sort_order',
            'product_status',
            'is_delete',
            'product_stock',
            'product_sku',
        ])) {
            return $this->error('#field 错误');
        }
        $val =$this->request->all('val');
        $data = [
            'product_id' => $id,
            $field => $val,
        ];
        if ($field == 'product_sku') {
            foreach ($val as $k => $v) {
                $this->productService->updateSkuStock($v['skuId'], $v['skuStock']);
            }
        } else {
            $this->productService->updateProductField($id, $data);
        }

        return $this->success();
    }

    /**
     * 回收站
     *
     * @return \think\Response
     */
    public function recycle(): \think\Response
    {
        $id =$this->request->all('id/d', 0);
        $is_delete =$this->request->all('is_delete/d', 0);
        $this->productService->recycleProduct($id);
        return $this->success();
    }

    /**
     * 删除
     *
     * @return \think\Response
     */
    public function del(): \think\Response
    {
        $id =$this->request->all('id/d', 0);
        $is_delete =$this->request->all('is_delete/d', 0);
        $this->productService->deleteProduct($id);
        return $this->success();
    }

    /**
     * 批量操作
     *
     * @return \think\Response
     */
    public function batch(): \think\Response
    {
        if (empty($this->request->all('ids')) || !is_array($this->request->all('ids'))) {
            return $this->error('未选择项目');
        }

        if ($this->request->all('type') == 'recycle') {
            foreach ($this->request->all('ids') as $key => $id) {
                $id = intval($id);
                $this->productService->recycleProduct($id);
            }
            return $this->success('批量操作执行成功！');
        } elseif ($this->request->all('type') == 'restore') {
            foreach ($this->request->all('ids') as $key => $id) {
                $id = intval($id);
                $this->productService->restoreProduct($id);
            }
            return $this->success('批量操作执行成功！');
        } elseif ($this->request->all('type') == 'del') {
            foreach ($this->request->all('ids') as $key => $id) {
                $id = intval($id);
                $this->productService->deleteProduct($id);
            }
            return $this->success('批量操作执行成功！');
        } elseif ($this->request->all('type') == 'up') {
            foreach ($this->request->all('ids') as $key => $id) {
                $id = intval($id);
                $this->productService->upProduct($id);
            }
            return $this->success('批量操作执行成功！');
        } elseif ($this->request->all('type') == 'down') {
            foreach ($this->request->all('ids') as $key => $id) {
                $id = intval($id);
                $this->productService->downProduct($id);
            }
            return $this->success();
        } else {
            return $this->error('#type 错误');
        }
    }

    /**
     * 商品审核
     * @return \think\Response
     * @throws \exceptions\ApiException
     */
    public function audit(): \think\Response
    {
        $id =$this->request->all('id/d', 0);
        $data = $this->request->only([
            "check_status/d" => 0,
            "check_reason" => ''
        ], 'post');
        $result = $this->productService->auditProduct($id, $data);
        return $result ? $this->success() : $this->error('操作失败');
    }

    public function auditAgain()
    {
        $data = $this->request->only([
            'id' => 0,
        ], 'post');
        $result = $this->productService->auditAgain($data['id']);
        return $result ? $this->success() : $this->error('操作失败');
    }
}
