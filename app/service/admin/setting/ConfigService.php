<?php

namespace app\service\admin\setting;

use app\model\setting\Config;
use app\model\setting\Region;
use app\service\common\BaseService;
use exceptions\ApiException;
use log\AdminLog;
use utils\Config as UtilsConfig;
use utils\Util;

/**
 * 设置服务类
 */
class ConfigService extends BaseService
{
    protected Config $configModel;
    protected array $fuzzyFields = [
        'smsKeySecret',
        'wechatMiniProgramSecret',
        'wechatAppSecret',
        'wechatPayKey',
        'wechatPayAppSecret',
        'storageOssAccessKeySecret',
        'storageCosSecretKey',
        'langVolcengineAccessKey',
        'langVolcengineSecret'
    ];

    public array $base_code = [
        'base',
        'base_sms',
        'base_api_mini_program',
        'base_api_wechat',
        'base_api_wechat_merchant',
        'base_api_app_pay',
        'base_api_storage',
        'base_api_lang'
    ];
    public function __construct(Config $configModel)
    {
        $this->configModel = $configModel;
    }

    /**
     * 设置类型
     * @var array|string[]
     */
    public array $type_config = [
        'personApplyEnabled' => 'int',
        'merchantApplyNeedCheck' => 'int',
        'shopProductNeedCheck' => 'int',
        'childAreaNeedRegion' => 'int',
        'integralScale' => 'int',
        'invoiceAdded' => 'int',
        'useQiandaoPoint' => 'int',
        'showSendPoint' => 'int',
        'canInvoice' => 'int',
        'closeOrder' => 'int',
        'shopRegClosed' => 'int',
        'autoRedirect' => 'int',
        'isOpenMobileAreaCode' => 'int',
        'type' => 'int',
        'isIdentity' => 'int',
        'isEnquiry' => 'int',
        'smsNote' => 'int',
        'isOpenPscws' => 'int',
        'showCatLevel' => 'int',
        'wechatOauth' => 'int',
        'storageType' => 'int',
        'storageSaveFullPath' => 'int',
        'langOn' => 'int',
        'langType' => 'int',
        'orderPayEmail' => 'int',
        'sendServiceEmail' => 'int',
        'sendShipEmail' => 'int',
        'showSelledCount' => 'int',
        'showMarketprice' => 'int',
        'kefuType' => 'int',
        'kefuYzfType' => 'int',
        'kefuCodeBlank' => 'int',
        'deCopyright' => 'int',
        'poweredByStatus' => 'int',
        'versionInfoHidden' => 'int',
        'useSurplus' => 'int',
        'usePoints' => 'int',
        'useCoupon' => 'int',
        'useWechat' => 'int',
        'wechatMchidType' => 'int',
        'useAlipay' => 'int',
        'useYabanpay' => 'int',
        'useYabanpayWechat' => 'int',
        'useYabanpayAlipay' => 'int',
        'useOffline' => 'int',
        'usePaypal' => 'int',
        'paypalCurrency' => 'int',
        'useYunpay' => 'int',
        'openWechatRegister' => 'int',
        'wechatRegisterBindPhone' => 'int',
        'openWechatOauth' => 'int',
        'autoReturnGoods' => 'int',
        'mailService' => 'int',
        'smtpSsl' => 'int',
        'isEnterprise' => 'int',
        'facebookLoginOn' => 'int',
        'googleLoginOn' => 'int',
        'productCategoryDecorateType' => 'int',
        'sendConfirmEmail' => 'int',
    ];

    /**
     * 获取后台相关的设置项
     *
     * @return array
     * @throws ApiException
     */
    public function getAdminConfig(): array
    {
        return [
            'ico_defined_css' => UtilsConfig::get('icoDefinedCss'),
            'dollar_sign' => UtilsConfig::get('dollarSign'),
            'storage_type' => UtilsConfig::get('storageType'),
            'storage_url' => UtilsConfig::getStorageUrl(),
            'pc_domain' => UtilsConfig::get('pcDomain'),
            'h5_domain' => UtilsConfig::get('h5Domain'),
            'version_type' => env('VERSION_TYPE',config('app.version_type')),
            'upload_max_size' =>  UtilsConfig::get('uploadMaxSize'),
        ];
    }

    /**
     * 获取指定的的设置项
     * @param string $code
     * @return array|null
     * @throws ApiException
     */
    public function getAllConfig(): ?array
    {
        $data = Config::column('biz_val', 'biz_code');
        return $this->dealConfigData($data);
    }

