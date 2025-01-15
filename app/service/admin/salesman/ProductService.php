<?php

namespace app\service\admin\salesman;

use app\model\product\Product;
use app\model\salesman\SalesmanProduct;
use app\service\admin\panel\StatisticsUserService;
use app\service\common\BaseService;
use exceptions\ApiException;
use utils\Time;

/**
 * 服务类
 */
class ProductService extends BaseService
{

    public function __construct(Product $product)
    {
        $this->model = $product;
    }

    /**
     * 筛选查询
     *
     * @param array $filter
     * @return object
     */
    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query()->with(['pics']);
        // 处理筛选条件
        $query->withJoin('salesmanProduct', 'LEFT');
        if (isset($filter['shop_id'])) {
            $query->where('product.shop_id', $filter['shop_id']);
        }
        if (!empty($filter['is_join'])) {
            $query->where('is_join', 1);
        }

        if (!empty($filter['product_name'])) {
            $query->where('product.product_name', 'like', '%' . $filter['product_name'] . '%');
        }
        if (isset($filter['status']) && $filter['status'] > -1) {
            $query->where('product.product_status', $filter['status']);
        }
        if (isset($filter['product_id']) && $filter['product_id'] > -1) {
            $query->where('product.product_id', $filter['product_id']);
        }
        if (isset($filter['salesman_product_type']) && $filter['salesman_product_type'] !== -1) {
            if ($filter['salesman_product_type'] == 1) {
                $query->where('is_join', "<>", 1);
            } elseif ($filter['salesman_product_type'] == 2) {
                $query->where('commission_type', 2);
            } elseif ($filter['salesman_product_type'] == 3) {
                $query->where('is_join', 1);
            } elseif ($filter['salesman_product_type'] == 4) {
                $query->where('commission_type', 3);
            }

        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {

            if ($filter['sort_field'] == 'final_commission_price') {
                //取得默认比例佣金
                $salesman = app(SalesmanService::class)->getDetailByUserId($filter['user_id']);
                $defaultRate = app(ConfigService::class)->getSalesmanCommissionRate($salesman['level']);
                $query->field('salesmanProduct.*,product.*,if(salesmanProduct.commission_type =1,' . $defaultRate . '*product.product_price,if(salesmanProduct.commission_type =2,salesmanProduct.commission_data*product.product_price,salesmanProduct.commission_data)) as final_commission_price');
            } else {
                $query->order('product.' . $filter['sort_field'], $filter['sort_order']);
            }

        }

		$query->where('product.is_delete', 0);

        return $query;
    }


