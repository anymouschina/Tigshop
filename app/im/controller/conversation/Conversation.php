<?php

namespace app\im\controller\conversation;

use app\BaseController;
use app\im\service\conversation\ConversationService;
use app\im\service\servant\ServantService;
use think\App;
use think\Response;
use utils\TigQueue;

class Conversation extends BaseController
{
    public $service = null;

    public function __construct(App $app, ConversationService $conversationService)
    {
        parent::__construct($app);
        $this->service = $conversationService;
    }

    public function list()
    {
        $filter = $this->request->only([
            "size/d" => 50,
            "page/d" => 1,
            'sort_field' => 'last_update_time',
            'sort_order' => 'desc',
            'status' => -1,
            'is_delete' => 0
        ], 'get');
        if ($this->request->header('X-Client-Type') == 'admin') {
            $filter['last_servant_id'] = request()->adminUid;
        } else {
            $filter['user_id'] = request()->userId;
        }
        $list = $this->service->getFilterList($filter, ['user', 'lastMessage', 'shop'], [], [
            'unread_message' => function ($query) {
                $query->where(['type' => 1]);
            }
        ]);

        $total = $this->service->getFilterCount($filter);
        return $this->success([
            'filter_result' => $list,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 待接入列表
     * @return \think\Response
     */
    public function WaitServantList(): \think\Response
    {
        $filter = $this->request->only([
            "size/d" => 9,
            "page/d" => 1,
            'sort_field' => 'id',
            'sort_order' => 'desc',
            'user_from' => ''
        ], 'get');
        $filter['last_servant_id'] = 0;
        $filter['status'] = 0;
        $filter['is_deleted'] = 0;
        $filter['shop_id'] = request()->shopId;
        $list = $this->service->getFilterList($filter, ['user', 'userLastTwoMessage']);
        $total = $this->service->getFilterCount($filter);
        return $this->success([
            'filter_result' => $list,
            'filter' => $filter,
            'total' => $total,
        ]);
    }


    /**
     * 客服转接
     * @return mixed
     */
    public function transfer()
    {
        $params = $this->request->only([
            'servant_id' => 0,
            'conversation_id' => 0
        ], 'post');
        $adminId = request()->adminUid;
        if (empty($params['servant_id'])) {
            $params['servant_id'] = $adminId;
        }
        if (empty($params['servant_id']) || empty($params['conversation_id'])) {
            return $this->error('请选择要转接的客服和会话');
        }
        $detail = $this->service->detail($params['conversation_id']);
        if (empty($detail)) {
            return $this->error('会话不存在');
        }
        $this->service->changeServant($params);
        //转接提醒
        $params['type'] = 'autoTransfer';
        $params['old_servant_id'] = $detail['last_servant_id'];
        app(TigQueue::class)->later('app\im\job\AutoMessageJob', 2,
            $params);
        //更新客服接待数量
        app(ServantService::class)->updateServantConversationNum($params['old_servant_id']);
        app(ServantService::class)->updateServantConversationNum($params['servant_id']);
        return $this->success('转接成功');
    }

    /**
     * 历史会话
     * @return Response
     */
    public function consultHistory():Response
    {
        $filter = $this->request->only([
            'username' => "",
            'user_from' => "",
            'status/d' => -1,
            'last_servant_id/d' => -1,
            'start_time' => '',
            'end_time' => '',
            'remark' => '',
            'is_delete/d' => 0,
            "size/d" => 10,
            "page/d" => 1,
            'sort_field' => 'id',
            'sort_order' => 'desc',
        ], 'get');
        $filter['shop_id'] = request()->shopId;
        $list = $this->service->getConsultHistory($filter, ['user','servant','first_user_message','servant_message'],['conversation_duration']);
        return $this->success([
            'filter_result' => $list['list'],
            'filter' => $filter,
            'total' => $list['total'],
        ]);
    }

    public function del()
    {
        $params = $this->request->only([
            'conversation_id' => 0
        ], 'post');
        $detail = $this->service->detail($params['conversation_id']);
        if ($detail['shop_id'] != request()->shopId) {
            return $this->error("没有权限");
        }
        $this->service->del($params['conversation_id']);
        return $this->success('删除成功');
    }

    /**
     * 保存会话备注/会话总结
     * @return Response
     */
    public function saveRemark():Response
    {
        $id = input('conversation_id/d',0);
        $params = $this->request->only([
            'conversation_id' => $id,
            'remark' => '',
            'summary' => '',
        ], 'post');
        $detail = $this->service->detail($params['conversation_id']);
        if ($detail['shop_id'] != request()->shopId) {
            return $this->error("没有权限");
        }
        $this->service->update($id,$params);

        return $this->success('操作成功');
    }

    /**
     * 会话详情
     * @return Response
     */
    public function detail():Response
    {
        $id = input('conversation_id/d',0);
        $detail = $this->service->detail($id,['user']);
        if ($detail['shop_id'] != request()->shopId) {
            return $this->error("没有权限");
        }
        return $this->success([
            'item' => $detail
        ]);
    }

    /**
     * 客服端重新发起会话
     * @return Response
     */
    public function create()
    {
        $params = $this->request->only([
            'user_id' => 0,
            'user_from' => 0
        ], 'post');
        $params['shop_id'] = request()->shopId;
        $existConversation = $this->service->getConversationByShop([
            'shop_id' => $params['shop_id'],
            'user_id' => $params['user_id']
        ]);
        $existConversation->status = 1;
        $existConversation->last_servant_id = request()->adminUid;
        $existConversation->save();
        return $this->success([
            'item' => $existConversation
        ]);
    }

    /**
     * 搜索接口
     * @return Response
     */
    public function search(): Response
    {
        $params = $this->request->only([
            'keyword' => ''
        ], 'get');
        $adminId = request()->adminUid;
        $result = $this->service->search($params['keyword'], $adminId);
        return $this->success([
            'item' => $result
        ]);
    }

}