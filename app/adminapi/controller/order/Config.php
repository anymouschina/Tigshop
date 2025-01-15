<?php

namespace app\adminapi\controller\order;

use app\adminapi\AdminBaseController;
use app\service\admin\order\OrderConfigService;
use think\App;
use think\Response;

/**
 * 店铺订单配置
 */
class Config  extends AdminBaseController
{
    protected OrderConfigService $orderConfigService;
    /**
     * 构造函数
     *
     * @param App $app
     * @param OrderConfigService $orderConfigService
     */
    public function __construct(App $app, OrderConfigService $orderConfigService)
    {
        parent::__construct($app);
        $this->orderConfigService = $orderConfigService;
    }

    /**
     * 获取配置详情
     * @return Response
     */
    public function detail(): Response
    {
        $code = input('code', "");
        $shop_id = request()->shopId;
        $config = $this->orderConfigService->getDetail($code, $shop_id);
        return $this->success([
            'item' => $config,
        ]);
    }

    /**
     * 配置保存
     * @return Response
     */
    public function save(): Response
    {
        $code = input('code', "");
        $data = request()->all();
        $shop_id = request()->shopId;
        $result = $this->orderConfigService->saveConfig($code, $data, $shop_id);
        return $result ? $this->success(/** LANG */ '设置项更新成功') : $this->error(/** LANG */ '设置项更新失败');
    }
}