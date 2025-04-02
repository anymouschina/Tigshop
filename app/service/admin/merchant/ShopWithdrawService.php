<?php
//**---------------------------------------------------------------------+
//** 服务层文件 -- 店铺
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\service\admin\merchant;

use app\model\merchant\ShopWithDraw;
use app\service\common\BaseService;
use exceptions\ApiException;

/**
 * 商户提现服务类
 */
class ShopWithdrawService extends BaseService
{

    public function __construct(ShopWithDraw $shopWithDraw)
    {
        $this->model = $shopWithDraw;
    }


    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query();
        // 处理筛选条件

        if (isset($filter['shop_id']) && $filter['shop_id'] > -1) {
            $query->where('shop_id', $filter['shop_id']);
        }
        if (isset($filter['status']) && $filter['status'] > -1) {
            $query->where('status', $filter['status']);
        }
        if (!empty($filter['add_time_start'])) {
            $query->where('add_time', '>=', strtotime($filter['add_time_start']));
        }
        if (!empty($filter['add_time_end'])) {
            $query->where('add_time', '<=', strtotime($filter['add_time_end'] . ' 23:59:59'));
        }
        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @return ShopWithDraw
     * @throws ApiException
     */
    public function getDetail(int $id): ShopWithDraw
    {
        $result = $this->model->find($id);

        if (!$result) {
            throw new ApiException('信息不存在');
        }

        return $result;
    }


    /**
     * 执行添加
     *
     * @param array $data
     * @return int|bool
     * @throws ApiException
     */
    public function create(array $data)
    {
        $result = $this->model->create($data);
        app(ShopAccountLogService::class)->addWithDrawLog($data);
        return $result->getKey();

    }

    /**
     * 执行更新
     *
     * @param int $id
     * @param array $data
     * @return int|bool
     * @throws ApiException
     */
    public function update(int $id, array $data): bool|int
    {

        if (!$id) {
            throw new ApiException('#id错误');
        }
        $result = $this->model->where('shop_withdraw_log_id', $id)->save($data);
        return $result !== false;

    }

    /**
     * 更新单个字段
     *
     * @param int $id
     * @param array $data
     * @return int|bool
     * @throws ApiException
     */
    public function updateField(int $id, array $data)
    {
        if (!$id) {
            throw new ApiException('#id错误');
        }
        $result = $this->model::where('account_id', $id)->save($data);
        return $result !== false;
    }

    /**
     * 删除
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        if (!$id) {
            throw new ApiException('#id错误');
        }
        $result = $this->model->destroy($id);
        return $result !== false;
    }

    public function uploadPayVoucher(array $filter)
    {
        if (!$filter['id']) {
            throw new ApiException('#id错误');
        }
        $detail = $this->getDetail($filter['id']);
        if ($detail['status'] != ShopWithDraw::STATUS_WAIT_PAYMENT) {
            throw new ApiException('状态错误');
        }
        if (empty($filter['payment_voucher'])) {
            throw new ApiException('请上传打款凭证');
        }
        $detail->payment_voucher = $filter['payment_voucher'];
        $detail->status = ShopWithDraw::STATUS_COMPLETE;
        $detail->save();
        app(ShopAccountLogService::class)->completeWithDrawLog([
            'shop_id' => $detail['shop_id'],
            'amount' => $detail['amount']
        ]);
        return true;
    }
}
