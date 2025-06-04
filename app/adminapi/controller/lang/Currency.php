<?php
namespace app\adminapi\controller\lang;

use app\adminapi\AdminBaseController;
use app\service\admin\lang\CurrencyService;
use app\service\admin\lang\LocalesService;
use app\validate\lang\CurrencyValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Db;
use think\Response;

/**
 * 货币管理
 */
class Currency extends AdminBaseController
{
    protected CurrencyService $currencyService;

    /**
     * 构造函数
     * @param App $app
     * @param CurrencyService $currencyService
     */
    public function __construct(App $app, CurrencyService $currencyService)
    {
        parent::__construct($app);
        $this->currencyService = $currencyService;
        $this->checkAuthor('currency'); //权限检查
    }

    /**
     * 列表
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'name' => '',
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'id',
            'sort_order' => 'desc',
			'sort_other_field' => "is_default",
			'sort_other_order' => 'desc'
        ], 'get');

        $filterResult = $this->currencyService->getFilterList($filter);
        $total = $this->currencyService->getFilterCount($filter);

        return $this->success([
            'records' => $filterResult,
            'total' => $total,
        ]);
    }

    /**
     * 配置
     * @return Response
     */
    public function config(): Response
    {
        // 语种
        $locales = app(LocalesService::class)->getFilterList([
            'is_enabled' => 1,
            'size' => -1,
        ]);
        return $this->success(
           $locales
        );
    }

    /**
     * 创建
     * @return Response
     * @throws \think\db\exception\DbException
     */
    public function create(): Response
    {
        $data = $this->request->only([
            'name' => '',
            'symbol' => '',
            'locales_id/d' => 0,
            'is_default/d' => 0,
            'rate' => ''
        ], 'post');

        try {
            validate(CurrencyValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }
        $result = $this->currencyService->createCurrency($data);
        return $result ? $this->success() : $this->error(/** LANG */'添加失败');
    }

    /**
     * 更新
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DbException
     */
    public function update(): Response
    {
        $id = $this->request->all('id/d',0);
        $data = $this->request->only([
            'id/d' => $id,
            'name' => '',
            'symbol' => '',
            'locales_id/d' => 0,
            'is_default/d' => 0,
            'rate' => ''
        ], 'post');

        try {
            validate(CurrencyValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }
        $result = $this->currencyService->updateCurrency($id,$data);
        return $result ? $this->success() : $this->error(/** LANG */'编辑失败');
    }

    /**
     * 详情
     * @return Response
     * @throws ApiException
     */
    public function detail(): Response
    {
        $id = $this->request->all('id/d',0);
        $detail = $this->currencyService->getDetail($id);
        return $this->success($detail);
    }

    /**
     * 删除
     * @return Response
     * @throws ApiException
     */
    public function del(): Response
    {
        $id = $this->request->all('id/d',0);
        $result = $this->currencyService->deleteCurrency($id);
        return $result ? $this->success() : $this->error(/** LANG */'删除失败');
    }

    /**
     * 更新字段
     * @return Response
     * @throws ApiException
     */
    public function updateField(): Response
    {
        $id = $this->request->all('id/d', 0);
        $field =$this->request->all('field', '');
        if (!in_array($field, ['name', 'symbol','is_default'])) {
            return $this->error(/** LANG */'#field 错误');
        }
        $data = [
            'id' => $id,
            $field =>$this->request->all('val'),
        ];
        $this->currencyService->updateCurrencyField($id, $data);
        return $this->success();
    }

    /**
     * 批量操作
     * @return Response
     * @throws ApiException
     */
    public function batch(): Response
    {
        if (empty($this->request->all('ids')) || !is_array($this->request->all('ids'))) {
            return $this->error(/** LANG */'未选择项目');
        }

        if (in_array($this->request->all('type'),['del'])) {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach ($this->request->all('ids') as $key => $id) {
                    $id = intval($id);
                    $this->currencyService->batchOperation($id);
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
