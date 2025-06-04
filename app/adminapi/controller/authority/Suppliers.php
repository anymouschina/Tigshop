<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 供应商
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\authority;

use app\adminapi\AdminBaseController;
use app\service\admin\authority\SuppliersService;
use app\validate\authority\SuppliersValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Db;
use think\Response;

/**
 * 供应商控制器
 */
class Suppliers extends AdminBaseController
{
    protected SuppliersService $suppliersService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param SuppliersService $suppliersService
     */
    public function __construct(App $app, SuppliersService $suppliersService)
    {
        parent::__construct($app);
        $this->suppliersService = $suppliersService;
        $this->checkAuthor('suppliersManage'); //权限检查
    }

    /**
     * 列表页面
     *
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'is_show' => -1,
            'keyword' => '',
            'page' => 1,
            'size' => 15,
            'sort_field' => 'suppliers_id',
            'sort_order' => 'desc',
        ], 'get');

        $filterResult = $this->suppliersService->getFilterResult($filter);
        $total = $this->suppliersService->getFilterCount($filter);

        return $this->success([
            'records' => $filterResult,
            'total' => $total,
        ]);
    }

    /**
     * 详情
     *
     * @return Response
     */
    public function detail(): Response
    {
        $id = $this->request->all('id/d', 0);
        $item = $this->suppliersService->getDetail($id);
        return $this->success(
             $item
        );
    }

    /**
     * 获取请求数据
     * @return array
     */
    public function requestData(): array
    {
        $data = $this->request->only([
            'suppliers_name' => '',
            'suppliers_desc' => '',
            'is_check/d' => 1,
            'contact_name' => '',
            'contact_phone' => '',
            'contact_address' => '',
            'regions' => [],
        ], 'post');

        return $data;
    }


    /**
     * 执行添加操作
     * @return Response
     */
    public function create(): Response
    {
        $data = $this->requestData();
        try {
            validate(SuppliersValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            throw new ApiException($e->getError());
        }

        $result = $this->suppliersService->createSuppliers($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */'供应商添加失败');
        }
    }

    /**
     * 执行更新操作
     * @return Response
     */
    public function update(): Response
    {
        $id = $this->request->all('id/d', 0);
        $data = $this->requestData();
        $data["suppliers_id"] = $id;
        try {
            validate(SuppliersValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            throw new ApiException($e->getError());
        }

        $result = $this->suppliersService->updateSuppliers($id, $data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */'供应商更新失败');
        }
    }

    /**
     * 更新单个字段
     *
     * @return Response
     */
    public function updateField(): Response
    {
        $id = $this->request->all('id/d', 0);
        $field = $this->request->all('field', '');

        if (!in_array($field, ['suppliers_name', 'is_show', 'sort_order', 'is_check'])) {
            return $this->error(/** LANG */'#field 错误');
        }

        $data = [
            'suppliers_id' => $id,
            $field =>$this->request->all('val'),
        ];

        $this->suppliersService->updateSuppliersField($id, $data);

        return $this->success();
    }

    /**
     * 删除
     *
     * @return Response
     */
    public function del(): Response
    {
        $id = $this->request->all('id/d', 0);
        $this->suppliersService->deleteSuppliers($id);
        return $this->success();
    }

    /**
     * 批量操作
     *
     * @return Response
     */
    public function batch(): Response
    {
        if (empty($this->request->all('ids')) || !is_array($this->request->all('ids'))) {
            return $this->error(/** LANG */'未选择项目');
        }

        if ($this->request->all('type') == 'del') {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach ($this->request->all('ids') as $id) {
                    $id = intval($id);
                    $this->suppliersService->deleteSuppliers($id);
                }
                Db::commit();
            } catch (\Exception $exception) {
                Db::rollback();
                throw new ApiException($exception->getMessage());
            }

            return $this->success();
        } else {
            return $this->error(/** LANG */'#type 错误');
        }
    }
}
