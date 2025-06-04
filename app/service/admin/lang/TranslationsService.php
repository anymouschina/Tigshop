<?php

namespace app\service\admin\lang;

use app\model\common\Locales;
use app\model\common\Translations;
use app\model\common\TranslationsData;
use app\model\product\Brand;
use app\model\product\Category;
use app\model\product\Product;
use app\service\common\BaseService;
use exceptions\ApiException;
use think\facade\Cache;
use think\facade\Db;
use utils\Config as UtilsConfig;
use utils\Translate;

/**
 * 服务类
 */
class TranslationsService extends BaseService
{

    public function __construct(Translations $translations)
    {
        $this->model = $translations;
    }

    protected function filterQuery(array $filter): object
    {
        $query = $this->model->query();
        // 处理筛选条件

        if (!empty($filter['locale_code'])) {
            $locale = Locales::where('locale_code', $filter['locale_code'])->where('is_enabled', 1)->find();
            if ($locale) {
                $query->where('locale_id', $locale->id);
            } else {
                $query->where('locale_id', -1);
            }
        }
        if (isset($filter['locale_id']) && $filter['locale_id'] > 0) {
            $query->where('locale_id', $filter['locale_id']);
        }

        if (isset($filter['data_type']) && $filter['data_type'] > -1) {
            $query->where('data_type', $filter['data_type']);
        }

        if (!empty($filter['translation_name'])) {
            $query->where('translation_name', 'like', '%' . $filter['translation_name'] . '%');
        }

        if (!empty($filter['translation_key'])) {
            $query->where('translation_key', $filter['translation_key']);
        }
        if (!empty($filter['shop_id'])) {
            $query->where('shop_id', $filter['shop_id']);
        }

        if (isset($filter['sort_field'], $filter['sort_order']) && !empty($filter['sort_field']) && !empty($filter['sort_order'])) {
            $query->order($filter['sort_field'], $filter['sort_order']);
        }
        return $query;
    }

    /**
     * 创建业务翻译数据
     * @return bool
     */
    public function createTranslationsData(array $params): bool
    {
        try {
            Db::startTrans();
			$translationsData = TranslationsData::where(['data_type' => $params['data_type'],'data_id' => $params['data_id']])->count();
			if ($translationsData) {
				TranslationsData::where(['data_type' => $params['data_type'],'data_id' => $params['data_id']])->delete();
			}

            $name_key = md5($params['translation_name']);
			if (!empty($params['items'])) {
				foreach ($params['items'] as $key => $value) {
					$item[$key] = [
						'locale_id' => $value['locale_id'],
						'translation_name' => $params['translation_name'],
						'translation_key' => $name_key,
						'translation_value' => $value['translation_value'],
						'data_type' => $params['data_type'],
						'data_id' => $params['data_id'],
					];
                    $locale_code = Locales::where('id', $value['locale_id'])->value("locale_code");
                    $cache_key = $value['translation_value'] . "_" . $locale_code;
                    Cache::set($cache_key, $value['translation_value']);
				}
				(new TranslationsData)->saveAll($item);
			}
            Db::commit();
        } catch (\Exception $exception) {
            Db::rollback();
            throw new ApiException($exception->getMessage());
        }
        return true;
    }


	/**
	 * 获得业务翻译数据
	 * @param array $params
	 * @return array
	 */
    public function getTranslationsData(array $params):array
    {
		$result = [];
		$translationsData = TranslationsData::where('data_type', $params['data_type'])
			->where('data_id',$params['data_id'])->select()->toArray();
		foreach ($translationsData as $item) {
			$result['data_id'] = $item['data_id'];
			$result['data_type'] = $item['data_type'];
			$result['translation_name'] = $item['translation_name'];
		}
		$result['item'] = $translationsData;
		return $result;
    }


    /**
     * 获得对应语言包
     * @return array|object
     */
    public function getFrontData(string $code): array|object
    {
        $locale = Locales::where('locale_code', $code)->where('is_enabled', 1)->find();
        if ($locale) {
            return TranslationsData::where('data_type', 0)->where('locale_id', $locale->id)->select();
        } else {
            return [];
        }
    }

    /**
     * 获取详情
     *
     * @param int $id
     * @throws ApiException
     */
    public function getDetail(int $id)
    {
        $result = $this->model->where('id', $id)->find();
        $result['items'] = TranslationsData::with(['locales'])->where('data_type', $result['data_type'])->where('data_id', $id)->select();
        return $result;
    }

