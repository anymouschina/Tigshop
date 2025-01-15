<?php

namespace app\im\service\config;

use app\im\model\Config;
use app\service\common\BaseService;
use exceptions\ApiException;

class ConfigService extends BaseService
{
    /**
     * 保存配置
     * @param string $code
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function saveConfig(string $code, array $data,int $shop_id = 0): bool
    {
        if (empty($code)) {
            throw new ApiException(/** LANG */'传参错误');
        }

        $config = Config::where(['code' => $code,'shop_id' => $shop_id])->findOrEmpty();
        if ($config->isEmpty()){
            // 新增配置
            Config::create(['code' => $code,'shop_id' => $shop_id,'data' => $data]);
        }else{
            $config->save(['data' => $data]);
        }
        return true;
    }

    /**
     * 获取配置详情
     * @param string $code
     * @return array|null
     * @throws ApiException
     */
    public function getDetail(string $code,int $shop_id = 0): ?array
    {
        $data = Config::where(['code' => $code,'shop_id' => $shop_id])->findOrEmpty();
        return !empty($data['data']) ? $data['data'] : null;
    }
}