<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 订单
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\order;

use app\adminapi\AdminBaseController;
use app\model\order\OrderSplitLog;
use app\service\admin\logistics\src\KDNiaoService;
use app\service\admin\order\OrderDetailService;
use app\service\admin\order\OrderLogService;
use app\service\admin\order\OrderService;
use exceptions\ApiException;
use think\App;
use think\Response;
use think\facade\Db;

/**
 * 订单控制器
 */
class Order extends AdminBaseController
{
    protected OrderService $orderService;
    protected OrderLogService $orderLogService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param OrderService $orderService
     */
    public function __construct(App $app, OrderService $orderService, OrderLogService $orderLogService)
    {
        parent::__construct($app);
        $this->orderService = $orderService;
        $this->orderLogService = $orderLogService;
        //$this->checkAuthor('orderManage'); //权限检查
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
            'user_id/d' => 0,
            'order_status/d' => -1,
            'pay_status/d' => -1,
            'shipping_status/d' => -1,
            'address' => '',
            'email' => '',
            'mobile' => '',
            'logistics_id/d' => 0,
            "add_start_time" => "",
            "add_end_time" => "",
            'comment_status/d' => -1,
            'page/d' => 1,
            'size/d' => 15,
            'sort_field' => 'order_id',
            'sort_order' => 'desc',
            'is_settlement' => -1,
            'is_exchange_order' => -1
        ], 'get');

        $filter['shop_id'] = $this->shopId;
		$filter['suppliers_id'] = request()->suppliersId;
        $filterResult = $this->orderService->getFilterResult($filter);
        $total = $this->orderService->getFilterCount($filter);
        return $this->success([
            'filter_result' => $filterResult,
            'filter' => $filter,
            'total' => $total,
        ]);
    }

    /**
     * 订单详情
     * @return Response
     * @throws ApiException
     */
    public function detail(): \think\Response
    {
        $id = input('id/d', 0);
		$suppliers_id = request()->suppliersId;
        $item = $this->orderService->getDetail($id,null,$suppliers_id);
        $item['way_bill'] = $this->orderService->getUseWayBillStatus(); //发货和已发货是否显示电子面单
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 查看父订单
     * @return Response
     */
    public function parentOrderDetail(): Response
    {
        $id = input('id/d', 0);
        $item = app(OrderSplitLog::class)->where('order_id', $id)->findOrEmpty();
        return $this->success([
            'item' => $item['parent_order_data'] ?? [],
        ]);
    }

    /**
     * 订单设置为已确认
     * @return Response
     */
    public function setConfirm(): \think\Response
    {
        $id = input('id/d', 0);
        $this->orderService->setOrderConfirm($id);
        return $this->success('订单状态已更新');
    }

    /**
     * 订单拆分
     * @return Response
     */
    public function splitStoreOrder(): \think\Response
    {
        $id = input('id/d', 0);
        $this->orderService->splitStoreOrder($id);
        return $this->success('订单已拆分');
    }

    /**
     * 订单设置为已支付
     * @return Response
     * @throws ApiException
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     */
    public function setPaid(): \think\Response
    {
        $id = input('id/d', 0);
        $orderDetail = app(OrderDetailService::class)->setOrderId($id);
        $orderDetail->setOfflinePaySuccess();
        return $this->success('订单状态已更新');
    }

    /**
     * 取消订单
     * @return Response
     */
    public function cancelOrder(): \think\Response
    {
        $id = input('id/d', 0);
        $this->orderService->cancelOrder($id);
        return $this->success('订单已取消');
    }

    /**
     * 删除订单
     * @return Response
     */
    public function delOrder(): \think\Response
    {
        $id = input('id/d', 0);
        $this->orderService->delOrder($id);
        return $this->success('订单已删除');
    }

    /**
     * 修改订单金额
     * @return Response
     */
    public function modifyMoney(): \think\Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'shipping_fee/f' => 0.00,
            'invoice_fee/f' => 0.00,
            'service_fee/f' => 0.00,
            'discount_amount/f' => 0.00,
        ], 'post');
        $this->orderService->modifyOrderMoney($id, $data);
        return $this->success('订单金额已修改');
    }

    /**
     * 修改收货人信息
     * @return Response
     */
    public function modifyConsignee(): \think\Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'consignee' => '',
            'mobile' => '',
            'telephone' => '',
            'email' => '',
            'postcode' => '',
            'region_ids/a' => [],
            'address' => '',
        ], 'post');
        $this->orderService->modifyOrderConsignee($id, $data);
        return $this->success('订单收货人信息已修改');
    }

    /**
     * 确认收货
     * @return \think\Response
     * @throws \exceptions\ApiException
     */
    public function confirmReceipt(): \think\Response
    {
        $id = input('id/d', 0);
        $this->orderService->confirmReceipt($id, null);
        return $this->success('订单已确认收货');
    }

    /**
     * 修改配送信息
     * @return Response
     */
    public function modifyShipping(): \think\Response
    {
        $id = input('id/d', 0);
        $data = $this->request->only([
            'shipping_method/d' => 0,
            'logistics_id/d' => 0,
            'tracking_no' => '',
        ], 'post');
        $this->orderService->modifyOrderShipping($id, $data);
        return $this->success('订单配送信息已修改');
    }

    /**
     * 修改商品信息
     * @return Response
     */
    public function modifyProduct(): \think\Response
    {
        $id = input('id/d', 0);
        $data = input('items', []);
        $this->orderService->modifyOrderProduct($id, $data);
        return $this->success('订单商品信息已更新');
    }

    /**
     * 添加商品时获取商品信息
     * @return Response
     */
    public function getAddProductInfo(): \think\Response
    {
        $ids = input('ids', []);
        $product_items = $this->orderService->getAddProductInfoByIds($ids);
        return $this->success([
            'item' => $product_items,
        ]);
    }

    /**
     * 设置商家备注
     * @return Response
     */
    public function setAdminNote(): \think\Response
    {
        $id = input('id/d', 0);
        $admin_note = input('admin_note', '');
        $this->orderService->setAdminNote($id, $admin_note);
        return $this->success('订单商家备注已更新');
    }

    /**
     * 发货
     * @return Response
     */
    public function deliver(): \think\Response
    {
        $id = input('id/d', 0);
        $deliver_data = input('deliver_data/a', []);
        $shipping_method = input('shipping_method/d', 1);
        $logistics_id = input('logistics_id/d', 0);
        $tracking_no = input('tracking_no', '');
        $bill_remark = input('bill_remark', '');
        $this->orderService->deliverOrder($id, $deliver_data, $shipping_method, $logistics_id, $tracking_no, $bill_remark);
        return $this->success('订单商品发货成功');
    }

    /**
     * 打印订单
     * @return Response
     */
    public function orderPrint(): \think\Response
    {
        $id = input('id/d', 0);
        $order_print = $this->orderService->getOrderPrintInfo($id);
        return $this->success([
            'order_print' => $order_print,
        ]);
    }

    /**
     * 打印电子面单
     * @return Response
     */
    public function orderPrintWaybill(): Response
    {
        $id = input('id/d', 0);
        $way_bill_print = $this->orderService->getOrderPrintWaybillInfo($id);
        return $this->success([
            'item' => $way_bill_print,
        ]);
    }

    /**
     * 订单导出标签列表
     * @return \think\Response
     */
    public function getExportItemList(): \think\Response
    {
        $export_item_list = $this->orderService->getExportItemList();
        return $this->success([
            'item' => $export_item_list,
        ]);
    }

    /**
     * 订单导出存的标签
     * @return \think\Response
     */
    public function saveExportItem(): \think\Response
    {
        $order_export = input('export_item', []);
        $result = $this->orderService->saveExportItem($order_export);
        return $result ? $this->success('保存成功') : $this->error('保存失败');
    }

    // 标签详情
    public function exportItemInfo(): \think\Response
    {
        $item = $this->orderService->getExportItemInfo();
        return $this->success([
            'item' => $item,
        ]);
    }

    //订单导出
    public function orderExport(): \think\Response
    {
        $filter = $this->request->only([
            'keyword' => '',
            'user_id/d' => 0,
            'order_status/d' => -1,
            'pay_status/d' => -1,
            'shipping_status/d' => -1,
            'comment_status/d' => -1,
            'address' => '',
            'email' => '',
            'mobile' => '',
            'logistics_id/d' => 0,
            'add_start_time' => "",
            'add_end_time' => "",
            'page/d' => 1,
            'size/d' => 99999,
            'sort_field' => 'order_id',
            'sort_order' => 'desc',
        ], 'get');
        $filter['shop_id'] = $this->shopId;

        //导出栏目
        $exportItem = input('export_item', []);
        if (empty($exportItem)) {
            return $this->error('导出栏目不能为空！');
        }

        $filterResult = $this->orderService->getFilterResult($filter);
        $result = $this->orderService->orderExport($filterResult, $exportItem);
        return $result ? $this->success("导出成功") : $this->error('导出失败');
    }

    /**
     * 多个订单详情
     * @return Response
     * @throws ApiException
     */
    public function severalDetail(): \think\Response
    {
        $data = input("ids/a", []);
		$suppliers_id = request()->suppliersId;
        $item = $this->orderService->getSeveralDetail($data,$suppliers_id);
        return $this->success([
            'item' => $item,
        ]);
    }

    /**
     * 批量操作
     * @return Response
     * @throws ApiException
     */
    public function batch(): Response
    {
        if (empty(input('ids')) || !is_array(input('ids'))) {
            return $this->error(/** LANG */ '未选择项目');
        }

        $data = input('data', []);
        if (in_array(input('type'), ['deliver'])) {
            try {
                //批量操作一定要事务
                Db::startTrans();
                foreach (input('ids') as $key => $id) {
                    $id = intval($id);
                    $this->orderService->batchOperation($id, input('type'), $data);
                }
                Db::commit();
            } catch (\Exception $exception) {
                Db::rollback();
                throw new ApiException($exception->getMessage());
            }

            return $this->success(/** LANG */ '批量操作执行成功！');
        } else {
            return $this->error(/** LANG */ '#type 错误');
        }
    }

    /**
     * 批量打印
     * @return Response
     * @throws ApiException
     */
    public function printSeveral(): Response
    {
        $ids = input('ids/a', []);
        $order_print = $this->orderService->printSeveral($ids);
        return $this->success([
            'item' => $order_print,
        ]);
    }
}
