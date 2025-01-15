<?php

namespace app\im\model;

use app\model\authority\AdminUser;
use app\model\user\User;

class Servant extends BaseModel
{
    protected $pk = 'id';
    protected $table = 'im_servant';
    protected $createTime = "add_time";

    protected $jsonAssoc = true;

    public function user()
    {
        return $this->hasOne(AdminUser::class, 'admin_id', 'servant_id')->field([
            'admin_id',
            'username',
            'avatar'
        ]);
    }
}