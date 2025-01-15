<?php

namespace app\im\model;

use app\model\authority\AdminUser;
use app\model\user\User;

class Message extends BaseModel
{
    protected $pk = 'id';
    protected $table = 'im_message';
    protected $createTime = "send_time";
    protected $autoWriteTimestamp = true;
    protected $json = ['content'];
    protected $jsonAssoc = true;

    protected $append = [
        'message_type_text'
    ];

    public $messageTypeText = [
        'text' => '文字',
        'image' => '图片',
        'custom' => '自定义',
        'sound' => '语音',
        'video' => '视频',
        'file' => '文件'
    ];
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
        return $this->hasOne(AdminUser::class, 'admin_id', 'servant_id')->field([
            'admin_id',
            'username',
            'avatar'
        ]);
    }

    const TYPE_USER = 1;
    const TYPE_SERVANT = 2;
    const TYPE_SYSTEM = 3;

    const TYPE_MAP = [
        self::TYPE_USER => '用户发的',
        self::TYPE_SERVANT => '客服发的',
        self::TYPE_SYSTEM => '系统'
    ];


    public function getMessageTypeTextAttr($value, $data)
    {
        return $this->messageTypeText[$data['message_type']] ?? '';
    }


}