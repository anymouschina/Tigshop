<?php

namespace app\service\admin\merchant;

use app\model\authority\AdminRole;
use app\model\authority\AdminUser;
use app\model\merchant\AdminUserShop;
use app\service\admin\authority\AdminUserService;
use app\service\common\BaseService;
use exceptions\ApiException;
use log\AdminLog;
use utils\Config;

class AdminUserShopService extends BaseService
{
    /**
     * 获取列表查询条件
     * @param array $filter
     * @return object|\think\db\BaseQuery
     */
    public function filterQuery(array $filter): object
    {
        $query = AdminUserShop::query();
        if (isset($filter['username']) && !empty($filter['username'])) {
            $query->where('username', 'like', '%' . $filter['username'] . '%');
        }

        if (isset($filter['shop_id']) && !empty($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }

        if (isset($filter['admin_id']) && !empty($filter['admin_id'])) {
            $query->where('admin_id', $filter['admin_id']);
        }

        if (isset($filter['is_using'])) {
            $query->where('is_using', $filter['is_using']);
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 获取详情
     * @param int $id
     * @return AdminUserShop
     * @throws ApiException
     */
    public function getDetail(int $id): AdminUserShop
    {
        $adminUserShop = AdminUserShop::with(['admin_user','user'])->find($id);
        if (empty($adminUserShop)) {
            throw new ApiException(/** LANG */'员工不存在');
        }
        return $adminUserShop;
    }

    /**
     * 判断手机号是否被绑定
     * @param array $data
     * @return array
     * @throws ApiException
     */
    public function checkMobileUser(array $data):array
    {
        // 判断手机号是否被绑定
        $mobile_user = AdminUser::where(['mobile' => $data['mobile']])->find();
        if (empty($mobile_user)) {
            $data['admin_id'] = app(AdminUserService::class)->createAdminUser(array_merge($data,
                ['admin_type' => 'shop']));
        } else {
            $data['admin_id'] = $mobile_user->admin_id;
        }
        return $data;
    }

    /**
     * 新增店铺员工
     * @param array $data
     * @return int
     * @throws ApiException
     */
    public function createAdminUserShop(array $data):int
    {
        if ($data['shop_id']) {
            // 限制店铺子管理员数量 -- 员工数量限制
            $sub_user_count = AdminUserShop::where(['shop_id' => $data['shop_id'],'is_admin' => 0])->count();
            $max_user = Config::get("max_sub_administrator",'shop');
            if ($sub_user_count >= $max_user) {
                throw new ApiException(/** LANG */"店铺子管理员数量不能超过{$max_user}个,如需修改,请前往配置");
            }
        }
        if (empty($data['admin_id'])) {
            $data = $this->checkMobileUser($data);
        }

        if (empty($data['avatar'])) {
            $rand = rand(1, 34);
            $data['avatar'] = '../assets/avatar/' . $rand . '.jpeg';
        }


		if (!isset($data['username'])) {
			$username = AdminUser::find($data['admin_id'])->username;
		} else {
			$username = $data['username'];
		}

        // 分配权限
        if (isset($data['role_id']) && $data["role_id"] > 0) {
            $data["auth_list"] = AdminRole::find($data["role_id"])->authority_list;
        }

        $result = AdminUserShop::create($data);
        if (request()->adminUid) {
            AdminLog::add("新增员工:" . $username);
        }
        return $result->id;
    }

    /**
     * 编辑员工
     * @param int $id
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function updateAdminUserShop(int $id,array $data): bool
    {
        $adminUserShop = AdminUserShop::with(['admin_user'])->find($id);
        if (empty($adminUserShop)) {
            throw new ApiException(/** LANG */'员工不存在');
        }

        if ($data['mobile'] != $adminUserShop['admin_user']['mobile']) {
            $data = $this->checkMobileUser($data);
        }

        if (empty($data['avatar'])) {
            $rand = rand(1, 34);
            $data['avatar'] = '../assets/avatar/' . $rand . '.jpeg';
        }

        // 分配权限
        if (isset($data['role_id']) && $data["role_id"] > 0) {
            $data["auth_list"] = AdminRole::find($data["role_id"])->authority_list;
        }

        $result = $adminUserShop->save($data);
        AdminLog::add("编辑员工信息:" . $data['username']);
        return $result !== false;
    }

    /**
     * 删除员工
     * @param int $id
     * @return bool
     * @throws ApiException
     */
    public function deleteAdminUserShop(int $id,int $admin_id = 0):bool
    {
        $adminUserShop = $this->getDetail($id);
        // 自己不能删除自己
        if ($admin_id == $adminUserShop['admin_id']) {
            throw new ApiException(/** LANG */'不能删除自己');
        }

        $result = $adminUserShop->delete();
		AdminLog::add("删除员工信息:" . $adminUserShop['username']);
        return $result !== false;
    }

    /**
     * 获得该员工所有店铺
     * @param int $adminId
     * @return array
     */
    public function getShopIds(int $adminId): array
    {
        return AdminUserShop::where(['admin_id' => $adminId])->column('shop_id');
    }

    /**
     * 修改员工信息
     * @param array $data
     * @return bool
     * @throws ApiException
     */
    public function modifyUser(array $data): bool
    {
        $adminUserShop = AdminUserShop::find($data['id']);
        if (empty($adminUserShop)) {
            throw new ApiException(/** LANG */'信息不存在');
        }

        if (empty($data['avatar'])) {
            $rand = rand(1, 34);
            $data['avatar'] = '../assets/avatar/' . $rand . '.jpeg';
        }
        unset($data['mobile']);
        return $adminUserShop->save($data);
    }

    /**
     * 员工信息详情
     * @param int $admin_id
     * @param int $shop_id
     * @return AdminUserShop
     * @throws ApiException
     */
    public function getUserShopInfo(int $admin_id,int $shop_id): AdminUserShop
    {
        $adminUserShop = AdminUserShop::with(['admin_user'])->where(['admin_id' => $admin_id,"shop_id" => $shop_id])->find();
        if (empty($adminUserShop)) {
            throw new ApiException(/** LANG */'信息不存在');
        }
        return $adminUserShop;
    }

    /**
     * 通过用户id查询是否有店铺
     * @param int $user_id
     * @return bool
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function hasShop(int $user_id)
    {
        $admin_user_shop = new AdminUserShop();
        $find  = $admin_user_shop->where('user_id',$user_id)->find();
        if ($find) {
            return true;
        } else {
            return false;
        }
    }
}
