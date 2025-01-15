<?php

namespace app\im\service\conversation;

use app\im\model\Conversation;
use app\im\model\Message;
use app\im\service\servant\ServantService;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Time;

class ConversationService extends BaseService
{

    public function __construct(Conversation $conversation)
    {
        $this->model = $conversation;
    }


    public function detail(int $id, array $with = [], array $append = []): Conversation|null
    {
        $query = $this->model;
        if ($with) {
            $query = $query->with($with);
        }

        if ($append) {
            $query = $query->append($append);
        }
        return $query->find($id);
    }

    public function del($id)
    {
        $this->model->where('id', $id)->update([
            'is_delete' => 1
        ]);
        Message::where('conversation_id', $id)->where('is_read', 0)->update([
            'is_read' => 1
        ]);
        return true;
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
        if (isset($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }
        if (isset($filter['user_id'])) {
            $query->where('user_id', $filter['user_id']);
        }

        // 客户名称:姓名/手机号/昵称
        if (isset($filter['username']) && !empty($filter['username'])) {
            $query->hasWhere('user', function ($query) use ($filter) {
                $query->where('username|nickname|mobile', 'like', '%' . $filter['username'] . '%');
            });
        }

        // 用户来源
        if (isset($filter['user_from']) && !empty($filter['user_from'])) {
            $query->where('user_from', $filter['user_from']);
        }

        // 会话状态
        if (isset($filter['status']) && $filter['status'] != -2) {
            if ($filter['status'] == -1) {
                $query->whereIn('status', Conversation::STATUS_HISTORY);
            }else{
                if (is_array($filter['status'])) {
                    $query->whereIn('status', $filter['status']);
                } else {
                    $query->where('status', $filter['status']);
                }
            }
        }
        if (isset($filter['is_delete'])) {
            $query->where('is_delete', $filter['is_delete']);
        }
        if (!empty($filter['user_from'])) {
            $query->where('user_from', $filter['user_from']);
        }

        // 接待客服
        if (isset($filter['last_servant_id']) && $filter['last_servant_id'] != -1) {
            $query->where('last_servant_id', $filter['last_servant_id']);
        }

        // 会话开始时间
        if (isset($filter['start_time'],$filter['end_time']) && !empty($filter['start_time']) && !empty($filter['end_time'])) {
            $query->whereBetweenTime('add_time', Time::toTime($filter['start_time']), Time::toTime($filter['end_time']));
        }

        // 会话备注
        if (isset($filter['remark']) && !empty($filter['remark'])) {
            $query->where('remark', 'like', '%' . $filter['remark'] . '%');
        }


        return $query;
    }

    /**
     * 历史会话
     * @param array $filter
     * @param array $with
     * @param array $append
     * @return array
     */
    public function getConsultHistory(array $filter, array $with = [], array $append = []): array
    {
        $query = $this->filterQuery($filter);
        if ($with) {
            $query = $query->with($with);
        }
        if ($append) {
            $query = $query->append($append);
        }
        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query = $query->order($filter['sort_field'], $filter['sort_order']);
        }

        $total = $query->count();
        $list = $query->page($filter['page'], $filter['size'])->select();

        foreach ($list as $item) {

            if (!$item['first_user_message']->isEmpty() && !$item['servant_message']->isEmpty()) {
                // 用户首次发送消息的时间
                $first_user_ms = implode(',',array_column($item['first_user_message']->toArray(), "send_time"));
                $first_user_ms = Time::toTime($first_user_ms);

                // 客服响应时间
                $first_servant_ms = intval(implode(',',array_column($item['servant_message']->toArray(), "first_send_time")));
                $last_servant_ms = intval(implode(',',array_column($item['servant_message']->toArray(), "last_send_time")));
                $message_count = implode(',',array_column($item['servant_message']->toArray(), "message_count"));

                // 客服首次响应的时长
                $item->first_response_time = $first_servant_ms - $first_user_ms;

                // 客服平均响应时长 --- （客服最后一次回复时间 - 客服第一次回复时间） / 回复次数
                if ($message_count > 1) {
                    $item->average_response_time = floor(($last_servant_ms - $first_servant_ms) / $message_count);
                }else{
                    $item->average_response_time = 0;
                }
            }else{
                $item->first_response_time = 0;
                $item->average_response_time = 0;
            }
        }

        return ['list' => $list,'total' => $total];
    }

    /**
     * 会话转接
     * @param array $params
     * @return true
     * @throws ApiException
     */
    public function changeServant(array $params): bool
    {
        $this->model->where('id', $params['conversation_id'])->update([
            'last_servant_id' => $params['servant_id'],
            'status' => 1
        ]);
        //给新客服发送一个提醒

        return true;
    }

    /**
     * 创建会话
     * @param array $data
     * @return Conversation|\think\Model
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * 更新会话
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id,array $data): bool
    {
        return $this->model->find($id)->save($data);
    }

    public function findByWhere(array $where)
    {
        return $this->model->where($where)->find();
    }

    public function getConversationByShop(array $where)
    {
        return $this->model->where([
            'user_id' => $where['user_id'],
            'shop_id' => $where['shop_id'],
            'is_delete' => 0,
        ])->find();
    }

    /**
     * 自动结束会话
     * @return bool
     */
    public function autoEndConversation():bool
    {
        try {
            $this->model->with(['last_message'])
                ->where(['status' => Conversation::STATUS_IN_PROGRESS,'is_delete' => 0])
                ->chunk(20, function ($conversation) {
                    $now = Time::now();
                    foreach ($conversation as $item) {
                        if (!$item['last_message']->isEmpty()) {
                            $last_time = implode(',', array_column($item['last_message']->toArray(), 'send_time'));
                            $last_time = Time::toTime($last_time);
                            // 10分钟没有回复则自动结束会话
                            if ($now - $last_time > 600) {
                                $this->endConversation($item);
                            }
                        }
                    }
                });
            return true;
        }catch (\Exception $e) {
            return false;
        }
    }

    /**
     * 会话结束
     * @param Conversation $conversation
     * @return bool
     */
    public function endConversation(Conversation $conversation): bool
    {
        $this->model->where('id', $conversation['id'])->update([
            'status' => Conversation::STATUS_CLOSED,
            'last_update_time' => Time::now()
        ]);
        app(MessageService::class)->endConversationMessage($conversation['id']);
        //更新客服接待数量
        app(ServantService::class)->updateServantConversationNum($conversation['last_servant_id']);
        return true;
    }

    /**
     * 搜索接口
     * @return array
     */
    public function search(string $keyword, int $servant_id)
    {
        //搜索我的会话用户
        $userList = $this->model->withJoin([
            'user' => function ($query) use ($keyword) {
                $query->whereLike('username', "%{$keyword}%");
            }
        ], 'LEFT')->where('last_servant_id', $servant_id)->group('user.user_id')->limit(100)->select();
//        if ($userList) {
//            $userList = $userList->toArray();
//            foreach ($userList as &$user) {
//                $user = $user['user'];
//            }
//        }
        //搜索会话
        $conversationList = Conversation::with(['user'])->hasWhere('message', function ($query) use ($keyword) {
            $query->whereLike('content', "%{$keyword}%")->where('message_type', 'text');
        })->where('last_servant_id', $servant_id)->where('Conversation.status',
            1)->limit(100)->field(['Message.content'])->select();
        if ($conversationList) {
            foreach ($conversationList as &$conversation) {
                $conversation['content'] = json_decode($conversation['content'], true);
            }
        }
        return [
            'userList' => $userList,
            'conversationList' => $conversationList
        ];
    }

}