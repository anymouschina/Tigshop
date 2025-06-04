<?php

namespace app\service\common\merchant;

use app\model\merchant\Apply;
use app\model\merchant\Merchant;
use app\model\setting\Region;

/**
 * 商户管理核心服务
 */
class ApplyCoreService
{
    protected Apply $applyModel;

    public function __construct(Apply $applyModel)
    {
        $this->applyModel = $applyModel;
    }


    /**
     * 获取详情
     *
     * @param int $merchant_id
     * @return Merchant|mixed
     */
    public function getDetail(int $merchant_id, string $field = '*'): mixed
    {
        $result = $this->applyModel->field($field)->findOrEmpty($merchant_id)->toArray();
        if (!empty($result['base_data']['licenseAddrProvince'])) {
            $regionList = Region::whereIn('region_id',
                $result['base_data']['licenseAddrProvince'])->column('region_name', 'region_id');
            $result['base_data']['licenseAddrProvinceName'] = '';
            foreach ($result['base_data']['licenseAddrProvince'] as $regionId) {
                $result['base_data']['licenseAddrProvinceName'] .= $regionList[$regionId] ?? '';
            }
        }
        if (!empty($result['merchant_data']['businessAddress'])) {
            $regionList = Region::whereIn('region_id',
                $result['merchant_data']['businessAddress'])->column('region_name',
                'region_id');
            $result['merchant_data']['businessAddressName'] = '';
            foreach ($result['merchant_data']['businessAddress'] as $regionId) {
                $result['merchant_data']['businessAddressName'] .= $regionList[$regionId] ?? '';
            }
        }
        return $result ?: null;
    }

    /**
     * 创建商户
     * @param array $data
     * @return Merchant|\think\Model
     */
    public function create(array $data): Merchant|\think\Model
    {
        $data['add_time'] = time();
        return $this->applyModel->create($data);
    }

}