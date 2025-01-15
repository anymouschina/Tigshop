<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 管理员管理
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\authority;

use app\adminapi\AdminBaseController;
use app\service\admin\authority\AdminUserService;
use app\service\admin\captcha\CaptchaService;
use app\service\admin\common\sms\SmsService;
use app\validate\authority\AdminUserValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Cache;
use think\facade\Db;
use think\Response;
use utils\Format;

/**
 * APP版本管理控制器
 */
class AdminUser extends AdminBaseController
{
    protected AdminUserService $adminUserService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param AdminUserService $adminUserService
     */
    public function __construct(App $app, AdminUserService $adminUserService)
    {
        parent::__construct($app);
        $this->adminUserService = $adminUserService;
        $this->checkAuthor('adminUserManage'); //权限检查
    }

    /**
     * 列表页面
     *
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'keyword' => '',
            'suppliers_id/d' => 0,
            'page/d' => 1,
            'size/d' => 15,
            'parent_id' => '',
            'sort_field' => 'admin_id',
            'sort_order' => 'desc',
            'shop_id' => request()->shopId,
            'admin_user_type' => ""
        ], 'get');

        if (request()->shopId) {
            $filter['merchant_id'] = request()->merchantId;
        }
		if (request()->suppliersId){
			$filter['suppliers_id'] = request()->suppliersId;
		}

        $filterResult = $this->adminUserService->getFilterResult($filter);
        $total = $this->adminUserService->getFilterCount($filter);

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 配置型
     * @return Response
     */
    public function config(): Response
    {
        $shopId = request()->shopId;
        $admin_type = request()->adminType;
        return $this->success([
            'Role_list' => $this->adminUserService->getRoleList($shopId,$admin_type),
        ]);
    }

    /**
     * 详情页面
     * @return Response
     */
    public function detail(): Response
    {
        $id = input('id/d', 0);
        $item = $this->adminUserService->getDetail($id);
        $item['encipher_mobile'] = Format::dimMobile($item->mobile);

        return $this->success([
            'item' => $item,
        ]);
    }
    /**
     * 管理员详情
     * @return Response
     */
    public function mineDetail(): Response
    {
        $item = $this->adminUserService->getDetail(request()->adminUid);
        $item['mobile'] = Format::dimMobile($item->mobile);

        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 执行添加操作
     * @return Response
     * @throws ApiException
     */
    public function create(): Response
    {
        $data = $this->request->only([
            'username' => '',
            'mobile' => '',
            'avatar' => '',
            'password' => '',
            'email' => '',
            'auth_list' => [],
            'role_id/d' => 0,
            'parent_id/d' => 0,
            'pwd_confirm' => '', // 确认密码
            'shop_id' => request()->shopId,
            'is_using/d' => 0,
            'suppliers_id/d' => 0,
            'admin_type' => ''
        ], 'post');

        $data["merchant_id"] = request()->merchantId;
        if (request()->shopId) {
            $data['shop_id'] = request()->shopId;
            $data['user_id'] = input('user_id/d', 0);
            if (empty($data['user_id'])) {
                return $this->error(lang('商户关联的用户必填'));
            }
        } else {
            if ($data['mobile']) {
                if ($this->adminUserService->getAdminByMobile($data['mobile'])) {
                    return $this->error(lang('手机号已存在或已被商户账号占用'));
                }
            }
        }
        try {
            validate(AdminUserValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            throw new ApiException($e->getError());
        }

        $result = $this->adminUserService->createAdminUser($data);
        if ($result) {
            return $this->success(/** LANG */'管理员添加成功');
        } else {
            return $this->error(/** LANG */'管理员添加失败');
        }
    }

    /**
     * 更新操作
     *
     * @return Response
     */
    public function update(): Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'admin_id' => $id,
            'username' => '',
            'mobile' => '',
            'avatar' => '',
            'password' => '',
            'email' => '',
			'suppliers_id/d' => 0,
            'auth_list' => [],
            'role_id/d' => 0,
            'parent_id/d' => 0,
            'pwd_confirm' => '', // 确认密码
            'is_using/d' => 0,
            'admin_type' => ''
        ], 'post');
        $data["shop_id"] = request()->shopId;
        $data["merchant_id"] = request()->merchantId;
		$data['admin_uid'] = request()->adminUid;
        try {
            validate(AdminUserValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            throw new ApiException($e->getError());
        }
        if (request()->shopId) {
            $data['user_id'] = input('user_id/d', 0);
            if (empty($data['user_id'])) {
                return $this->error(lang('商户关联的用户必填'));
            }
        } else {
            if ($data['mobile']) {
                $admin = $this->adminUserService->getAdminByMobile($data['mobile']);
                if ($admin && $admin->admin_id != $data['admin_id']) {
                    return $this->error(lang('手机号已存在或已被商户账号占用'));
                }
            }
        }
        $result = $this->adminUserService->updateAdminUser($data, $id);
        if ($result) {
            return $this->success(/** LANG */'管理员更新成功');
        } else {
            return $this->error(/** LANG */'管理员更新失败');
        }
    }

