<?php

namespace app\service\front\merchant;

use app\model\merchant\Apply;
use app\model\merchant\MerchantAccount;
use app\service\admin\authority\AdminUserService;
use app\service\admin\merchant\AdminUserShopService;
use app\service\admin\merchant\MerchantService;
use app\service\admin\merchant\ShopService;
use app\service\admin\user\UserService;
use app\service\common\BaseService;
use app\service\common\merchant\ApplyCoreService;
use exceptions\ApiException;
use think\facade\Db;
use utils\Time;

class ApplyService extends BaseService
{

    protected Apply $merchantApplyModel;
    protected ApplyCoreService $applyCoreService;


    public function __construct(Apply $merchantApplyModel, ApplyCoreService $applyCoreService)
    {
        $this->merchantApplyModel = $merchantApplyModel;
        $this->applyCoreService = $applyCoreService;
    }

    /**
     * 创建入驻申请
     * @param $data
     * @return Apply|\think\Model
     */
    public function createApply($data): \think\Model|Apply
    {
        try {
            Db::startTrans();

            if (isset($data['status']) && $data['status'] == 10) {
                $data['audit_time'] = Time::now();
            }

            $result = $this->applyCoreService->create($data);

            if ($result && isset($data['status']) && $data['status'] == 10) {
                // 审核通过 -- 执行相关操作
                $this->auditRelated($result->getKey(),$data);
            }

            Db::commit();
        }catch (\Exception $e) {
            Db::rollback();
            throw new ApiException($e->getMessage() . $e->getFile() . $e->getLine() . $e->getTraceAsString());
        }

        return $result;
    }

    /**
     * 入驻审核通过之后的操作
     * @param int $merchant_apply_id
     * @param array $data
     * @return void
     * @throws ApiException
     */
    public function auditRelated(int $merchant_apply_id,array $data): void
    {
        // 创建商户
        $merchantDetail = app(MerchantService::class)->create([
            "merchant_apply_id" => $merchant_apply_id,
            "user_id" => $data['user_id'],
            "base_data" => $data['base_data'],
            "shop_data" => $data['shop_data'],
            "merchant_data" => $data['merchant_data'],
            "type" => $data['type'],
            "company_name" => $data['company_name'],
            "corporate_name" => $data['corporate_name']
        ]);

        // 关联后台管理员
        $userInfo = app(UserService::class)->getDetail($data['user_id']);
        $adminUser = app(AdminUserService::class)->getAdminByMobile($userInfo['mobile']);
        if (!$adminUser) {
            $adminId = app(AdminUserService::class)->createAdminUser([
                'username' => $userInfo['mobile'],
                'mobile' => $userInfo['mobile'],
                'email' => $userInfo['email'],
                'password' => '',
                'admin_type' => 'shop',
                'role_id' => 1,
                'avatar' => '',
                'pwd_confirm' => '',
                'merchant_id' => $merchantDetail->merchant_id,
                'is_admin' => 1
            ]);
        } else {
            $adminId = $adminUser->admin_id;
        }
        // 创建店铺
        $shop = app(ShopService::class)->create([
            'merchant_id' => $merchantDetail->merchant_id,
            'shop_logo' => isset($data['shop_data']['shop_logo']['0']['pic_url']) ? $data['shop_data']['shop_logo']['0']['pic_url'] : '',
            'shop_title' => $data['shop_title']
        ]);

        // 创建店铺管理员员工
        app(AdminUserShopService::class)->createAdminUserShop([
            'shop_id' => $shop->shop_id,
            'admin_id' => $adminId,
            'username' => $userInfo['mobile'],
            'email' => $userInfo['email'],
            'is_admin' => 1
        ]);

        // 创建商家账户
        app(MerchantAccount::class)->create([
            'account_type' => 1,
            'account_name' => $data['type'] == 1 ? $data['corporate_name'] : $data['company_name'],
            'account_no' => isset($data['merchant_data']['bank_card']) ? $data['merchant_data']['bank_card'] : '',
            'bank_name' => isset($data['merchant_data']['bank_deposit']) ? $data['merchant_data']['bank_deposit'] : '',
            'bank_branch' => isset($data['merchant_data']['bank_branch']) ? $data['merchant_data']['bank_branch'] : '',
            'shop_id' => $shop->shop_id,
        ]);
    }

    /**
     * 详情
     * @param $id
     * @return \app\model\merchant\Merchant|mixed
     */
    public function getDetail($id): mixed
    {
        $result = $this->applyCoreService->getDetail($id);
        return $result;
    }

    public function getApplyByUserId(int $user_id)
    {
        return $this->merchantApplyModel->where('user_id', $user_id)->order('merchant_apply_id',
            'desc')->field(['merchant_apply_id,status,type'])->find();
    }



}