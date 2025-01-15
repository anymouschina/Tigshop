<?php

namespace app\service\admin\salesman;

use app\model\salesman\Config;
use app\service\common\BaseService;
use exceptions\ApiException;

class ConfigService extends BaseService
{
    /**
     * 保存配置
     * @param string $code
     * @param array $data
     * @return bool
     * @throws ApiException
     */

    public function saveConfig(string $code, array $data, int $shop_id = 0): bool
    {
        if (empty($code)) {
            throw new ApiException(/** LANG */ '传参错误');
        }

        // 分销模式配置验证
        if ($code == 'salesman_config') {
            $this->adjustLevels($data['level']);
        }

        $config = Config::where(['code' => $code, 'shop_id' => $shop_id])->findOrEmpty();
        if ($config->isEmpty()) {
            // 新增配置
            Config::create(['code' => $code, 'shop_id' => $shop_id, 'data' => $data]);
        } else {
            $config->save(['data' => $data]);
        }
        return true;
    }

    /**
     * 分销模式配置验证
     * @param $levels
     * @return bool
     * @throws ApiException
     */
    public function adjustLevels($levels): bool
    {
        $count = count($levels);
        for ($i = 1; $i < $count - 1; $i++) {
            $current = &$levels[$i];
            $previous = $levels[$i + 1];

            foreach ($current['condition'] as $key => &$condition) {
                // 检查下一级是否有相同的项且checked为true
                if ($condition['checked']) {
                    // 则对应的下级必须也为true
                    if (isset($previous['condition'][$key])) {
                        if (!$previous['condition'][$key]['checked']) {
                            throw new ApiException(/** LANG */ '下一级的选项必须参考上一级的选项选中');
                        } else {
                            // 验证下级value大于上级一级的value
                            if (isset($previous['condition'][$key]['value'])) {
                                if ($condition['value'] > $previous['condition'][$key]['value']) {
                                    throw new ApiException(/** LANG */ "选项【{$condition['title']}】需大于上一等级金额({$condition['value']})");
                                }
                            } else {
                                throw new ApiException(/** LANG */ '请设置需求条件的金额');
                            }
                        }
                    } else {
                        throw new ApiException(/** LANG */ '升级条件的需求设置错误');
                    }
                }
            }
        }
        return true;
    }



    /**
     * 获取配置详情
     * @param string $code
     * @return array|null
     * @throws ApiException
     */
    public function getDetail(string $code, int $shop_id = 0): ?array
    {
        $data = Config::where(['code' => $code, 'shop_id' => $shop_id])->findOrEmpty();
        return !empty($data['data']) ? $data['data'] : null;
    }

    /**
     * 获得指定分销员佣金比例
     * @param int $level
     * @return mixed|void
     * @throws ApiException
     */
    public function getSalesmanCommissionRate(int $level): mixed
    {
        $detail = $this->getDetail('salesman_config');
        if (!empty($detail['level'])) {
            foreach ($detail['level'] as $key => $value) {
                if ($level == $value['id']) {
                    return $value['rate'];
                }
            }
        }
    }


    /**
     * 获取分销模式
     * @param string $code
     * @return array|null
     * @throws ApiException
     */
    public function getSalesmanConfig(): ?array
    {

        $data = Config::where(['code' => 'salesman_config'])->findOrEmpty();
        $data = !empty($data['data']) ? $data['data'] : null;
        return $data;
    }

    /**
     * 获取结算设置
     * @param string $code
     * @return array|null
     * @throws ApiException
     */
    public function getSalesmanSettlement(): ?array
    {
        $data = Config::where(['code' => 'salesman_settlement'])->findOrEmpty();
        $data = !empty($data['data']) ? $data['data'] : null;
        return $data;
    }
}