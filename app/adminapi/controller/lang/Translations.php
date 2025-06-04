<?php

namespace app\adminapi\controller\lang;

use app\adminapi\AdminBaseController;
use app\service\admin\lang\LocalesService;
use app\service\admin\lang\TranslationsService;
use exceptions\ApiException;
use think\App;
use think\facade\Db;
use think\Response;
use utils\Translate;
use utils\Util;

class Translations extends AdminBaseController
{
    protected TranslationsService $translationsService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param TranslationsService $translationsService
     */
    public function __construct(App $app, TranslationsService $translationsService)
    {
        parent::__construct($app);
        $this->translationsService = $translationsService;
    }

    /**
     * 列表页面
     *
     * @return Response
     */
    public function list(): Response
    {
        $filter = $this->request->only([
            'translation_name' => '',
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'id',
            'data_type' => -1,
            'sort_order' => 'desc',
            'shop_id' => request()->shopId,
        ], 'get');

        $locales = $this->getLocalesValues();
        $localeIds = array_column($locales, 'id');

        $filterResult = $this->translationsService->getFilterList($filter);
        $total = $this->translationsService->getFilterCount($filter);
        $filterResult->load([
            'tdata' => function ($query) use ($localeIds,$filter) {
                return $query->whereIn('locale_id', $localeIds)->where("data_type", $filter['data_type']);
            }
        ]);
        return $this->success([
            'records' => $filterResult,
            'total' => $total,
        ]);
    }

    /**
     * 获取前3条数据
     * @return Response
     */
    public function getLocalesLimit3(): Response
    {
        return $this->success($this->getLocalesValues());
    }

    /**
     * 请求数据
     * @return array
     */
    public function requestData(): array
    {
        $data = $this->request->only([
            'translation_name' => '',
            'items' => '',
            'data_type' => ''
        ], 'post');
        return $data;
    }


    /**
     * 添加
     *
     * @return Response
     */
    public function create(): Response
    {
        $data = $this->requestData();
        $data['shop_id'] = request()->shopId;
        $result = $this->translationsService->update(0, $data, true);
        return $result ? $this->success() : $this->error(/** LANG */ '添加失败');
    }

    /**
     * 批量添加
     *
     * @return Response
     */
    public function batchCreate(): Response
    {
        $data = request()->post('translation_name');
        $dataTypes = request()->post('data_type');
        try {
            Db::startTrans();
            if (empty($data)) {
                return $this->error('内容不能为空');
            }
            $data = preg_split('/\r\n|\n|\r/', $data);
            foreach ($data as $value) {
                foreach ($dataTypes as $dataType) {
                    $result = $this->translationsService->update(0,
                        ['translation_name' => $value, 'items' => [], 'data_type' => $dataType], true);
                }
            }

            Db::commit();
        } catch (\Exception $e) {
            Db::rollBack();
            return $this->error($e->getMessage());
        }

        return $result ? $this->success() : $this->error(/** LANG */ '添加失败');
    }

    /**
     * 保存翻译内容
     * @return Response
     */
    public function createTranslations()
    {
        $params = $this->request->only([
            'data_id' => '',
            'data_type' => '',
            'translation_name' => '',
            'items/a' => []
        ], 'post');

        $this->translationsService->createTranslationsData($params);
        return $this->success();
    }

    /**
     * 翻译内容详情
     * @return Response
     */
    public function getTranslations()
    {
        $params = $this->request->only([
            'data_id' => '',
            'data_type' => '',
        ], 'get');

        $result = $this->translationsService->getTranslationsData($params);
        return $this->success($result);
    }


    /**
     * 翻译数据
     * @return Response
     */
    public function translation(): Response
    {
        $code =$this->request->all('code');
        $text =$this->request->all('text');
        $result = Translate::getInstance()->translateText('zh', $code, [$text]);
        return $this->success(
                $result['0'] ?? []
        );
    }

    /**
     * 编辑
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function update(): Response
    {
        $data = $this->requestData();
        $data['id'] = $this->request->all('id/d', 0);

        $result = $this->translationsService->update($data['id'], $data);
        return $result ? $this->success() : $this->error(/** LANG */ '编辑失败');
    }

    /**
     * 详情
     * @return Response
     */
    public function detail(): Response
    {
        $id = $this->request->all('id/d', 0);
        $item = $this->translationsService->getDetail($id);
        return $this->success(
            $item
        );
    }

    /**
     * 删除
     * @return Response
     * @throws ApiException
     */
    public function del(): Response
    {
        $id = $this->request->all('id/d', 0);
        $this->translationsService->delete($id);
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
            return $this->error(/** LANG */ '未选择项目');
        }

        if (in_array($this->request->all('type'), ['del'])) {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach ($this->request->all('ids') as $key => $id) {
                    $id = intval($id);
                    $this->translationsService->batchOperation($id,$this->request->all('type'));
                }
                Db::commit();
            } catch (\Exception $exception) {
                Db::rollback();
                throw new ApiException($exception->getMessage());
            }

            return $this->success();
        } else {
            return $this->error(/** LANG */ '#type 错误');
        }
    }

	/**
	 * 一键翻译
	 * @return Response
	 * @throws ApiException
	 */
	public function multipleTranslation(): Response
	{
		$data = $this->request->only([
			'locales_id/d' => 0,
			'data_type/d' => 0,
            'size/d' => 100,
            'ids' => [],
            'shop_id' => request()->shopId,
            'page' => 1
		], 'post');
		$result = $this->translationsService->multipleTranslation($data);
        return $this->success();
	}

    /**
     * @return array
     */
    public function getLocalesValues(): array
    {
        $locales = app(LocalesService::class)->getFilterList([
            'is_enabled' => 1,
            'size' => 10,
            'page' => 1
        ]);
        $locales = $locales->toArray();
        foreach ($locales as $key => $locale) {
            // 排除中文及显示部分语种信息
            if ($locale['locale_code'] == "zh" || $key > 3) {
                unset($locales[$key]);
            }
        }
        return array_values($locales);
    }
}