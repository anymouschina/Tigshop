<?php
namespace app\api\controller\common;

use app\api\IndexBaseController;
use app\service\admin\lang\CurrencyService;
use think\App;
use think\Response;

class Currency extends IndexBaseController
{
    /**
     * 构造函数
     *
     * @param App $app
     */
    public function __construct(App $app)
    {
        parent::__construct($app);
    }

    /**
     * 获取货币列表
     * @return Response
     */
    public function getCurrency(): Response
    {
        $currency_list = app(CurrencyService::class)->getFilterList([
            "size" => -1
        ]);
        return $this->success($currency_list);
    }
}