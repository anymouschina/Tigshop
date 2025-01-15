<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 装修
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\decorate;

use app\adminapi\AdminBaseController;
use app\service\admin\decorate\DecorateService;
use app\validate\decorate\DecorateValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Db;
use think\Response;

/**
 * 装修控制器
 */
class Decorate extends AdminBaseController
{
    protected DecorateService $decorateService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param DecorateService $decorateService
     */
    public function __construct(App $app, DecorateService $decorateService)
    {
        parent::__construct($app);
        $this->decorateService = $decorateService;
    }

    /**
     * 列表页面
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'keyword' => '',
            'decorate_type/d' => 0,
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'decorate_id',
            'sort_order' => 'desc',
        ], 'get');
        $filter['shop_id'] = request()->shopId;
        if ($filter['decorate_type'] == 1) {
            $this->checkAuthor('pcDecorateManage');
        } elseif ($filter['decorate_type'] == 2) {
            $this->checkAuthor('mobileDecorateManage');
        }
        $filterResult = $this->decorateService->getFilterList($filter);
        $total = $this->decorateService->getFilterCount($filter);

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 详情
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function detail(): Response
    {
        $id = input('id/d', 0);
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        $has_draft_data = false;
        if ($item['draft_data']) {
            $has_draft_data = true;
            unset($item['draft_data']);
        }
        return $this->success([
            'item' => $item,
            'has_draft_data' => $has_draft_data ? 1 : 0,
        ]);
    }

    /**
     * 获取草稿数据
     * @return Response
     */
    public function loadDraftData(): Response
    {
        $id = input('id/d', 0);
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        return $this->success([
            'data' => $item['draft_data'] ?? [],
        ]);
    }

    /**
     * 存入草稿
     *
     * @return Response
     */
    public function saveDraft(): Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'decorate_id' => $id,
            'data' => '',
        ], 'post');
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        $result = $this->decorateService->saveDecoratetoDraft($id, $data['data']);
        return $this->success(/** LANG */'草稿保存成功');
    }

    /**
     * 发布
     * @return Response
     * @throws ApiException
     */
    public function publish(): Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'decorate_id' => $id,
            'data' => '',
        ], 'post');
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        $result = $this->decorateService->publishDecorate($id, $data);
        return $this->success(/** LANG */'装修发布成功');
    }

    /**
     * 复制
     * @return Response
     */
    public function copy(): Response
    {
        $id = input('id/d', 0);
        $result = $this->decorateService->copy($id);
        return $this->success(/** LANG */ '页面已复制');
    }

    /**
     * 设置为首页
     * @return Response
     */
    public function setHome(): Response
    {
        $id = input('id/d', 0);
        $result = $this->decorateService->setHome($id);
        return $this->success(/** LANG */ '已设置为首页');
    }

    /**
     * 添加
     * @return Response
     */
    public function create(): Response
    {
        $data = $this->request->only([
            'decorate_title' => '',
            'decorate_type/d' => 1,
            'data' => '',
            'shop_id' => request()->shopId
        ], 'post');

        try {
            validate(DecorateValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->decorateService->createDecorate($data);
        if ($result) {
            return $this->success(/** LANG */'装修添加成功');
        } else {
            return $this->error(/** LANG */'装修添加失败');
        }
    }



    /**
     * 执行更新操作
     * @return Response
     */
    public function update(): Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'decorate_id' => $id,
            'decorate_title' => '',
            'decorate_type/d' => 1,
            'data' => '',
        ], 'post');
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        try {
            validate(DecorateValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->decorateService->updateDecorate($id, $data);
        if ($result) {
            return $this->success(/** LANG */'装修更新成功');
        } else {
            return $this->error(/** LANG */'装修更新失败');
        }
    }

    /**
     * 更新单个字段
     *
     * @return Response
     */
    public function updateField(): Response
    {
        $id = input('id/d', 0);
        $field = input('field', '');
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        if (!in_array($field, ['decorate_title', 'is_show', 'sort_order'])) {
            return $this->error(/** LANG */'#field 错误');
        }

        $data = [
            'decorate_id' => $id,
            $field => input('val'),
        ];

        $this->decorateService->updateDecorateField($id, $data);

        return $this->success(/** LANG */'更新成功');
    }

    /**
     * 删除
     *
     * @return Response
     */
    public function del(): Response
    {
        $id = input('id/d', 0);
        $item = $this->decorateService->getDetail($id);
        $this->checkShopAuth($item['shop_id']);
        $this->decorateService->deleteDecorate($id);
        return $this->success(/** LANG */'指定项目已删除');
    }

    /**
     * 批量操作
     *
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
                    $item = $this->decorateService->getDetail($id);
                    $this->checkShopAuth($item['shop_id']);
                    $id = intval($id);
                    $this->decorateService->deleteDecorate($id);
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
