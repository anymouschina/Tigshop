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
use app\service\admin\decorate\DecorateService;
use app\service\admin\image\Image;
use app\service\admin\setting\AreaCodeService;
use think\App;
use think\Response;
use utils\Config as UtilsConfig;

/**
 * 首页控制器
 */
class Config extends IndexBaseController
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
     * 首页
     *
     * @return Response
     */
    public function base(): Response
    {
        $data = [
            'theme_id' => UtilsConfig::get('theme_id', 'theme_style'),
            'theme_style' => UtilsConfig::getConfig('theme_style'),
            'shop_name' => \utils\Util::lang(UtilsConfig::get('shop_name'), '', [], 5),
            'shop_title' => \utils\Util::lang(UtilsConfig::get('shop_title'), '', [], 5),
            'shop_title_suffix' => \utils\Util::lang(UtilsConfig::get('shop_title_suffix'), '', [], 5),
            'shop_logo' => UtilsConfig::get('shop_logo'),
            'shop_keywords' => \utils\Util::lang(UtilsConfig::get('shop_keywords'), '', [], 5),
            'shop_desc' => \utils\Util::lang(UtilsConfig::get('shop_desc'), '', [], 5),
            'storage_url' => app(Image::class)->getStorageUrl(),
            'dollar_sign' => UtilsConfig::get('basic_product', 'base_product', '', 'dollar_sign') ?? '¥',
            'dollar_sign_cn' => UtilsConfig::get('basic_product', 'base_product', '', 'dollar_sign_cn') ?? '元',
            'ico_img' => UtilsConfig::get('ico_img') ?? '',
            'auto_redirect' => UtilsConfig::get('auto_redirect') ?? 1,
            'open_wechat_oauth' => UtilsConfig::get('wechat_oauth', 'base_api_wechat'),
            'person_apply_enabled' => UtilsConfig::get('person_apply_enabled', 'merchant') ?? '',
            'h5_domain' => UtilsConfig::get('h5_domain') ?? '',
            'pc_domain' => UtilsConfig::get('pc_domain') ?? '',
            'admin_domain' => UtilsConfig::get('admin_domain') ?? '',
            'show_service' => UtilsConfig::get('kefu_setting', 'base_kefu', '', 'kefu_type') > 0 ? 1 : 0,
            'version_type' => env('VERSION_TYPE', config('app.version_type')),
            'shop_icp_no' => \utils\Util::lang(UtilsConfig::get('shop_icp_no'), '', [], 5),
            'shop_icp_no_url' => UtilsConfig::get('shop_icp_no_url') ?: 'https://beian.miit.gov.cn',
            'shop_110_no' => UtilsConfig::get('shop_110_no'),
            'shop_110_link' => UtilsConfig::get('shop_110_link') ?: 'https://beian.mps.gov.cn/#/query/webSearch',
            'shop_company' => UtilsConfig::get('shop_company', 'base_licensed_data'),
            'company_address' => UtilsConfig::get('company_address'),
            'kefu_phone' => UtilsConfig::get('kefu_info','base_kefu','','kefu_phone'),
            'kefu_time' => UtilsConfig::get('kefu_info','base_kefu','','kefu_time'),
            'is_enterprise' => UtilsConfig::get('isEnterprise', 'auto_generate_licensed_data', ''),
            'de_copyright' => UtilsConfig::get('deCopyright', 'auto_generate_licensed_data', ''),
            'powered_by_status' => UtilsConfig::get('powered_by_status', 'base_licensed_data'),
            'powered_by' => UtilsConfig::get('powered_by', 'base_licensed_data'),
            'category_decorate_type' => UtilsConfig::get('type', 'base_product_category_decorate', 1),
            'can_invoice' => UtilsConfig::get('invoice_setting', 'base_shopping', '', 'can_invoice'),
            'invoice_added' => UtilsConfig::get('invoice_setting', 'base_shopping', '', 'invoice_added'),
            'default_shop_name' => \utils\Util::lang(UtilsConfig::get('default_shop_name', 'shop', '')),
            'is_open_mobile_area_code' => UtilsConfig::get('is_open_mobile_area_code', 'base', 0),
            'show_selled_count' => UtilsConfig::get('show_related', 'base_product',1,'show_selled_count'),
            'show_marketprice' => UtilsConfig::get('show_related', 'base_product',1,'show_marketprice'),
            'use_surplus' => UtilsConfig::get('use_surplus',"payment"),
            'use_points' => UtilsConfig::get('use_points',"payment"),
            'use_coupon' => UtilsConfig::get('use_coupon',"payment"),
            'close_order' => UtilsConfig::get('close_order',"base",0),
            'shop_reg_closed' => UtilsConfig::get('shop_reg_closed','base',0),
            'company_data_type' => UtilsConfig::get('type','base_api_company_data',2),
            'company_data_tips' => UtilsConfig::get('tips','base_api_company_data',''),
            'is_identity' => UtilsConfig::get('is_identity', 'base', 0),
            'is_enquiry' => UtilsConfig::get('is_enquiry', 'base', 0),
            'grow_up_setting' => UtilsConfig::get('grow_up_setting','base_shopping')
        ];
        $data['shop_company'] = $data['de_copyright'] ? $data['shop_company'] : config('app.default_company');
        $preview_id = input('preview_id/d', 0);
        $data['decorate_page_config'] = app(DecorateService::class)->getPcIndexDecoratePageConfig($preview_id);
        return $this->success($data);
    }

    /**
     * 售后服务配置
     * @return Response
     */
    public function afterSalesService(): Response
    {
        return $this->success([
            'item' => UtilsConfig::getConfig('after_sales_service'),
        ]);
    }


    /**
     * @return Response
     */
    public function mobileAreaCode(): Response
    {
        $list = app(AreaCodeService::class)->getFilterList([
            'is_available' => 1,
            'sort_field' => 'is_default',
            'sort_order' => 'desc',
            'size' => -1
        ]);
        return $this->success([
            'list' => $list,
        ]);
    }

}
