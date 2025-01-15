<?php

namespace app\im\model;

use app\model\authority\AdminUser;
use app\model\merchant\Shop;
use app\model\user\User;
use utils\Time;
use utils\Util;

class Conversation extends BaseModel
{
    protected $pk = 'id';
    protected $table = 'im_conversation';
    protected $createTime = "add_time";
    protected $autoWriteTimestamp = true;

    public function user()
    {
        return $this->hasOne(User::class, 'user_id', 'user_id')->field([
            'user_id',
            'username',
            'nickname',
            'avatar'
        ]);
    }

    public function servant()
    {
        return $this->hasOne(AdminUser::class, 'admin_id', 'last_servant_id')->field([
            'admin_id',
            'username',
            'mobile',
            'avatar'
        ]);
    }

    public function shop()
    {
        return $this->hasOne(Shop::class, 'shop_id', 'shop_id')->field(['shop_id', 'shop_title', 'shop_logo']);
    }

    public function userLastTwoMessage()
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id')->order('id', 'desc')->limit(2);
    }

    public function lastMessage()
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id')->order('id', 'desc')->limit(1);
    }

    public function message()
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id');

    }

    public function unreadMessage()
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id')->where('is_read', 0);

    }

    public function firstUserMessage()
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id')
            ->field(['conversation_id','send_time','user_id','message_type'])
            ->whereIn('type',Message::TYPE_USER)
            ->where('status',1)
            ->limit(1)
            ->order('send_time', 'asc');
    }

    // 客服第一次回复/ 最后一次回复 / 回复次数
    public function servantMessage()
    {
        return $this->hasMany(Message::class, 'conversation_id', 'id')
            ->field(['conversation_id','servant_id','MAX(send_time) as last_send_time',
                'SUBSTRING_INDEX(GROUP_CONCAT(send_time ORDER BY send_time DESC), \',\', -1) as first_send_time',
                'COUNT(id) as message_count','message_type'
            ])
            ->whereIn('type',Message::TYPE_SERVANT)
            ->where('status',1)
            ->limit(1)
            ->order('send_time', 'asc');
    }

    // 会话状态
    const STATUS_NOT_CONNECTED = 0;
    const STATUS_IN_PROGRESS = 1;
    const STATUS_CLOSED = 2;

    const STATUS_MAP = [
        self::STATUS_NOT_CONNECTED => '待接入',
        self::STATUS_IN_PROGRESS => '会话中',
        self::STATUS_CLOSED => '已结束',
    ];

    // 历史会话状态
    const STATUS_HISTORY = [
        self::STATUS_IN_PROGRESS,
        self::STATUS_CLOSED,
    ];

    // 会话时长
    public function getConversationDurationAttr($value, $data)
    {
        if ($data['status'] == self::STATUS_CLOSED) {
            $minutes = ($data['last_update_time'] - $data['add_time']) / 60;
            return Util::number_format_convert($minutes);
        } else {
            return Util::number_format_convert((Time::now() - $data['add_time']) / 60);
        }
    }

    public function getLastUpdateTimeAttr($value, $data)
    {
        return Time::format($data['last_update_time']);
    }

}