<?php

namespace app\service\admin\lang;

use app\model\common\Currency;
use app\service\common\BaseService;
use exceptions\ApiException;

class CurrencyService extends BaseService
{
    /**
     * 筛选查询
     * @param array $filter
     * @return object|\think\db\BaseQuery
     */
    public function filterQuery(array $filter): object
    {
        $query = Currency::query();

        if (isset($filter['name']) && !empty($filter['name'])) {
            $query->whereLike('name','%' . $filter['name'] . '%');
        }

        return $query;
    }

    /**
     * 获取详情
     * @param int $id
     * @return Currency
     * @throws ApiException
     */
    public function getDetail(int $id): Currency
    {
        $currency = Currency::find($id);
        if (empty($currency)) {
            throw new ApiException(/** LANG */'信息不存在');
        }
        return $currency;
    }

    /**
     * 创建
     * @param array $data
     * @return int
     * @throws \think\db\exception\DbException
     */
    public function createCurrency(array $data): int
    {
        // 获取默认货币
        $default_currency = Currency::where('is_default',1)->find();
        if (!$default_currency && !empty($data['rate'])) {
            throw new ApiException(/** LANG */'请先设置默认货币作为基准汇率');
        }
        if (isset($data['is_default']) && $data['is_default']) {
            // 默认币种不设置汇率
            unset($data['rate']);
            if (Currency::where('is_default',1)->count()) {
                Currency::where('is_default',1)->save(['is_default' => 0]);
            }
            // 清除其他汇率
            Currency::where('is_default',0)->save(['rate' => '']);
        }
        $currency = Currency::create($data);
        return $currency->getKey();
    }

    /**
     * 更新
     * @param int $id
     * @param array $data
     * @return bool
     * @throws ApiException
     * @throws \think\db\exception\DbException
     */
	public function updateCurrency(int $id, array $data): bool
	{
		$currency = $this->getDetail($id);
		// 获取默认货币
		$default_currency = Currency::where('is_default',1)->find();
		if (!empty($default_currency)) {
			if ($default_currency->id != $id) {
				if (isset($data['is_default']) && $data['is_default']) {
					unset($data['rate']);
					Currency::where('is_default',1)->save(['is_default' => 0]);
					Currency::where('is_default',0)->save(['rate' => '']);
				}
			} else {
				if (isset($data['is_default']) && empty($data['is_default'])) {
					unset($data['rate']);
					Currency::where('is_default',0)->save(['rate' => '']);
				}
			}
		} else {
			if (isset($data['is_default'])) {
				if ($data['is_default']) {
					unset($data['rate']);
				} else {
					if (!empty($data['rate'])) {
						throw new ApiException(/** LANG */'请先设置默认货币作为基准汇率');
					}
				}
			}
		}
		return $currency->save($data);
	}

    /**
     * 删除
     * @param int $id
     * @return bool
     * @throws ApiException
     */
    public function deleteCurrency(int $id): bool
    {
        $currency = $this->getDetail($id);
        if ($currency->is_default) {
            throw new ApiException(/** LANG */'默认币种不能删除');
        }
        return $currency->delete();
    }

    /**
     * 更新字段
     * @param int $id
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function updateCurrencyField(int $id, array $data): bool
    {
        $currency = $this->getDetail($id);
        // 获取默认货币
        $default_currency = Currency::where('is_default',1)->find();
        if (in_array('is_default',array_keys($data))) {
            if ($data['is_default']) {
				if (!empty($default_currency)) {
					if ($default_currency->id != $id) {
						// 改变默认货币
						Currency::where('is_default',1)->save(['is_default' => 0]);
						// 清空汇率
						Currency::where('is_default',0)->save(['rate' => '']);
					}
				} else {
					Currency::where('is_default',0)->save(['rate' => '']);
				}
            } else {
				if (!empty($default_currency)) {
					Currency::where('is_default',0)->save(['rate' => '']);
				}
			}
        }
        return $currency->save($data);
    }

    /**
     * 批量操作
     * @param int $id
     * @return bool
     * @throws ApiException
     */
    public function batchOperation(int $id):bool
    {
        if (!$id) {
            throw new ApiException(/** LANG */'#参数错误');
        }
        $currency = $this->getDetail($id);
        return $currency->delete();
    }
}