    /**
     * 更新字段
     * @return Response
     * @throws ApiException
     */
    public function updateField(): Response
    {
        $id = input('id/d', 0);
        $field = input('field', '');

        if (!in_array($field, ['is_using'])) {
            return $this->error(/** LANG */'#field 错误');
        }

        $data = [
            'admin_id' => $id,
            $field => input('val'),
        ];

        $this->adminUserService->updateAdminUserField($id, $data);

        return $this->success(/** LANG */'更新成功');
    }

    /**
     * 删除
     *
     * @return Response
     */
    public function del(): Response
    {
        $id = input('id/d', 0);
        $this->adminUserService->deleteAdminUser($id);
        return $this->success(/** LANG */'指定项目已删除');
    }

    /**
     * 批量操作
     *
     * @return Response
     */
    public function batch(): Response
    {
        if (empty(input('ids')) || !is_array(input('ids'))) {
            return $this->error(/** LANG */'未选择项目');
        }

        if (input('type') == 'del') {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach (input('ids') as $key => $id) {
                    $id = intval($id);
                    $this->adminUserService->deleteAdminUser($id);
                }
                Db::commit();
            } catch (\Exception $exception) {
                Db::rollback();
                throw new ApiException($exception->getMessage());
            }

            return $this->success(/** LANG */'批量操作执行成功！');
        } else {
            return $this->error(/** LANG */'#type 错误');
        }
    }

    /**
     * 验证手机号码验证码
     * @return Response
     */
    public function checkCode(): Response
    {
        $data = $this->request->only([
            'mobile' => '',
            "code" => '',
        ], 'post');
        $result = app(SmsService::class)->checkCode($data["mobile"], $data["code"]);
        if ($result === true) {
            Cache::delete('loginmobileCode:' . $data["mobile"]);
            return $this->success(/** LANG */'验证成功');
        }else{
            return $this->error(/** LANG */'验证码错误');
        }
    }

    /**
     * 个人中心管理员账号修改
     * @return Response
     * @throws ApiException
     */
    public function modifyManageAccounts(): Response
    {
        $data = $this->request->only([
            'avatar' => '',
            'email' => '',
            'mobile' => '',
            'password' => '',
            'pwd_confirm' => '', // 确认密码
            'old_password' => '', // 原密码
            "code" => "",
            'modify_type/d' => 1,
        ], 'post');
        $data["admin_uid"] = request()->adminUid;
        $result = $this->adminUserService->modifyManageAccounts($data);
        return $result ? $this->success(/** LANG */'更新成功') : $this->error(/** LANG */'更新失败');
    }

    /**
     * 获取验证码
     * @return \think\Response
     * @throws \exceptions\ApiException
     */
    public function getCode(): Response
    {
        $mobile = input('mobile', '');
        if (!$mobile) {
            return $this->error(/** LANG */'手机号不能为空');
        }
        // 行为验证码
        app(CaptchaService::class)->setTag('mobileCode:' . $mobile)
            ->setToken(input('verify_token', ''))
            ->verification();

        try {
            app(SmsService::class)->sendCode($mobile);
            return $this->success(/** LANG */'发送成功！');
        } catch (\Exception $e) {
            return $this->error(/** LANG */'发送失败！' . $e->getMessage());
        }
    }
}
