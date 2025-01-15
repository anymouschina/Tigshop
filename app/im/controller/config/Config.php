<?php

namespace app\im\controller\config;

use app\BaseController;
use app\im\service\config\ConfigService;
use think\App;
use think\Response;

class Config extends BaseController
{

    protected ConfigService $configService;
    public function __construct(App $app, ConfigService $configService)
    {
        parent::__construct($app);
        $this->configService = $configService;
    }

    /**
     * 配置项详情
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function detail():Response
    {
        $code = input('code',"");
        $shop_id = request()->shopId;
        $config = $this->configService->getDetail($code,$shop_id);
        return $this->success([
            'item' => $config,
        ]);
    }

    /**
     * 配置保存
     * @return Response
     */
    public function save():Response
    {
        $code = input('code',"");
        $data = input('data/a',[]);
        $shop_id = request()->shopId;
        $result = $this->configService->saveConfig($code, $data,$shop_id);
        return $result ? $this->success(/** LANG */'设置项更新成功') : $this->error(/** LANG */'设置项更新失败');
    }



}