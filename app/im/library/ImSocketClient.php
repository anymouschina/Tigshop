<?php

namespace app\im\library;

use app\im\model\Message;

class ImSocketClient
{
    protected $ws = null;

    public function __construct()
    {
        if (!$this->ws) {
            $port = config('swoole.http.port');
            $this->ws = new WebSocketClient('ws://127.0.0.1:' . $port . '?from=server');
        }
    }

    /**
     * 客户端发送消息
     * @param Message $message
     * @param string $platform
     * @return true
     */
    public function send(Message $message, $auto = false): bool
    {
        $autoTo = [];
        if ($auto) {
            //如果是自动的消息则双方都要发
            $autoTo[] = 'admin' . $message['servant_id'];
            $autoTo[] = 'user' . $message['user_id'];
        } else {
            if ($message['type'] == 1) {
                $autoTo[] = 'admin' . $message['servant_id'];
            } elseif ($message['type'] == 2) {
                $autoTo[] = 'user' . $message['user_id'];
            } else {
                return true;
            }
        }
        foreach ($autoTo as $to) {
            $this->ws->send(json_encode([

                'type' => 'send_back',
                'data' => [
                    'to' => $to,
                    'message' => $message
                ],
            ]));
        }
        $this->ws->close();
        return true;
    }

    public function userRead($to, $data)
    {
        $data['time'] = date('Y-m-d H:i:s');
        $this->ws->send(json_encode([

            'type' => 'read',
            'data' => [
                'to' => 'user' . $to,
                'message' => $data
            ],
        ]));
        $this->ws->close();
        return true;
    }

    public function adminRead($to, $data)
    {
        $data['time'] = date('Y-m-d H:i:s');
        $this->ws->send(json_encode([

            'type' => 'read',
            'data' => [
                'to' => 'admin' . $to,
                'message' => $data
            ],
        ]));
        $this->ws->close();
        return true;
    }
}