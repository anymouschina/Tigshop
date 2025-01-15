<?php

namespace app\im\service\conversation;

use app\im\library\ImSocketClient;
use app\im\model\Conversation;
use app\im\model\Message;
use app\im\service\config\ConfigService;
use app\model\authority\AdminUser;
use app\service\common\BaseService;
use exceptions\ApiException;

class MessageService extends BaseService
{

    public function __construct(Message $message)
    {
        $this->model = $message;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query();
        if (!empty($filter['conversation_id'])) {
            $query = $query->where('conversation_id', $filter['conversation_id']);
        }
        if (!empty($filter['user_id'])) {
            $query = $query->where('user_id', $filter['user_id']);
        }
        if (!empty($filter['hasUser'])) {
            $query = $query->where('user_id', '>', 0);
        }
        if (!empty($filter['conversation_id'])) {
            $query = $query->where('conversation_id', $filter['conversation_id']);
        }
        if (isset($filter['shop_id']) && $filter['shop_id'] > -1) {
            $query = $query->where('shop_id', $filter['shop_id']);
        }
        if (isset($filter['first_id']) && $filter['first_id'] > -1) {
            $query = $query->where('id', '<', $filter['first_id']);
        }
        if (!empty($filter['servant_id'])) {
            $query = $query->where('servant_id', $filter['servant_id']);
        }
        if (isset($filter['type'])) {
            $query = $query->where('type', $filter['type']);
        }
        if (isset($filter['is_read'])) {
            $query = $query->where('is_read', $filter['is_read']);
        }
        return $query;
    }

    /**
     * 发送消息
     * @param array $message
     * @return Message|\think\Model
     */
    public function send(array $message, bool $isAuto = false, $userFrom = 'pc')
    {
        $message['is_read'] = 0;
        $message = $this->create($message);
        $message->user = $message->user;
        $message->servant = $message->servant;
        $message->user_from = $userFrom;
        Conversation::where('id', $message['conversation_id'])->update(['last_update_time' => time()]);
        //给用户或客服发送推送
        (new ImSocketClient)->send($message, $isAuto);

        return $message;
    }


    public function create(array $message)
    {
        $message['message_type'] = $message['content']['message_type'] ?? 'text';
        return $this->model->create($message);
    }


    /**
     * 设置已读
     * @param array $where
     * @return Message
     */
    public function setRead(array $where)
    {
        return $this->model->where($where)->update(['is_read' => 1]);
    }

    /**
     * 发送欢迎语
     * @param int $shopId
     * @return void
     */
    public function autoWelcome(int $conversationId)
    {
        $conversation = app(ConversationService::class)->detail($conversationId);
        $data = app(ConfigService::class)->getDetail('welcome', $conversation['shop_id']);
        if (!$data) {
            return true;
        }
        if (!$data['activate']) {
            return true;
        }

        if ($data['sendText']) {
            $replyContent = $data['replyContent'];
            $this->send([
                'conversation_id' => $conversationId,
                'type' => 2,
                'user_id' => $conversation['user_id'],
                'servant_id' => $conversation['last_servant_id'],
                'shop_id' => $conversation['shop_id'],
                'content' => [
                    'message_type' => 'text',
                    'content' => $replyContent,
                ]
            ], true);
        }
        if ($data['sendWechat']) {
            $wechatImage = $data['wechatImage'];
            $this->send([
                'conversation_id' => $conversationId,
                'type' => 2,
                'user_id' => $conversation['user_id'],
                'servant_id' => $conversation['last_servant_id'],
                'shop_id' => $conversation['shop_id'],
                'content' => [
                    'message_type' => 'image',
                    'pic' => $wechatImage,
                ]
            ], true);
        }
        return true;


    }


    /**
     * 自动发送忙的语言
     * @param int $shopId
     * @param int $conversationId
     * @return void
     */
    public function autoWaiting(int $conversationId)
    {
        $conversation = app(ConversationService::class)->detail($conversationId);
        $data = app(ConfigService::class)->getDetail('waiting', $conversation['shop_id']);
        if (!$data) {
            return true;
        }
        if (!$data['activate']) {
            return true;
        }
        if ($data['sendText']) {
            $replyContent = $data['replyContent'];

            $this->send([
                'conversation_id' => $conversationId,
                'type' => 2,
                'user_id' => $conversation['user_id'],
                'servant_id' => $conversation['last_servant_id'],
                'shop_id' => $conversation['shop_id'],
                'content' => [
                    'message_type' => 'text',
                    'content' => $replyContent,
                ]
            ], true);
        }
    }

    /**
     * 自动发送忙的语言
     * @param int $shopId
     * @param int $conversationId
     * @return void
     */
    public function autoOffWork(int $conversationId)
    {
        $conversation = app(ConversationService::class)->detail($conversationId);
        $data = app(ConfigService::class)->getDetail('off_work', $conversation['shop_id']);
        if (!$data) {
            return true;
        }
        if (!$data['activate']) {
            return true;
        }
        if ($data['sendText']) {
            $replyContent = $data['replyContent'];
            $this->send([
                'conversation_id' => $conversationId,
                'type' => 2,
                'user_id' => $conversation['user_id'],
                'servant_id' => $conversation['last_servant_id'],
                'shop_id' => $conversation['shop_id'],
                'content' => [
                    'message_type' => 'text',
                    'content' => $replyContent,
                ]
            ], true);
        }
    }


    /**
     * 会话结束消息
     * @param int $conversationId
     * @return false|void
     */
    public function endConversationMessage(int $conversationId)
    {
        $conversation = app(ConversationService::class)->detail($conversationId);
        if ($conversation['status'] != 2) {
            return false;
        }
        app(MessageService::class)->send([
            'content' => [
                'message_type' => 'text',
                'content_category' => 'end_conversation',
                'content' => '系统结束会话！'
            ],
            'user_id' => $conversation['user_id'],
            'conversation_id' => $conversation['id'],
            'servant_id' => $conversation['last_servant_id'],
            'type' => 3,
            'shop_id' => $conversation['shop_id']
        ], true);
    }

    /**
     * 会话结束消息
     * @param int $conversationId
     * @return false|void
     */
    public function autoTransfer(array $params)
    {
        $conversation = app(ConversationService::class)->detail($params['conversation_id']);
        if ($conversation['status'] == 2) {
            return false;
        }
        if ($params['servant_id'] != $params['old_servant_id'] && $params['old_servant_id'] > 0) {
            $servant = AdminUser::find($params['servant_id']);
            $oldServant = AdminUser::find($params['old_servant_id']);
            $content = $oldServant['username'] . ' 将客户转接给 ' . $servant['username'];
        } else {
            $servant = AdminUser::find($params['servant_id']);
            $content = '客户被 ' . $servant['username'] . ' 接入';
        }
        app(MessageService::class)->send([
            'content' => [
                'message_type' => 'text',
                'content' => $content
            ],
            'user_id' => $conversation['user_id'],
            'servant_id' => $params['servant_id'],
            'conversation_id' => $conversation['id'],
            'type' => 3,
            'shop_id' => $conversation['shop_id']
        ], true);
    }

}