    /**
     * 添加或更新
     *
     * @param int $id
     * @param array $data
     * @param bool $isAdd
     * @return int|bool
     */
    public function update(int $id, array $data, bool $isAdd = false): bool|int
    {
        try {
            $data['translation_key'] = md5($data['translation_name']);
            if ($isAdd) {
                $count = $this->model->where('translation_key', $data['translation_key'])->where('data_type',
                    $data['data_type'])->count();
            } else {
                $count = $this->model->where('translation_key', $data['translation_key'])->where('id', '<>',
                    $id)->where('data_type', $data['data_type'])->count();
            }
            $items = $data['items'];
            unset($data['items']);
            if ($count) {
                throw new ApiException('该内容已存在.:' . $data['translation_name']);
            }
            if ($isAdd) {
                $result = $this->model->create($data);
                $id = $result->id;
            } else {
                $result = $this->model->where('id', $id)->save($data);

				// 删除原缓存
				$TranslationsData = TranslationsData::with(['locales'])
					->where('data_type', $data['data_type'])
					->where('data_id', $id)->select();

				$this->delTranslationsDataCache($TranslationsData);

				TranslationsData::where('data_type', $data['data_type'])->where('data_id', $id)->delete();
            }

            if ($items) {
                $translations_data = [];
                foreach ($items as $key => $item) {
                    $translations_data[$key] = $item;
                    $translations_data[$key]['data_type'] = $data['data_type'];
                    $translations_data[$key]['data_id'] = $id;
                    $translations_data[$key]['translation_name'] = $data['translation_name'];
                    $translations_data[$key]['translation_key'] = $data['translation_key'];

                    // 获取对应语种
                    $locale_code = Locales::where('id', $item['locale_id'])->value("locale_code");
                    $cache_key = $data['translation_key'] . "_" . $locale_code;

                    Cache::set($cache_key, $item['translation_value']);
                }

                (new TranslationsData)->saveAll($translations_data);
            }

            return true;
        } catch (\Exception $exception) {
            throw new ApiException($exception->getMessage());
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
        $detail = $this->getDetail($id);
        $result = $this->model::destroy($id);
		// 删除缓存
		$this->delTranslationsDataCache($detail['items']);
        TranslationsData::where('data_type', $detail['data_type'])->where('data_id', $id)->delete();
        return $result !== false;
    }


    /**
     * 批量操作
     * @param int $id
     * @param string $type
     * @return bool
     * @throws ApiException
     */
    public function batchOperation(int $id, string $type): bool
    {
        if (!$id || empty($type)) {
            throw new ApiException(/** LANG */ '#参数错误');
        }
        $detail = $this->getDetail($id);
        switch ($type) {
            case 'del':
                $result = $detail->delete();
				// 删除缓存
				$this->delTranslationsDataCache($detail['items']);
                TranslationsData::where('data_type', $detail['data_type'])->where('data_id', $id)->delete();
                break;
        }
        return $result !== false;
    }

	/**
	 * 删除缓存
	 * @param Object $translationsData
	 * @return void
	 */
	public function delTranslationsDataCache(Object $translationsData): void
	{
		// 删除缓存
		foreach ($translationsData as $item) {
			if (!empty($item['locales'])) {
				$locale_code = $item['locales']['locale_code'];
				$cache_key = $item['translation_key'] . "_" . $locale_code;
				Cache::delete($cache_key);
			}
		}
	}


	/**
	 * 批量翻译
	 * @return bool
	 * @throws \Throwable
	 */
	public function batchTranslation(): bool
	{
		try {
			$locales = Locales::where('is_enabled', 1)->select()->toArray();
			$all_locales = array_column($locales, 'locale_code', 'id');

			$translations = Translations::chunk(100, function ($translations) use ($all_locales) {
				$translations = $translations->toArray();
				foreach ($all_locales as $locale_id => $locale) {
					$this->getTranslateMissingLocales($translations,$locale_id);
				}
			});

			return true;
		} catch (\Exception $e) {
			error_log("Error in batchTranslation: " . $e->getMessage() . " at line " . $e->getLine());
			return false;
		}
	}

	/**
	 * 根据语种翻译内容
	 * @param array $translations
	 * @param int $locales_id
	 * @return array
	 * @throws ApiException
	 * @throws \Throwable
	 */
	public function getTranslateMissingLocales(array $translations,int $locales_id):array
	{
		// 语种编号
		$locale_code = Locales::where("id",$locales_id)->value("locale_code");
        TranslationsData::where("locale_id", $locales_id)
            ->where("translation_value", "")
            ->delete();
		foreach ($translations as $t => $translation) {

            $translations_count = TranslationsData::where("data_id", $translation['id'])
				->where("data_type",$translation['data_type'])
				->where("locale_id",$locales_id)
				->where("translation_value","<>","")
                ->find();
			if ($translations_count) {
				// 已被翻译
                Cache::set($translations_count['translation_key'] . '_' . $locale_code,
                    $translations_count['translation_value']);
				unset($translations[$t]);
			}
		}

		$new_translations = [];
		if (!empty($translations)) {
			$translations = array_values($translations);
			$translation_names = array_column($translations,'translation_name');
			$translation_info = Translate::getInstance()->translateText('zh', $locale_code, $translation_names);
			foreach ($translations as $key => $item) {
				$new_translations[$key] = [
					'locale_id' => $locales_id,
					'translation_name' => $item['translation_name'],
					'translation_key' => $item['translation_key'],
					'translation_value' => $translation_info[$key]['Translation'],
					'data_type' => $item['data_type'],
					'data_id' => $item['id'],
				];

				$cache_key = $item['translation_key'] . "_" . $locale_code;
				Cache::set($cache_key, $translation_info[$key]['Translation']);
			}
			(new TranslationsData)->saveAll($new_translations);
		}
		return $new_translations;
	}




	/**
	 * 一键翻译
	 * @param int $id
	 * @return bool
	 * @throws ApiException
	 * @throws \Throwable
	 */
	public function multipleTranslation(array $data):bool
	{
		try {
            if (in_array($data['data_type'], [0, 1])) {
                $model = Translations::where("data_type", $data['data_type']);
                if (!empty($data['shop_id'])) {
                    $model = $model->where("shop_id", $data['shop_id']);
                }
                $translations = $model->when(!empty($data['ids']),
                    function ($query) use ($data) {
                        $query->whereIn('id', $data['ids']);
                    })
                    ->order('id', 'desc')
                    ->paginate($data['size'], $data['page']);
                $translations = $translations->items();
                $this->getTranslateMissingLocales($translations, $data['locales_id']);
            } elseif ($data['data_type'] == 2) {
                $model = Product::where("is_delete", 0);
                if (!empty($data['shop_id'])) {
                    $model = $model->where("shop_id", $data['shop_id']);
                }
                $translations = $model->when(!empty($data['ids']), function ($query) use ($data) {
                    $query->whereIn('product_id', $data['ids']);
                })->order('product_id', 'desc')->paginate($data['size'], $data['page']);
                $translations = $translations->items();
                foreach ($translations as $key => &$item) {
                    $item['id'] = $item['product_id'];
                    $item['data_type'] = $data['data_type'];
                    $item['translation_key'] = md5($item['product_name']);
                    $item['translation_name'] = $item['product_name'];
                }
                $this->getTranslateMissingLocales($translations, $data['locales_id']);
            } elseif ($data['data_type'] == 3) {
                $translations = Category::when(!empty($data['ids']), function ($query) use ($data) {
                    $query->whereIn('category_id', $data['ids']);
                })->order('category_id', 'desc')->paginate($data['size'], $data['page']);
                $translations = $translations->items();
                foreach ($translations as $key => &$item) {
                    $item['id'] = $item['category_id'];
                    $item['data_type'] = $data['data_type'];
                    $item['translation_key'] = md5($item['category_name']);
                    $item['translation_name'] = $item['category_name'];
                }
                $this->getTranslateMissingLocales($translations, $data['locales_id']);
            } elseif ($data['data_type'] == 4) {
                $translations = Brand::when(!empty($data['ids']), function ($query) use ($data) {
                    $query->whereIn('brand_id', $data['ids']);
                })->order('brand_id', 'desc')->paginate($data['size'], $data['page']);
                $translations = $translations->items();
                foreach ($translations as $key => &$item) {
                    $item['id'] = $item['brand_id'];
                    $item['data_type'] = $data['data_type'];
                    $item['translation_key'] = md5($item['brand_name']);
                    $item['translation_name'] = $item['brand_name'];
                }
                $this->getTranslateMissingLocales($translations, $data['locales_id']);
            } elseif ($data['data_type'] == 5) {
                $translations = [
                    [
                        'id' => 1,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('shopName'),
                    ],
                    [
                        'id' => 2,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('shopTitleSuffix'),
                    ],
                    [
                        'id' => 3,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('shopTitle'),
                    ],
                    [
                        'id' => 4,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('shopKeywords'),
                    ],
                    [
                        'id' => 5,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('shopDesc'),
                    ],
                    [
                        'id' => 6,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('kefuAddress'),
                    ],
                    [
                        'id' => 7,
                        'data_type' => $data['data_type'],
                        'translation_name' => UtilsConfig::get('shopIcpNo'),
                    ]
                ];
                foreach ($translations as $key => &$item) {
                    $item['translation_key'] = md5($item['translation_name']);
                }
                $this->getTranslateMissingLocales($translations, $data['locales_id']);
            }

			return true;
		} catch (\Exception $e) {
			error_log("Error in batchTranslation: " . $e->getMessage() . " at line " . $e->getLine());
			return false;
		}
	}
}
