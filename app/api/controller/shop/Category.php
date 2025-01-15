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

namespace app\api\controller\shop;

use app\api\IndexBaseController;
use app\service\admin\merchant\ShopProductCategoryService;
use think\App;
use think\Response;
use utils\Util;

/**
 * 店铺分类控制器
 */
class Category extends IndexBaseController
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
     * 店铺分类树
     * @return Response
     */
    public function tree(): Response
    {
        $id = input('shop_id/d', 0);
        if (empty($id)) {
            return $this->error(Util::lang("请选择店铺"));
        }
        $catList = app(ShopProductCategoryService::class)->catList(0, $id);
        return $this->success([
            'list' => $catList,
        ]);
    }

    /**
     * 获取当前分类的父级分类
     * @return Response
     */
    public function parentTree(): Response
    {
        $id = input('id/d', 0);
        return $this->success([
            'category_tree' => app(ShopProductCategoryService::class)->getParentCategoryTree($id),
        ]);
    }


}
