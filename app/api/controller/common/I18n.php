<?php
//**---------------------------------------------------------------------+
//** 通用接口控制器文件 -- 通用
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\api\controller\common;

use app\api\IndexBaseController;
use app\service\admin\lang\LocalesRelationService;
use app\service\admin\lang\LocalesService;
use app\service\admin\lang\TranslationsService;
use think\App;
use think\Response;

/**
 * 多语言控制器
 */
class I18n extends IndexBaseController
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
     *
     * 获得对应语言包
     * @return Response
     */
    public function getLocaleTranslations(): Response
    {
        $code = request()->get('locale_code');
        $translations = app(TranslationsService::class)->getFrontData($code);
        $translations = $translations ? $translations->column('translation_value', 'translation_name') : [];
        return $this->success([
            'translations' => $translations,
        ]);
    }

    /**
     * 获得语言列表
     * @return Response
     */
    public function getLocales(): Response
    {
        $locations = app(LocalesService::class)->getFilterList([
            'size' => -1,
            'is_enabled' => 1,
            'sort_field' => 'sort',
            'sort_order' => 'asc',
        ],['currency']);
        return $this->success([
            'items' => $locations
        ]);
    }


    /**
     * 获得默认语言
     * @return Response
     */
    public function getDefaultLocale(): Response
    {
        $code = request()->get('code');
        $location = app(LocalesRelationService::class)->getDefaultLocale($code);
        return $this->success(
            [
                'item' => $location
            ]);
    }
}