    public function buildFinalCommissionList(object $list, array $filter)
    {
        $salesman = app(SalesmanService::class)->getDetailByUserId($filter['user_id']);
        $defaultRate = app(ConfigService::class)->getSalesmanCommissionRate($salesman['level']);
        foreach ($list as &$item) {
            $item['final_commission_price'] = 0;
            if ($item['commission_type'] == 1) {
                $item['final_commission_price'] = $defaultRate * $item['product_price'] / 100;
            } elseif ($item['commission_type'] == 2) {
                if (!empty($item['commission_data'])) {
                    $item['commission_data'] = json_decode($item['commission_data'], true);
                    foreach ($item['commission_data']['0']['level_arr'] as $key => $value) {
                        if ($salesman['level'] == $value['level']) {
                            $item['final_commission_price'] = $value['rate'] * $item['product_price'] / 100;
                        }
                    }
                }
            } elseif ($item['commission_type'] == 3) {
                if (!empty($item['commission_data'])) {
                    $item['commission_data'] = json_decode($item['commission_data'], true);
                    foreach ($item['commission_data']['0']['level_arr'] as $key => $value) {
                        if ($salesman['level'] == $value['level']) {
                            $item['final_commission_price'] = $value['rate'];
                        }
                    }
                }
            }
            if ($item['final_commission_price'] < 0.01) {
                $item['final_commission_price'] = 0;
            }
        }
        return $list;
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @throws ApiException
     */
    public function getDetail(int $id)
    {
        $result = SalesmanProduct::where('salesman_product_id', $id)->find();
        if (empty($result)) {
            throw new ApiException('该分销商品不存在');
        }
        return $result;
    }

    /**
     * 获取分销商品详情
     * @param int $id
     * @return SalesmanProduct
     * @throws ApiException
     */
    public function getProductDetail(int $id): SalesmanProduct
    {
        $result = SalesmanProduct::where('product_id', $id)->find();
        if (empty($result)) {
            throw new ApiException('该分销商品不存在');
        }
        return $result;
    }


    /**
     * 添加或更新
     *
     * @param int $id
     * @param array $data
     * @param bool $isAdd
     * @return int|bool
     * @throws ApiException
     */
    public function update(int $id, array $data, bool $isAdd = false): bool|int
    {
        $this->model = new \app\model\salesman\SalesmanProduct();
        if ($isAdd) {
            $result = $this->model->save($data);
            return $this->model->getKey();
        } else {
            $result = $this->model->where('salesman_product_id', $id)->save($data);
            return $result !== false;
        }
    }


    /**
     * 删除分类
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $this->model = new \app\model\salesman\SalesmanProduct();
        $result = $this->model::destroy($id);

        return $result !== false;
    }

    /**
     * 获取分销商品列表
     * @param array $filter
     * @return Object
     */
    public function getSalesmanProductList(array $filter,array $with = []): Object
    {
        $query = $this->filterSalesmanProduct($filter);

        if ($with) {
            $query->with($with);
        }
        if ($filter['size'] != -1) {
            $query->page($filter['page'], $filter['size']);
        }
        return $query->select();
    }

    /**
     * 分销商品数量
     * @param array $filter
     * @return int
     */
    public function getSalesmanProductCount(array $filter): int
    {
        $query = $this->filterSalesmanProduct($filter);
        return $query->count();
    }

    /**
     * 获取分销商品列表查询对象
     * @param array $filter
     * @return \think\db\BaseQuery
     */
    public function filterSalesmanProduct(array $filter): \think\db\BaseQuery
    {
        $query = SalesmanProduct::query();

        if (isset($filter['shop_id']) && !empty($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }

        $query->where("is_join",1);

        return $query;
    }

    /**
     * 商品成交分析
     * @param Object $data
     * @param array $filter
     * @return array|Object
     * @throws ApiException
     */
    public function getAnalysis(Object $data,array $filter):array|Object
    {
        if (empty($data->toArray())) {
            return $data;
        }

        if (empty($filter["start_end_time"])) {
            throw new ApiException("请选择时间");
        }

        // 时间转换
        $start_end_time = app(StatisticsUserService::class)->getDateRange($filter["date_type"], $filter["start_end_time"]);
        list($start,$end) = $start_end_time;
        $start = Time::toTime($start);
        $end = Time::toTime($end) + 86400;

        $result = [];
        foreach ($data as $k => $item) {
            $result[$k]['product_id'] = $item['product_id'];
            $result[$k]['product_name'] = $item['product']['product_name'] ?? "";
			$result[$k]['product_sn'] = $item['product']['product_sn'] ?? "";
			$result[$k]['pic_thumb'] = $item['product']['pic_thumb'] ?? "";
            $result[$k]['total_product_money'] = 0;
            $result[$k]['commission_expenses'] = 0;

            if (!empty($item['salesman_order']->toArray())) {
                $total_product_money = $commission_expenses = 0;
                foreach ($item['salesman_order'] as $order) {
                    if ($start <= Time::toTime($order['add_time']) && $end > Time::toTime($order['add_time'])) {
                        // 成交金额
                        $total_product_money += (float) bcmul($order['user_order_item']['price'], $order['user_order_item']['quantity'], 2);
                        // 支出佣金
                        if ($order['status']) {
                            $commission_expenses += $order['amount'];
                        }
                    }
                }
                $result[$k]['total_product_money'] = $total_product_money ?? 0;
                $result[$k]['commission_expenses'] = $commission_expenses ?? 0;
            }
        }

        // 排序
        if (isset($filter['real_sort_field'],$filter['sort_order']) && !empty($filter['real_sort_field']) && !empty($filter['sort_order'])) {
            if (in_array($filter['real_sort_field'], ['total_product_money','commission_expenses'])) {
                array_multisort(array_column($result, $filter['real_sort_field']), $filter['sort_order'] == "desc" ? SORT_DESC : SORT_ASC, $result);
            }
        }
        $result = array_slice($result, (($filter["page"] ?? 1) - 1) * ($filter["real_size"] ?? 20), ($filter["real_size"] ?? 20));
        return $result;
    }

}
