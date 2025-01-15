<?php

namespace app\service\common\merchant;

use app\model\merchant\Merchant;
use app\model\setting\Region;

/**
 * 商户管理核心服务
 */
class MerchantCoreService
{
    protected Merchant $merchantModel;

    public function __construct(Merchant $merchant)
    {
        $this->merchantModel = $merchant;
    }


    /**
     * 获取详情
     *
     * @param int $merchant_id
     * @return Merchant|mixed
     */
    public function getDetail(int $merchant_id, string $field = '*'): mixed
    {
        $result = $this->merchantModel->with(['user'])->field($field)->where('merchant_id',
            $merchant_id)->find()->toArray();

        if (!empty($result['base_data']['license_addr_province'])) {
            $regionList = Region::whereIn('region_id',
                $result['base_data']['license_addr_province'])->column('region_name', 'region_id');
            $result['base_data']['license_addr_province_name'] = '';
            foreach ($result['base_data']['license_addr_province'] as $regionId) {
                $result['base_data']['license_addr_province_name'] .= $regionList[$regionId] ?? '';
            }
        }
        if (!empty($result['merchant_data']['business_address'])) {
            $regionList = Region::whereIn('region_id',
                $result['merchant_data']['business_address'])->column('region_name',
                'region_id');
            $result['merchant_data']['business_address_name'] = '';
            foreach ($result['merchant_data']['business_address'] as $regionId) {
                $result['merchant_data']['business_address_name'] .= $regionList[$regionId] ?? '';
            }
        }
        return $result;
    }

    /**
     * 创建商户
     * @param array $data
     * @return Merchant|\think\Model
     */
    public function create(array $data): Merchant|\think\Model
    {
        $data['add_time'] = time();
        return $this->merchantModel->create($data);
    }

}