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
        'sms_key_secret',
        'wechat_miniProgram_secret',
        'wechat_appSecret',
        'wechat_pay_key',
        'wechat_pay_app_secret',
        'storage_oss_access_key_secret',
        'storage_cos_secret_key',
        'lang_volcengine_access_key',
        'lang_volcengine_secret'
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
     * 获取后台相关的设置项
     *
     * @return array
     * @throws ApiException
     */
    public function getAdminConfig(): array
    {
        $config = UtilsConfig::getConfig('base');
        return [
            'ico_defined_css' => UtilsConfig::get('ico_defined_css','base_api_icon'),
            'dollar_sign' => UtilsConfig::get('basic_product','base_product','','dollar_sign'),
            'storage_type' =>  UtilsConfig::get('storage_type','base_api_storage'),
            'storage_url' => UtilsConfig::getStorageUrl(),
            'pc_domain' => $config['pc_domain'],
            'h5_domain' => $config['h5_domain'],
            'version_type' => env('VERSION_TYPE',config('app.version_type'))
        ];
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
     * 执行设置添加
     * @param string $code
     * @param array $data
     * @return int
     * @throws ApiException
     */
    public function createConfig(string $code, array $data): int
    {
        if (empty($code)) {
            throw new ApiException(/** LANG */ '#code数据错误');
        }
        if (empty($data)) {
            throw new ApiException(/** LANG */ '#data数据错误');
        }
        $config = Config::where('code', $code)->find();
        if (!empty($config)) {
            throw new ApiException(/** LANG */ '配置已存在，请勿重复添加！');
        } else {
            $result = Config::create(['code' => $code, 'data' => $data]);
            return $result->getKey();
        }
    }

    /**
     * 执行设置编辑
     * @param string $code
     * @param array $data
     * @return int
     * @throws ApiException
     */
    public function updateConfig(string $code, array $data): bool
    {
        if (empty($code)) {
            throw new ApiException(/** LANG */ '#code数据错误');
        }
        if (empty($data)) {
            throw new ApiException(/** LANG */ '#data数据错误');
        }
        $config = Config::where('code', $code)->find();

        if (empty($config)) {
            throw new ApiException(/** LANG */ '该配置不存在，请先添加配置！');
        } else {
            $config->data = $data;
            $config->save();
            return true;
        }
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
        if (empty($code)) {
            throw new ApiException(/** LANG */ '#code数据错误');
        }
        if (!$data) {
            throw new ApiException(/** LANG */ '#data数据错误');
        }

        $config = Config::where('code', $code)->find();
        if (!$config) {
            // 设置项不存在则新增
            Config::create(['code' => $code, 'data' => $data]);
        } else {
            // 更新
            $config->data = $data;
            $config->save();
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
    public function dealFuzzyConfigData(array $data, string $code = 'base'): array
    {
        $config = self::getConfig($code);
        $fuzzyConfig = self::fuzzyConfig($config);
        foreach ($this->fuzzyFields as $value) {
            if (isset($data[$value])) {
                if (isset($fuzzyConfig[$value]) && $data[$value] == $fuzzyConfig[$value]) {
                    $data[$value] = $config[$value] ?? '';
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
    public function saveBasic(array $data): bool
    {
        // 获取所有基础配置
        $basic_info = Config::where('code', "like",'base%')
            ->chunk(5,function ($basic) use ($data) {
                foreach ($basic as $value) {
                    //基础设置项模糊处理
                    if (isset($data[$value['code']]) && in_array($value['code'], $this->base_code)) {
                        $data[$value['code']] = $this->dealFuzzyConfigData($data[$value['code']],$value['code']);
                    }

                    if (isset($data[$value['code']])) {
                        $value['data'] = $data[$value['code']];
                        $value->save();
                    }
                }
                return $basic;
            });
        return $basic_info;
    }
}
