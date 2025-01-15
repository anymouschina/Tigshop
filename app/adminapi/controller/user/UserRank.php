<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 会员等级
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\user;

use app\adminapi\AdminBaseController;
use app\service\admin\user\UserRankService;
use think\App;
use think\Response;

/**
 * 会员等级控制器
 */
class UserRank extends AdminBaseController
{
    protected UserRankService $userRankService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param UserRankService $userRankService
     */
    public function __construct(App $app, UserRankService $userRankService)
    {
        parent::__construct($app);
        $this->userRankService = $userRankService;
    }

    /**
     * 列表
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'rank_name' => '',
            'page' => 1,
            'size' => 15,
            'sort_field' => 'rank_id',
            'sort_order' => 'desc',
        ], 'get');

        // 获取配置
        $config = app(userRankService::class)->getRankConfig();
        if (empty($config)) {
            return $this->error(/** LANG */ '请先配置会员等级设置');
        }
        $filter['rank_type'] = $config['rank_type'];
        $filterResult = $this->userRankService->getFilterList($filter,[],['user_rights','user_count']);
        $total = $this->userRankService->getFilterCount($filter);

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 详情
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function detail(): Response
    {
        $item = $this->userRankService->getDetail();
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 编辑
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function update(): \think\Response
    {
        $data = $this->request->only([
            "rank_type/d" => 1,
            'data/a' => [],
            'config' => []
        ], 'post');

        $result = $this->userRankService->updateUserRank($data);
        if ($result) {
            return $this->success('会员等级更新成功');
        } else {
            return $this->error('会员等级更新失败');
        }
    }
}
