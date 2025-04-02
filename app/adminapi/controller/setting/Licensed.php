<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- APP版本管理
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\setting;

use app\adminapi\AdminBaseController;
use app\service\admin\setting\LicensedService;
use think\App;
use think\Response;
use utils\Config as UtilsConfig;

/**
 * 授权
 */
class Licensed extends AdminBaseController
{
    protected LicensedService $licensedService;

    /**
     * 构造函数
     *
     * @param App $app
     */
    public function __construct(App $app, LicensedService $licensedService)
    {
        parent::__construct($app);
        $this->licensedService = $licensedService;
    }

    /**
     * 详情
     * @return Response
     */
    public function index(): Response
    {
        $item = $this->licensedService->getDetail();
        $item = $item ? $item['data'] : [];
        if ($item) {
            $item['admin_dark_logo'] = UtilsConfig::get('admin_dark_logo', 'base_licensed_data');
            $item['powered_by_status'] = UtilsConfig::get('powered_by_status', 'base_licensed_data');
            $item['powered_by'] = UtilsConfig::get('powered_by', 'base_licensed_data'," - powered by tigshop");
            $item['admin_light_logo'] = UtilsConfig::get('admin_light_logo', 'base_licensed_data');
            $item['version_info_hidden'] = UtilsConfig::get('version_info_hidden', 'base_licensed_data');
        }
        $item['version_type'] = config('app.version_type');
        $item['version'] = config('app.version');
        $item['shop_company'] = !empty($item['deCopyright']) ? UtilsConfig::get('shop_company',
            'base_licensed_data') : config('app.default_company');
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 执行更新操作
     * @return Response
     */
    public function update(): Response
    {
        $data = $this->request->only([
            'license' => '',
        ], 'post');

        $result = $this->licensedService->update($data['license']);
        if ($result) {
            return $this->success('更新成功');
        } else {
            return $this->error('更新失败');
        }
    }
}
