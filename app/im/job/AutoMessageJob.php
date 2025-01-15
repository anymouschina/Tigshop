<?php

namespace app\im\job;

use app\im\service\conversation\MessageService;
use app\job\BaseJob;
use exceptions\ApiException;


class AutoMessageJob extends BaseJob
{
    /**
     * 自动回复消息
     * @param $data
     * @return bool
     */
    public function doJob($data): bool
    {
        try {

            if ($data['type'] == 'autoWelcome') {
                app(MessageService::class)->autoWelcome($data['conversation_id']);
            } elseif ($data['type'] == 'autoWaiting') {
                app(MessageService::class)->autoWaiting($data['conversation_id']);
            } elseif ($data['type'] == 'autoOffWork') {
                app(MessageService::class)->autoOffWork($data['conversation_id']);
            } elseif ($data['type'] == 'autoTransfer') {
                app(MessageService::class)->autoTransfer($data);
            }
            return true;
        } catch (\Exception $exception) {
            return false;
        }
    }
}