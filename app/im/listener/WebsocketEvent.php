<?php

namespace app\im\listener;

namespace app\im\listener;

use app\im\service\servant\ServantService;
use think\Container;
use think\swoole\Websocket;

class WebsocketEvent
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
        echo "Event\n";
        $func = $event->type; // 要调用的方法
        if (!method_exists($this, $func)) {
            $this->websocket->emit('callback', ['msg' => $func . ':方法不存在']);
        } else {
            $this->$func($event);
        }
    }


    /**
     * 指定to发送消息
     * @param $event
     * @return void
     */
    public function send_back($event)
    {
        echo $event->data['to'] . "--send_back_to\n";
        print_r($event->data['message']);
        $this->websocket->to($event->data['to'])->emit('message', $event->data['message']);
    }

    /**
     * 指定to发送消息
     * @param $event
     * @return void
     */
    public function read($event)
    {
        echo $event->data['to'] . "--read_to\n";
        print_r($event->data['message']);
        $this->websocket->to($event->data['to'])->emit('read', $event->data['message']);
    }

    /**
     * 心跳
     * @param $event
     * @return void
     */
    public function heartbeat($event)
    {
        global $fdList;
        $fdList[$this->websocket->getSender()]['time'] = time();
        $this->websocket->emit('heartbeat', ['time' => date('Y-m-d H:i:s')]);
        if (isset($fdList[$this->websocket->getSender()]['platform']) && $fdList[$this->websocket->getSender()]['platform'] == 'admin') {
            app(ServantService::class)->update($fdList[$this->websocket->getSender()]['user_id'], [
                'last_update_time' => time()
            ]);
        }

    }

    /**
     * 测试类型
     * @param $event
     */
    public function test($event)
    {

        $this->websocket->emit('message', [
            "conversation_id" => 7,
            "user_id" => 0,
            "content" => [
                "message_type" => "text",
                "content" => "用户发了个回复"
            ],
            "servant_id" => 1,
            "type" => 1,
            "add_time" => "2024-07-16 15:13:20",
            "update_time" => "2024-07-16 15:13:20",
            "id" => 6
        ]);
    }
}

