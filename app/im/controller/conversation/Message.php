<?php

namespace app\im\controller\conversation;

use app\BaseController;
use app\im\library\ImSocketClient;
use app\im\service\conversation\ConversationService;
use app\im\service\conversation\MessageService;
use app\im\service\servant\ServantService;
use exceptions\ApiException;
use think\App;
use utils\TigQueue;

class Message extends BaseController
{
    public $service = null;

    public function __construct(App $app, MessageService $MessageService)
    {
        parent::__construct($app);
        $this->service = $MessageService;
    }

    public function list(): \think\Response
    {
        $filter = $this->request->only([
            "size/d" => 9,
            "page/d" => 1,
            'sort_field' => 'id',
            'conversation_id' => 0,
            'sort_order' => 'asc',
            'shop_id' => -1,
            'user_id' => 0,
            'first_id' => -1
        ], 'get');
        if ($this->request->header('X-Client-Type') == 'admin') {
            $filter['servant_id'] = request()->adminUid;
        } else {
            $filter['user_id'] = request()->userId;
        }
        $list = $this->service->getFilterList($filter, ['user', 'servant']);
        if ($list) {
            $list = array_reverse($list->toArray());
        }
        $total = $this->service->getFilterCount($filter);
        return $this->success([
            'filter_result' => $list,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 发送消息
     * @return \think\Response
     */
    public function send(): \think\Response
    {
        $params = $this->request->only([
            "conversation_id/d" => 0,
            "user_id/d" => 0,
            'content' => [],
            'servant_id' => 0,
            'shop_id' => 0
        ], 'post');
        if (empty($params['shop_id'])) {
            $this->error("店铺必出传");
        }
        if ($this->request->header('X-Client-Type') == 'admin') {
            $params['type'] = 2;
            $params['servant_id'] = request()->adminUid;
            if (empty($params['conversation_id'])) {
                return $this->error("请选择会话");
            }
            $conversation = app(ConversationService::class)->detail($params['conversation_id']);
            $userFrom = $conversation['user_from'];
        } else {
            $params['type'] = 1;
            $params['user_id'] = request()->userId;
            if (empty($params['user_id'])) throw new ApiException('token数据验证失败', 401);
            if (empty($message['conversation_id'])) {
                $conversation = app(ConversationService::class)->getConversationByShop([
                    'user_id' => $params['user_id'],
                    'shop_id' => $params['shop_id'],
                ]);
                if ($conversation && $conversation['status'] != 1) {
                    $onLineServantId = app(ServantService::class)->getOneOnlineServantId($params['shop_id']);
                    if ($onLineServantId) {
                        $conversation->last_servant_id = $onLineServantId;
                    } else {
                        $conversation->last_servant_id = 0;
                    }
                    $conversation->status = $onLineServantId ? 1 : 0;
                    $conversation->save();
                }
                if (!$conversation) {
                    $onLineServantId = app(ServantService::class)->getOneOnlineServantId($params['shop_id']);
                    if ($onLineServantId) {
                        $params['servant_id'] = $onLineServantId;
                    }
                    $conversation = app(ConversationService::class)->create([
                        'user_id' => $params['user_id'],
                        'shop_id' => $params['shop_id'],
                        'last_servant_id' => $params['servant_id'],
                        'user_from' => $this->request->header('X-Client-Type'),
                        'status' => $params['servant_id'] ? 1 : 0
                    ]);
                    if (!$conversation) {
                        throw new ApiException("创建会话失败");
                    }
                    //更新客服接待数量
                    app(ServantService::class)->updateServantConversationNum($params['servant_id']);
                }
                $params['conversation_id'] = $conversation['id'];
                $params['servant_id'] = $conversation['last_servant_id'];

            } else {
                $conversation = app(ConversationService::class)->detail($message['conversation_id']);
                if ($conversation['status'] != 1) {
                    return $this->error('会话不在进行中');
                }
                $params['servant_id'] = $conversation['last_servant_id'];
            }
            $userFrom = $conversation['user_from'];
        }

        $message = $this->service->send($params, false, $userFrom);

        return $this->success([
            'item' => $message
        ]);
    }

    /**
     * 设置消息已读
     * @return \think\Response
     */
    public function setRead(): \think\Response
    {
        $params = $this->request->only([
            "conversation_id/d" => 0,
            "user_id/d" => 0,
            'servant_id' => 0,
            'shop_id' => -1
        ], 'post');
        if ($this->request->header('X-Client-Type') == 'admin') {
            if (empty($params['conversation_id']) || empty($params['user_id'])) {
                return $this->error("会话id和用户id不能为空");
            }
            $params['shop_id'] = request()->shopId;
            app(MessageService::class)->setRead([
                'shop_id' => $params['shop_id'],
                'is_read' => 0,
                'type' => 1,
                'user_id' => $params['user_id'],
            ]);
            app(ImSocketClient::class)->userRead($params['user_id'], $params);
        } else {
            if ($params['shop_id'] <= -1) {
                return $this->error("会话id不能为空");
            }
            $params['user_id'] = request()->userId;
            app(MessageService::class)->setRead([
                'shop_id' => $params['shop_id'],
                'is_read' => 0,
                'type' => 2,
                'user_id' => $params['user_id'],
            ]);
            app(ImSocketClient::class)->adminRead($params['servant_id'], $params);
        }

        return $this->success([]);

    }



}