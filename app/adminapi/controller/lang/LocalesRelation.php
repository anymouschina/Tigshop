<?php

namespace app\adminapi\controller\lang;

use app\adminapi\AdminBaseController;
use app\model\common\LocalesLang;
use app\service\admin\lang\LocalesRelationService;
use app\validate\lang\LocalesRelationValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Db;
use think\Response;

class LocalesRelation extends AdminBaseController
{
    protected LocalesRelationService $localesRelationService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param LocalesRelationService $localesRelationService
     */
    public function __construct(App $app, LocalesRelationService $localesRelationService)
    {
        parent::__construct($app);
        $this->localesRelationService = $localesRelationService;
    }

    /**
     * 列表页面
     *
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'name' => '',
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'id',
            'sort_order' => 'desc',
        ], 'get');

        $filterResult = $this->localesRelationService->getFilterList($filter);
        $total = $this->localesRelationService->getFilterCount($filter);

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 请求数据
     * @return array
     */
    public function requestData(): array
    {
        $data = $this->request->only([
            'name' => '',
            'code' => '',
            'locales_id' => '',
        ], 'post');
        return $data;
    }

    /**
     * 配置项
     */
    public function config()
    {
        return $this->success([
            'code_list' => LocalesLang::select(),
        ]);
    }


    /**
     * 添加
     *
     * @return Response
     */
    public function create(): Response
    {
        $data = $this->requestData();
        try {
            validate(LocalesRelationValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->localesRelationService->update(0, $data, true);
        return $result ? $this->success(/** LANG */ '添加成功') : $this->error(/** LANG */ '添加失败');
    }

    /**
     * 编辑
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function update(): Response
    {
        $data = $this->requestData();
        $data['id'] = input('id/d', 0);
        try {
            validate(LocalesRelationValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->localesRelationService->update($data['id'], $data);
        return $result ? $this->success(/** LANG */ '编辑成功') : $this->error(/** LANG */ '编辑失败');
    }

    /**
     * 详情
     * @return Response
     */
    public function detail(): Response
    {
        $id = input('id/d', 0);
        $item = $this->localesRelationService->getDetail($id);
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 删除
     * @return Response
     * @throws ApiException
     */
    public function del(): Response
    {
        $id = input('id/d', 0);
        $this->localesRelationService->delete($id);
        return $this->success(/** LANG */ '指定项目已删除');
    }


    /**
     * 批量操作
     * @return Response
     * @throws ApiException
     */
    public function batch(): Response
    {
        if (empty(input('ids')) || !is_array(input('ids'))) {
            return $this->error(/** LANG */ '未选择项目');
        }

        if (in_array(input('type'), ['del'])) {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach (input('ids') as $key => $id) {
                    $id = intval($id);
                    $this->localesRelationService->batchOperation($id, input('type'));
                }
                Db::commit();
            } catch (\Exception $exception) {
                Db::rollback();
                throw new ApiException($exception->getMessage());
            }

            return $this->success(/** LANG */ '批量操作执行成功！');
        } else {
            return $this->error(/** LANG */ '#type 错误');
        }
    }
}