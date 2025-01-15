<?php

declare (strict_types=1);

namespace app\im\middleware;

use app\service\admin\authority\AccessTokenService;
use app\service\admin\authority\AdminUserService;
use app\service\admin\user\UserService;
use think\Exception;
use utils\ResponseCode;

/**
 * JWT验证刷新token机制
 */
class JWT
{
    /**
     * 登录中间件
     * @param $request
     * @param \Closure $next
     * @return object|mixed
     * @throws Exception
     */
    public function handle($request, \Closure $next): object
    {
        if ($request->header('X-Client-Type') == 'admin') {
            $result = app(AccessTokenService::class)->setApp('admin')->checkToken();
            if ($result) {
                // 获取adminUid
                $admin_id = intval($result['data']->adminId);
                if (!$admin_id) {
                    throw new Exception('token数据验证失败', ResponseCode::NOT_TOKEN);
                }
                app(AdminUserService::class)->setLogin($admin_id);

            } else {
                // token验证失败
                throw new Exception('token验证失败', ResponseCode::NOT_TOKEN);
            }
        } else {
            request()->userId = 0;
            // 检查token并返回数据
            $result = app(AccessTokenService::class)->setApp('app')->checkToken();
            if ($result) {
                // 获取appUid
                $user_id = intval($result['data']->appId);
                if ($user_id) {
                    app(UserService::class)->setLogin($user_id);
                }
            }
            // 测试
        }
        return $next($request);
    }
}
