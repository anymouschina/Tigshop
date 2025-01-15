<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 会员
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\user;

use app\adminapi\AdminBaseController;
use app\service\admin\user\UserMessageLogService;
use exceptions\ApiException;
use think\App;
use think\facade\Db;

/**
 * 会员控制器
 */
class UserMessageLog extends AdminBaseController
{

    /**
     * 构造函数
     *
     * @param App $app
     * @param UserMessageLogService $userMessageLogService
     */
    public function __construct(App $app, protected UserMessageLogService $userMessageLogService)
    {
        parent::__construct($app);
    }

    /**
     * 列表页面
     *
     * @return \think\Response
     */
    public function list(): \think\Response
    {
        $filter = $this->request->only([
            'keyword' => '',
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'message_log_id',
            'sort_order' => 'desc',
        ], 'get');

        $filterResult = $this->userMessageLogService->getFilterResult($filter);
        $total = $this->userMessageLogService->getFilterCount($filter);

        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 详情
     *
     * @return \think\Response
     */
    public function detail(): \think\Response
    {

        $id = input('id/d', 0);
        $item = $this->userMessageLogService->getDetail($id);
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 执行添加或操作
     *
     * @return \think\Response
     */
    public function create(): \think\Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'send_user_type/d' => 0,
            'message_title' => '',
            'message_content' => '',
            'message_link' => '',
            'user_list' => '',
            'user_id/d' => 0,
            'user_ids' => '',
            'user_rank/d' => 0,
        ], 'post');

        $result = $this->userMessageLogService->updateMessageLog($id, $data, true);
        if ($result) {
            return $this->success('站内信添加成功');
        } else {
            return $this->error('站内信更新失败');
        }
    }

    /**
     * 执行更新操作
     *
     * @return \think\Response
     */
    public function update(): \think\Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'send_user_type/d' => 0,
            'message_title' => '',
            'message_content' => '',
            'message_link' => '',
            'user_list' => '',
            'user_id/d' => 0,
            'user_rank/d' => 0,
        ], 'post');

        $result = $this->userMessageLogService->updateMessageLog($id, $data, false);
        if ($result) {
            return $this->success('站内信更新成功');
        } else {
            return $this->error('站内信更新失败');
        }
    }

    /**
     * 删除
     * @return \think\Response
     * @throws \exceptions\ApiException
     */
    public function del(): \think\Response
    {
        $id = input('id/d', 0);
        $this->userMessageLogService->deleteMessageLog($id);
        return $this->success('站内信已删除');
    }

    /**
     * 撤回
     * @return \think\Response
     * @throws \exceptions\ApiException
     */
    public function recall(): \think\Response
    {
        $id = input('id/d', 0);
        $this->userMessageLogService->recallMessageLog($id);
        return $this->success('站内信已撤回');
    }

	/**
	 * 批量操作
	 * @return \think\Response
	 * @throws ApiException
	 */
	public function batch(): \think\Response
	{
		if (empty(input('ids')) || !is_array(input('ids'))) {
			return $this->error(/** LANG */'未选择项目');
		}

		if (in_array(input('type'),['del','recall'])) {
			try {
				//批量操作一定要事务
				Db::startTrans();
				foreach (input('ids') as $id) {
					$id = intval($id);
					$this->userMessageLogService->batchOperation($id, input('type'));
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
