<?php

namespace app\im\controller\Servant;

use app\BaseController;
use app\im\service\servant\ServantService;
use think\App;

class Servant extends BaseController
{
    public $service = null;

    public function __construct(App $app, ServantService $servantService)
    {
        parent::__construct($app);
        $this->service = $servantService;
    }

    public function list(): \think\Response
    {
        $filter = $this->request->only([
            "size/d" => 10,
            "page/d" => 1,
            'sort_field' => 'id',
            'sort_order' => 'desc',
        ], 'get');
        $list = $this->service->getFilterList($filter, ['user']);
        $total = $this->service->getFilterCount($filter);
        return $this->success([
            'records' => $list,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * @return \think\Response
     */
    public function transferList(): \think\Response
    {
        $filter = $this->request->only([
            "size/d" => 10,
            "page/d" => 1,
            'sort_field' => 'status',
            'sort_order' => 'asc',
        ], 'get');
        $filter['shop_id'] = request()->shopId;
//        $filter['can_transfer'] = true;
        $list = $this->service->getFilterList($filter, ['user']);
        $total = $this->service->getFilterCount($filter);

        return $this->success([
            'records' => $list,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 设置状态
     * @return \think\Response
     */
    public function modifyStatus(): \think\Response
    {
        $servantId = request()->adminUid;
        $params = $this->request->only([
            "status" => 1
        ], 'post');
        $params['shop_id'] = request()->shopId;
        $result = $this->service->update($servantId, $params);
        if ($result) {
            return $this->success('设置成功');
        } else {
            return $this->error('设置失败');
        }

    }


}
