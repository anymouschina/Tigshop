<?php

namespace app\adminapi\controller\product;

use app\adminapi\AdminBaseController;
use app\service\admin\product\ECardGroupService;
use exceptions\ApiException;
use think\App;
use think\Response;

class ECardGroup extends AdminBaseController
{
    protected ECardGroupService $eCardGroupService;

    /**
     * 构造函数
     * @param App $app
     * @param ECardGroupService $eCardGroupService
     */
    public function __construct(App $app, ECardGroupService $eCardGroupService)
    {
        parent::__construct($app);
        $this->eCardGroupService = $eCardGroupService;
    }

    /**
     * 列表查询
     * @return \think\Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'is_use/d' => -1,
            'keyword' => '',
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'group_id',
            'sort_order' => 'desc',
            'is_download/d' => 0,
        ], 'get');
        $filterResult = $this->eCardGroupService->getFilterResult($filter);
        $total = $this->eCardGroupService->getFilterCount($filter);
        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 添加
     * @return \think\Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function create(): Response
    {
        $filter = $this->request->only([
            'group_name' => '',
            'shop_id' => request()->shopId,
            'remark' => ''
        ], 'post');
        if (empty($filter['group_name'])) {
            throw new ApiException('请输入分组名称');
        }
        $this->eCardGroupService->create($filter);
        return $this->success('电子卡券分组添加成功');
    }

    /**
     * 详情
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function detail(): Response
    {
        $id = input('id/d');
        $item = $this->eCardGroupService->detail($id);
        return $this->success([
            'item' => $item,
        ]);
    }


    /**
     * 更新
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function update(): Response
    {
        $id = input('id/d', 0);
        $filter = $this->request->only([
            'group_name' => '',
            'shop_id' => request()->shopId,
            'remark'=> ''
        ], 'post');
        $filter['group_id'] = $id;
        if (empty($filter['group_name'])) {
            throw new ApiException('请输入分组名称');
        }
        $this->eCardGroupService->update($id, $filter);
        return $this->success('更新成功');
    }

    /**
     * 更新某个字段
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function updateField(): Response
    {
        $id = input('id/d');
        $field = input('field');
        if (!in_array($field, ['group_name', 'is_use','remark'])) {
            return $this->error('#field 错误');
        }
        $filter = [
            'group_id' => $id,
            $field => input('val'),
        ];
        $this->eCardGroupService->updateField($id, $filter);
        return $this->success('更新成功');
    }

    /**
     * 删除
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function del()
    {
        $id = input('id/d');
        if($id) {
            $this->eCardGroupService->del($id);
            return $this->success('指定项目已删除');
        } else {
            return $this->error('#id 错误');
        }
    }

    /**
     * 获取不分页的数据
     * @return Response
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function cardList(): Response
    {
        $shop_id = request()->shopId;
        return $this->success(
            [
                'item' => $this->eCardGroupService->cardList($shop_id)
            ]
        );
    }

    /**
     * 批量导入
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function import(): Response
    {
        $group_id = input('group_id/d');
        if(empty($group_id)) {
            throw new ApiException('缺少group_id参数');
        }
        $res = $this->eCardGroupService->import($group_id);
        return $this->success('批量导入成功');
    }
}