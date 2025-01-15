<?php

namespace app\im\service\servant;

use app\im\model\Conversation;
use app\im\model\Servant;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\TigQueue;

class ServantService extends BaseService
{

    public function __construct(Servant $servant)
    {
        $this->model = $servant;
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
        if (isset($filter['can_transfer'])) {
            $query = $query->where('last_update_time', '>=', time() - 60)->where('status', 1);
        }
        if (isset($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }
        return $query;
    }


    public function detail($servantId)
    {
        return $this->model->where('servant_id', $servantId)->find();
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update($servantId, array $data)
    {
        $detail = $this->detail($servantId);
        if (!$detail) {
            $this->create(['servant_id' => $servantId, 'shop_id' => $data['shop_id']]);
        }
        $data['last_update_time'] = time();
        return $this->model->where('servant_id', $servantId)->update($data);
    }

    public function updateServantConversationNum($servantId)
    {
        $conversation_num = Conversation::where('last_servant_id', $servantId)->where('status', 1)->count();
        return $this->model->where('servant_id', $servantId)->update(['conversation_num' => $conversation_num]);
    }

    /**
     *
     * @return void
     */
    public function getOneOnlineServantId(int $shopId)
    {
        $servant = $this->model->where('shop_id', $shopId)->where('status', 1)->order('conversation_num',
            'asc')->find();
        if ($servant) {
            return $servant->servant_id;
        } else {
            return false;
        }
    }

    /**
     * 根据情况提示
     * @param $params
     * @return void
     */
    public function checkServantStatusAndAutoMessage($params)
    {
        //如果第一次有会员
        if ($params['last_servant_id']) {
            //如果是创建会话而且有客服，发欢迎语句
            $params['type'] = 'autoWelcome';
            app(TigQueue::class)->later('app\im\job\AutoMessageJob', 2,
                $params);
        } else {
            //如果没有客服，看是否客服在忙
            if ($this->model->where('shop_id', $params['shop_id'])->where('status', 2)->count() > 0) {
                $params['type'] = 'autoWaiting';
                app(TigQueue::class)->later('app\im\job\AutoMessageJob', 2,
                    $params);
            } else {
                $params['type'] = 'autoOffWork';
                app(TigQueue::class)->later('app\im\job\AutoMessageJob', 2,
                    $params);
            }
        }

    }


}