<?php

namespace app\im\model;


class Config extends BaseModel
{
    protected $pk = 'id';
    protected $table = 'im_config';
    protected $json = ['data'];
    protected $jsonAssoc = true;

}