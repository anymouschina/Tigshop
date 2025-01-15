<?php

namespace app\model\user;

use app\model\BaseModel;

class UserRankConfig extends BaseModel
{
    protected $pk = 'id';
    protected $table = 'user_rank_config';
    protected $json = ['data'];
    protected $jsonAssoc = true;
}