    /**
     * 处理配置项
     * @param array $data
     * @return array
     */
    public function dealConfigData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (isset($this->type_config[$key])) {
                switch ($this->type_config[$key]) {
                    case 'int':
                        $data[$key] = (int)$value;
                        break;
                    case 'float':
                        $data[$key] = (float)$value;
                        break;
                    case 'bool':
                        $data[$key] = (bool)$value;
                        break;
                    case 'string':
                        $data[$key] = (string)$value;
                        break;
                }
            }
        }
        return $data;
    }


    /**
     * 获取指定的的设置项
     * @param array $bizCodes
     * @return array
     */
    public function getConfigByBizCode(array $bizCodes)
    {
        $data =  Config::whereIn('biz_code', $bizCodes)->column('biz_val', 'biz_code');
        return $this->dealConfigData($data);
    }

    /**
     * 获取指定的的设置项
     * @param string $code
     * @return array|null
     * @throws ApiException
     */
    public function getConfig(string $code): ?array
    {
        $data = Config::where('code', $code)->value('data');
        return $data;
    }


    /**
     * 执行设置添加或更新
     *
     * @param string $code
     * @param array $data
     * @param bool $isAdd
     * @return bool
     * @throws ApiException
     */
    public function saveConfig(string $code, array $data): bool
    {
        $data = $this->dealFuzzyConfigData($data);

//        if (empty($code)) {
//            throw new ApiException(/** LANG */ '#code数据错误');
//        }
        if (!$data) {
            throw new ApiException(/** LANG */ '#data数据错误');
        }
        foreach ($data as $itemKey => $itemVal) {
            $config = Config::where('biz_code', $itemKey)->find();
            if (!$config) {
                // 设置项不存在则新增
                Config::create(['biz_code' => $itemKey, 'biz_val' => $itemVal, 'create_time' => time()]);
            } else {
                // 更新
                $config->biz_val = $itemVal;
                $config->save();
            }
        }
        AdminLog::add('更新设置:' . $code);
        return true;
    }

    /**
     * 发送测试邮件
     * @param string $data
     * @return bool
     * @throws ApiException
     */
    public function sendTestMail(string $data): bool
    {
        if (empty($data)) {
            throw new ApiException(/** LANG */ '请输入邮件地址');
        }
        // 发送邮件
        $send_info = [
            'name' => '',
            'email' => $data,
            'subject' => '测试邮件',
            'content' => '这是一封测试邮件，收到此邮件代表着您的邮箱服务器设置正确！',
            'type' => 0,
        ];
        $result = Util::sendEmail($send_info);

        return $result;
    }

    /**
     * 模糊处理配置项
     * @param array $config
     * @return array
     */
    public function fuzzyConfig(array $config): array
    {
        foreach ($this->fuzzyFields as $value) {
            if (!empty($config[$value])) {
                $config[$value] = substr_replace($config[$value], '******', 12, 6);
            }
        }

        return $config;
    }

    /**
     * 处理模糊配置项
     * @param array $data
     * @param string $code
     * @return array
     * @throws ApiException
     */
    public function dealFuzzyConfigData(array $data): array
    {
        $config = self::getAllConfig();
        $fuzzyConfig = self::fuzzyConfig($config);
        foreach ($this->fuzzyFields as $value) {
            if (isset($data[$value])) {
                if (isset($fuzzyConfig[$value]) && $data[$value] == $fuzzyConfig[$value]) {
                    $val = UtilsConfig::get($value);
                    $data[$value] = $val ?? '';
                }
            }
        }

        return $data;
    }

    /**
     * 获取商城基础配置
     * @return array
     */
    public function getBasicConfig():array
    {
        $basic_info = Config::where('code', "like",'base%')->field('code,data')->select();
        $result = [];
        if (!empty($basic_info)) {
            foreach ($basic_info as $value) {
                // 基础设置项模糊处理
                if (in_array($value['code'], $this->base_code)) {
                    //基础设置项模糊处理
                    $value['data'] = $this->fuzzyConfig($value['data']);
                }

                if (!isset($basic[$value['code']])) {
                    $basic[$value['code']] = $value['data'];
                }
            }

            $country = Region::where('parent_id', 0)->select()->toArray();
            $result = ['item' => $basic, 'countrys' => $country];
        }
        return $result;
    }

    /**
     * 保存商城基础配置
     * @param array $data
     * @return bool
     */
    public function save( array $data): bool
    {
        // 获取所有基础配置
        $this->saveConfig('', $data);
        return true;
    }
}
