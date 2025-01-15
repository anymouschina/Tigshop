<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 优惠活动
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\promotion;

use app\adminapi\AdminBaseController;
use app\service\admin\promotion\ProductPromotionService;
use app\service\admin\user\UserRankService;
use app\validate\promotion\ProductPromotionValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Db;
use think\Response;

/**
 * 优惠活动控制器
 */
class ProductPromotion extends AdminBaseController
{
    protected ProductPromotionService $productPromotionService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param ProductPromotionService $productPromotionService
     */
    public function __construct(App $app, ProductPromotionService $productPromotionService)
    {
        parent::__construct($app);
        $this->productPromotionService = $productPromotionService;
    }

    /**
     * 列表页面
     *
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'keyword' => '',
            'promotion_type/a' => [],
            'page/d' => 1,
            'size/d' => 15,
            'is_going' => '',
            'sort_field' => 'promotion_id',
            'sort_order' => 'desc',
        ], 'get');
        $filter['shop_id'] = request()->shopId;
        $filterResult = $this->productPromotionService->getFilterResult($filter);
        $total = $this->productPromotionService->getFilterCount($filter);

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 获取活动冲突列表
     * @return Response
     */
    public function conflictList(): Response
    {
        $filter = $this->request->only([
            'start_time' => '',
            'end_time' => '',
            'range/d' => 0,
            'range_data/a' => [],
            'promotion_type/d' => 0,
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'promotion_id',
            'sort_order' => 'desc',
        ], 'get');
        $filter['shop_id'] = request()->shopId;

        $filterResult = $this->productPromotionService->getConflictList($filter);

        return $this->success([
            'filter_result' => $filterResult['list'],
            'filter' => $filter,
            'total' => $filterResult['total'],
        ]);
    }


    /**
     * 配置型
     * @return Response
     */
    public function config(): Response
    {
        // 会员等级
        $rank_list = app(UserRankService::class)->getUserRankList();
        // 优惠活动状态
        $promotion_status = \app\model\promotion\ProductPromotion::PROMOTION_STATUS_NAME;
        return $this->success([
            'rank_list' => $rank_list,
            'promotion_status' => $promotion_status,
        ]);
    }

    /**
     * 详情
     * @return Response
     */
    public function detail(): Response
    {
        $id = input('id/d', 0);
        $item = $this->productPromotionService->getDetail($id);
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 获取请求数据
     * @return array
     */
    public function requestData(): array
    {
        $data = $this->request->only([
            'promotion_name' => '',
            'start_time' => '',
            'end_time' => '',
            'limit_user_rank' => '',
            'range' => '',
            'range_data/a' => [],
            'promotion_type' => '',
            'promotion_type_data/a' => [],
            'rules_type' => 1,
            'unit' => 1
        ], 'post');

        $data['shop_id'] = request()->shopId;

        return $data;
    }

    /**
     * 添加优惠活动
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function create(): Response
    {
        $data = $this->requestData();

        try {
            validate(ProductPromotionValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->productPromotionService->createProductPromotion($data);
        if ($result) {
            return $this->success(/** LANG */'优惠活动添加成功');
        } else {
            return $this->error(/** LANG */'优惠活动更新失败');
        }
    }

    /**
     * 执行更新操作
     *
     * @return Response
     */
    public function update(): Response
    {
        $id = input('id/d', 0);
        $data = $this->requestData();
        $data["promotion_id"] = $id;

        try {
            validate(ProductPromotionValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->productPromotionService->updateProductPromotion($id, $data);
        if ($result) {
            return $this->success(/** LANG */'优惠活动更新成功');
        } else {
            return $this->error(/** LANG */'优惠活动更新失败');
        }
    }

    /**
     * 更新单个字段
     * @return Response
     */
    public function updateField(): Response
    {
        $id = input('id/d', 0);
        $field = input('field', '');

        if (!in_array($field, ['sort_order', 'is_available'])) {
            return $this->error(/** LANG */'#field 错误');
        }

        $data = [
            'promotion_id' => $id,
            $field => input('val'),
        ];

        $this->productPromotionService->updateProductPromotionField($id, $data);

        return $this->success(/** LANG */'更新成功');
    }

    /**
     * 删除
     * @return Response
     */
    public function del(): Response
    {
        $id = input('id/d', 0);
        $this->productPromotionService->deleteProductPromotion($id);
        return $this->success(/** LANG */'指定项目已删除');
    }

    /**
     * 批量操作
     * @return Response
     */
    public function batch(): Response
    {
        if (empty(input('ids')) || !is_array(input('ids'))) {
            return $this->error(/** LANG */'未选择项目');
        }

        if (input('type') == 'del') {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach (input('ids') as $key => $id) {
                    $id = intval($id);
                    $this->productPromotionService->deleteProductPromotion($id);
                }
                Db::commit();
            } catch (\Exception $exception) {
                Db::rollback();
                throw new ApiException($exception->getMessage());
            }

            return $this->success(/** LANG */'批量操作执行成功！');
        } else {
            return $this->error(/** LANG */'#type 错误');
        }
    }
}
