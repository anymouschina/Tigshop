<?php
//**---------------------------------------------------------------------+
//** 服务层文件 -- 店铺
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\service\admin\merchant;

use app\model\merchant\Merchant;
use app\model\merchant\MerchantUser;
use app\model\merchant\Shop;
use app\service\common\BaseService;
use app\service\common\merchant\MerchantCoreService;
use exceptions\ApiException;

/**
 * 商户服务类
 */
class MerchantService extends BaseService
{
    protected Merchant $merchantModel;
    protected MerchantCoreService $merchantCoreService;

    public function __construct(Merchant $merchantModel, MerchantCoreService $merchantCoreService)
    {
        $this->merchantModel = $merchantModel;
        $this->merchantCoreService = $merchantCoreService;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->merchantModel->query();
        // 处理筛选条件

        if (isset($filter['keyword']) && !empty($filter['keyword'])) {
            $query->where('company_name|corporate_name', 'like', '%' . $filter['keyword'] . '%');
        }

        if (isset($filter['merchant_id']) && $filter['merchant_id'] > -1) {
            $query->where('merchant_id', $filter['merchant_id']);
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @return array
     * @throws ApiException
     */
    public function getDetail(int $id): mixed
    {
        $result = $this->merchantCoreService->getDetail($id);

        if (!$result) {
            throw new ApiException('店铺不存在');
        }
        return $result;
    }

    /**
     * 创建商户
     * @param array $data
     * @return \think\Model|Merchant
     */
    public function create(array $data): Merchant|\think\Model
    {
        return $this->merchantModel->create($data);
    }

    /**
     * 执行添加或更新
     *
     * @param int $id
     * @param array $data
     * @param bool $isAdd
     * @return int|bool
     * @throws ApiException
     */
    public function update(int $id, array $data, bool $isAdd = false)
    {
        if ($isAdd) {
            $result = $this->merchantModel->create($data);
            return $this->merchantModel->getKey();
        } else {
            if (!$id) {
                throw new ApiException('#id错误');
            }
            $result = $this->merchantModel->where('merchant_apply_id', $id)->save($data);
            return $result !== false;
        }
    }

    /**
     * 执行审核
     *
     * @param int $id
     * @param int $status
     * @return int|bool
     * @throws ApiException
     */
    public function audit(int $id, int $status)
    {
        $result = $this->merchantModel->where('merchant_apply_id', $id)->save([
            'status' => $status,
            'audit_time' => time(),
        ]);
        return $result !== false;
    }

    /**
     * 更新单个字段
     *
     * @param int $id
     * @param array $data
     * @return int|bool
     * @throws ApiException
     */
    public function updateField(int $id, array $data)
    {
        if (!$id) {
            throw new ApiException('#id错误');
        }
        $result = $this->merchantModel::where('merchant_id', $id)->save($data);
        return $result !== false;
    }

    /**
     * 删除
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        if (!$id) {
            throw new ApiException('#id错误');
        }
        $result = $this->merchantModel->destroy($id);
        return $result !== false;
    }

    public function createUser(array $data)
    {
        return MerchantUser::create($data);
    }

    public function getMerchantUser(int $adminUserId)
    {
        return MerchantUser::where('admin_user_id', $adminUserId)->find();
    }

    public function getMerchantAdmin(int $merchantId)
    {
        return MerchantUser::where('merchant_id', $merchantId)->where('is_admin', 1)->find();
    }

    /**
     * 创建店铺时，如果商户表里的shop_data为空，需要将店铺信息更新到shop_data字段
     * @param int $merchantId
     * @param int $shopId
     * @return void
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function updateShopDataByCreateShop(int $merchantId, int $shopId): bool
    {
        if (empty($merchantId)) {
            return false;
        }
        $merchant = Merchant::find($merchantId);
        if (empty($merchant)) {
            throw new ApiException('商户不存在');
        }
        if (empty($merchant->shop_data)) {
            $shop = Shop::find($shopId);
            $shop_data = [
                'shop_logo' => [
                    [
                        'pic_thumb' => '',
                        'pic_url' => $shop->shop_logo,
                        'pic_name' => ''
                    ]
                ],
                'shop_title' => $shop->shop_title,
                'contact_mobile' => $shop->contact_mobile,
                'description' => $shop->description,
            ];
            $merchant->shop_data = json_encode($shop_data);
            return $merchant->save();
        }
        return true;
    }

    /**
     * 判断当前登录用户是否为商户管理员
     * @param int $adminUserId
     * @return int
     * @throws ApiException
     */
    public function isMerchantAdmin(int $adminUserId): int
    {
        $merchantUser = $this->getMerchantUser($adminUserId);
        if (empty($merchantUser)) {
            throw new ApiException('该管理员不是商户管理员');
        }
        return $merchantUser->is_admin;
    }

    /**
     * 根据店铺获取商户信息
     * @param int $shop_id
     * @return string
     * @throws ApiException
     */
    public function getMerchantByShopId(int $shop_id): string
    {
        $shop = Shop::find($shop_id);
        if (empty($shop)) {
            throw new ApiException("店铺不存在");
        }
        $merchant = Merchant::where("merchant_id", $shop->merchant_id)->hidden(['base_data', "shop_data", "merchant_data"])->find();
        if (empty($merchant)) {
            throw new ApiException("商户不存在");
        }

        $merchant_name = $merchant->type == 1 ? $merchant->corporate_name : $merchant->company_name;
        return $merchant_name;
    }
}
