<?php

namespace app\im\listener;

namespace app\im\listener;

use think\Container;
use think\swoole\Websocket;

class WebsocketConnect
{
    public $websocket = null;

    public function __construct(Container $container)
    {
        $this->websocket = $container->make(Websocket::class);
    }

    /**
     * 事件监听处理
     *
     * @return mixed
     */
    public function handle($event)
    {
        echo "connect\n";

    }


}

