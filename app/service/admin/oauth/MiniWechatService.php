<?php

namespace app\service\admin\oauth;

use app\service\common\BaseService;
use EasyWeChat\MiniApp\Application;
use exceptions\ApiException;
use utils\Config;

class MiniWechatService extends BaseService
{
    protected object|null $application = null;

    /**
     * 初始化
     * @return object|Application|null
     * @throws ApiException
     * @throws \EasyWeChat\Kernel\Exceptions\InvalidArgumentException
     */
    public function getApplication(): object
    {
        if ($this->application != null) return $this->application;
        $app_id = Config::get('wechatMiniProgramAppId');
        $app_secret = Config::get('wechatMiniProgramSecret');
        if (!$app_id || !$app_secret) {
            throw new ApiException('请先填写小程序appId和secret并保存');
        }
        $config = [
            'app_id' => $app_id,
            'secret' => $app_secret,
            'token' => 'easywechat',
            'aes_key' => '',
            'use_stable_access_token' => false,
            'http' => [
                'throw' => true,
                'timeout' => 5.0,
                'retry' => true, // 使用默认重试配置
            ],
        ];
        return new Application($config);
    }
}