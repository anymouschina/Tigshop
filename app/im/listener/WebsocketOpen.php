<?php

namespace app\im\listener;

namespace app\im\listener;

use app\Request;
use app\service\admin\authority\AccessTokenService;
use Swoole\Timer;
use think\Container;
use think\swoole\Websocket;

class WebsocketOpen
{
    public $websocket = null;

    public $scheduleClost = 0;

    public function __construct(Container $container)
    {
        $this->websocket = $container->make(Websocket::class);
    }

    /**
     * 事件监听处理
     *
     * @return mixed
     */
    public function handle(Request $request)
    {
        global $fdList;
        if ($request->param('from') == 'server') {
            return true;
        }
        $id = 0;
        try {
            if ($request->param('platform') == 'admin') {
                $platform = 'admin';
                $result = app(AccessTokenService::class)->setApp('admin')->checkTokenByToken($request->param('token'));

                if (!empty($result['data'])) {
                    // 获取adminUid
                    $id = intval($result['data']->adminId);
                }
            } else {
                $platform = 'user';
                $result = app(AccessTokenService::class)->setApp('app')->checkTokenByToken($request->param('token'));
                if (!empty($result['data'])) {
                    // 获取appUid
                    $id = intval($result['data']->appId);
                }
            }
        } catch (\Exception $exception) {

        }

        if (empty($id)) {
            $this->websocket->emit("error", "登录信息校验失败,即将断开链接");
            $this->websocket->close();
        }
        $fdList[$this->websocket->getSender()]['user_id'] = $id;
        $fdList[$this->websocket->getSender()]['platform'] = $platform;
        $this->websocket->join($platform . $id);
        print_r('id' . $id);
        print_r($fdList);
        print_r('fd' . $this->websocket->getSender());
        $this->schedulePing();
    }


    protected function schedulePing()
    {
        Timer::clear($this->scheduleClost);
        $this->scheduleClost = Timer::after(1000 * 60, function ($fdList) {
            if (!is_array($fdList)) {
                $fdList = [];
            }
            foreach ($fdList as $fd => $data) {
                if (time() - $data['time'] > 100) {
                    //$this->websocket->setSender($fd)->emit("error", "超时服务端主动关闭");
                    $this->websocket->setSender($fd)->close();
                    unset($fdList[$fd]);
                }
            }
            $this->schedulePing();
        }, '');
    }

}

