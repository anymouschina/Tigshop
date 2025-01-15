<?php

namespace app\adminapi\controller\user;

use app\adminapi\AdminBaseController;
use app\service\admin\user\UserCompanyService;
use think\App;
use think\Response;

class UserCompany extends AdminBaseController
{
	protected userCompanyService $userCompanyService;

	public function __construct(App $app, userCompanyService $userCompanyService)
	{
		parent::__construct($app);
		$this->userCompanyService = $userCompanyService;
	}

	/**
	 * 企业认证列表
	 * @return Response
	 */
	public function list():Response
	{
		$filter = $this->request->only([
			'username' => '',
            'type/d' => 0,
			'status/d' => 0,
			'page/d' => 1,
			'size/d' => 15,
			'sort_field' => 'id',
			'sort_order' => 'desc',
		], 'get');

		$filterResult = $this->userCompanyService->getFilterList($filter,['user'],['status_text','type_text']);
		$total = $this->userCompanyService->getFilterCount($filter);

		return $this->success([
			'filter_result' => $filterResult,
			'filter' => $filter,
			'total' => $total,
		]);
	}

	/**
	 * 企业认证详情
	 * @return Response
	 * @throws \exceptions\ApiException
	 */
	public function detail():Response
	{
		$id = input('id/d',0);
		$item = $this->userCompanyService->getDetail($id);
		return $this->success([
			'item' => $item,
		]);
	}

	/**
	 * 企业认证审核
	 * @return Response
	 */
	public function audit():Response
	{
		$id = input('id/d',0);
		$data = $this->request->only([
			'id/d' => $id,
			'status/d' => 1,
			'audit_remark' => '',
		], 'post');

		$result = $this->userCompanyService->audit($id,$data);

		return $result ? $this->success("会员企业认证审核成功") : $this->error("会员企业认证审核失败");
	}

	/**
	 * 删除
	 * @return Response
	 * @throws \exceptions\ApiException
	 */
	public function del():Response
	{
		$id = input('id/d',0);
		$result = $this->userCompanyService->del($id);
		return $result ? $this->success("删除成功") : $this->error("删除失败");
	}
}