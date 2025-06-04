<?php
namespace app\adminapi\controller\lang;

use app\adminapi\AdminBaseController;
use app\service\admin\lang\LocalesService;
use app\validate\lang\LocalesValidate;
use exceptions\ApiException;
use think\App;
use think\exception\ValidateException;
use think\facade\Db;
use think\Response;

class Locales extends AdminBaseController
{
    protected LocalesService $localesService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param LocalesService $localesService
     */
    public function __construct(App $app, LocalesService $localesService)
    {
        parent::__construct($app);
        $this->localesService = $localesService;
        $this->checkAuthor('locales'); //权限检查
    }

    /**
     * 列表页面
     *
     * @return Response
     */
    public function list():Response
    {
        $filter = $this->request->only([
            'language' => '',
            "currency_id/d" => 0,
			'is_enabled/d' => -1,
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'sort',
            'sort_order' => 'asc',
        ], 'get');

        $filterResult = $this->localesService->getFilterList($filter,['currency']);
        $total = $this->localesService->getFilterCount($filter);

        return $this->success([
            'records' => $filterResult,
            'total' => $total,
        ]);
    }

    /**
     * 请求数据
     * @return array
     */
    public function requestData(): array
    {
        $data = $this->request->only([
            'locale_code' => '',
            'language' => '',
            'flag_picture' => '',
            'is_enabled/d' => 1,
            'is_default/d' => 0,
            "currency_id/d" => 0,
            'sort' => 0
        ], 'post');
        return $data;
    }


    /**
     * 添加
     *
     * @return Response
     */
    public function create():Response
    {
        $data = $this->requestData();
        try {
            validate(LocalesValidate::class)
                ->scene('create')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->localesService->createLocales($data);
        return $result ? $this->success() : $this->error(/** LANG */'添加失败');
    }

    /**
     * 编辑
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function update():Response
    {
        $data = $this->requestData();
        $data['id'] = $this->request->all('id/d', 0);
        try {
            validate(LocalesValidate::class)
                ->scene('update')
                ->check($data);
        } catch (ValidateException $e) {
            return $this->error($e->getError());
        }

        $result = $this->localesService->updateLocales($data['id'],$data);
        return $result ? $this->success() : $this->error(/** LANG */'编辑失败');
    }

    /**
     * 详情
     * @return Response
     */
    public function detail():Response
    {
        $id =$this->request->all('id/d', 0);
        $item = $this->localesService->getDetail($id);
        return $this->success(
            $item
        );
    }

    /**
     * 删除
     * @return Response
     * @throws ApiException
     */
    public function del():Response
    {
        $id =$this->request->all('id/d', 0);
        $this->localesService->deleteLocales($id);
        return $this->success();
    }

    /**
     * 更新字段
     * @return Response
     * @throws ApiException
     */
    public function updateField():Response
    {
        $id =$this->request->all('id/d', 0);
        $field =$this->request->all('field', '');
        if (!in_array($field, ['is_enabled', 'is_default', 'sort'])) {
            return $this->error(/** LANG */'#field 错误');
        }
        $data = [
            'id' => $id,
            $field =>$this->request->all('val'),
        ];
        $this->localesService->updateLocalesField($id, $data);
        return $this->success();
    }

    /**
     * 批量操作
     * @return Response
     * @throws ApiException
     */
    public function batch():Response
    {
        if (empty($this->request->all('ids')) || !is_array($this->request->all('ids'))) {
            return $this->error(/** LANG */'未选择项目');
        }

        if (in_array($this->request->all('type'),['del','enabled','cancel_enabled'])) {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach ($this->request->all('ids') as $key => $id) {
                    $id = intval($id);
                    $this->localesService->batchOperation($id,$this->request->all('type'));
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