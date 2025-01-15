<?php

namespace app\adminapi\controller\setting;

use app\adminapi\AdminBaseController;
use app\service\admin\setting\AlbumService;
use exceptions\ApiException;
use think\App;
use think\facade\Db;
use think\Response;

/**
 * 内置相册
 */
class Album extends AdminBaseController
{
	protected AlbumService $albumService;

	/**
	 * 构造函数
	 * @param App $app
	 * @param AlbumService $albumService
	 */
	public function __construct(App $app, AlbumService $albumService)
	{
		parent::__construct($app);
		$this->albumService = $albumService;
	}

	/**
	 * 相册列表
	 * @return Response
	 */
	public function list(): Response
	{
		$filter = $this->request->only([
			'pic_type/d' => 0,
			'page/d' => 1,
			'size/d' => 15,
			'sort_field' => 'id',
			'sort_order' => 'desc',
		], 'get');
		$filterResult = $this->albumService->getFilterList($filter,[],['pic_type_text']);
		$total = $this->albumService->getFilterCount($filter);

		return $this->success([
			'filter_result' => $filterResult,
			'filter' => $filter,
			'total' => $total,
		]);
	}

	/**
	 * 更新单个字段
	 * @return Response
	 * @throws \exceptions\ApiException
	 */
	public function updateField(): Response
	{
		$id = input('id/d', 0);
		$field = input('field', '');

		if (!in_array($field, ['pic_name'])) {
			return $this->error('#field 错误');
		}

		$data = [
			'pic_id' => $id,
			$field => input('val'),
		];

		$this->albumService->updateAlbumField($id, $data);

		return $this->success(/** LANG */'更新成功');
	}

	/**
	 * 删除
	 * @return Response
	 * @throws \exceptions\ApiException
	 */
	public function del(): Response
	{
		$id = input('id/d', 0);
		$this->albumService->delAlbum($id);
		return $this->success(/** LANG */'指定项目已删除');
	}

	/**
	 * 批量操作
	 * @return Response
	 * @throws ApiException
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
					$this->albumService->delAlbum($id);
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
}