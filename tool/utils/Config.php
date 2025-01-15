<?php

namespace utils;

use app\service\admin\setting\ConfigService;

class Config
{

    protected static array $config = [];

    /**
     * 获取参数
     *
     * @param string $name
     * @param string $code
     * @param $default
     * @return int|string|array|null
     */
    public static function get(string $name = '', string $code = 'base', $default = null, string $field = null): int|string|array|null|float
    {
        $config = self::getConfig($code);
        if (isset($config[$name]) && is_array($config[$name])) {
            if (!empty($field)) {
                return isset($config[$name][$field]) ? $config[$name][$field] : $default;
            } else {
                return $config[$name];
            }
        }
        return isset($config[$name]) ? $config[$name] : $default;
    }

    /**
     * 获取配置
     *
     * @param string $name
     * @param string $code
     * @return int|string|array
     */
    public static function getConfig(string $code): int|string|array|null
    {
        if (!isset(self::$config[$code])) {
            self::$config[$code] = app(ConfigService::class)->getConfig($code);
        }
        return self::$config[$code];
    }

    public static function getStorageUrl(): string
    {
        $storage_type = self::get('storage_type', 'base_api_storage');
        $storage_url = '';
        switch ($storage_type) {
            case 0:
                $storage_url = self::get('storage_local_url', "base_api_storage");
                $storage_url = $storage_url ?? $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . "/";
                break;
            case 1:
                $storage_url = self::get('storage_oss_url', 'base_api_storage');
                break;
            case 2:
                $storage_url = self::get('storage_cos_url', 'base_api_storage');
                break;
            default:
                $storage_url = '';
        }
        return $storage_url;
    }

}
