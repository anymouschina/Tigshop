<?php
//**---------------------------------------------------------------------+
//** 服务层文件 -- 会员等级
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\service\admin\user;

use app\model\user\UserRank;
use app\model\user\UserRankConfig;
use app\service\common\BaseService;
use exceptions\ApiException;

/**
 * 会员等级服务类
 */
class UserRankService extends BaseService
{
    protected UserRank $userRankModel;

    public function __construct(UserRank $userRankModel)
    {
        $this->userRankModel = $userRankModel;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->userRankModel->query();
        // 处理筛选条件

        if (isset($filter['rank_name']) && !empty($filter['rank_name'])) {
            $query->where('rank_name', 'like', '%' . $filter['rank_name'] . '%');
        }

        if (isset($filter['rank_type']) && !empty($filter['rank_type'])) {
            $query->where('rank_type', $filter['rank_type']);
        }
        return $query;
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @return Object
     * @throws ApiException
     */
    public function getDetail(): Object
    {
        return UserRank::select();
    }

    public function getUserRankList()
    {
        $result = $this->userRankModel->field('rank_id,rank_name,rank_type,discount,free_shipping,rank_point')->order('min_growth_points')->select();
        return $result->toArray();
    }

    /**
     * 更新会员等级
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function updateUserRank(array $data):bool
    {
        if (empty($data['rank_type'])) {
            throw new ApiException('请选择会员等级类型');
        }
        if (count($data['data']) == 0) {
            throw new ApiException('等级配置至少保存一个');
        }

        $user_rank = [];
        foreach ($data['data'] as $k => $item) {
            $user_rank[$k] = [
                "rank_name" => $item['rank_name'],
                "min_growth_points" => $item['min_growth_points'],
                "discount" => $item['discount'],
                "rank_type" => $data['rank_type'],
                "rank_ico" => $item['rank_ico'],
                "rank_bg" => $item['rank_bg'],
                "rank_point" => $item['rank_point'],
                "free_shipping" => $item['free_shipping'],
                "rights" => $item['rights']
            ];
        }

        try {
            // 删除旧数据
            UserRank::where("rank_id",">",0)->delete();
            (new UserRank)->saveAll($user_rank);
            // 更新配置
            UserRankConfig::where('code','rank_config')->save(["rank_type" => $data['rank_type'],'data' => $data['config']]);
            return  true;
        } catch (\Exception $e) {
            throw new ApiException($e->getMessage());
        }
    }

    /**
     * 获取会员配置
     * @return UserRankConfig|null
     */
    public function getRankConfig(): ?UserRankConfig
    {
        $config = UserRankConfig::where('code','rank_config')->findOrEmpty();
        return !empty($config) ? $config : null;
    }

}
