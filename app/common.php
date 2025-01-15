<?php
// 应用公共文件
if (!function_exists('swoole_cpu_num')) {
    function swoole_cpu_num()
    {
        return 4;
    }
}
if (!function_exists('param_validate'))
{
    /**
     * @desc 验证器助手函数
     * @param array $data 数据
     * @param string|array $validate 验证器类名或者验证规则数组
     * @param array $message 错误提示信息
     * @param array $scene 场景
     * @param bool $batch 是否批量验证
     * @param bool $failException 是否抛出异常
     * @return bool
     */
    function param_validate(array $data, $validate = '', string $scene = '',array $message = [], bool $batch = false, bool $failException = true)
    {
        if(!empty($scene))
        {
            $validate = $validate.'.'.$scene;
        }
        if (is_array($validate)) {
            $v = new think\validate();
            $v->rule($validate);
        } else {
            if (strpos($validate, '.')) {
                [$validate, $scene] = explode('.', $validate);
            }
            $v = new $validate();
            if (!empty($scene)) {
                $v->scene($scene);
            }
        }
        if(!$v->check($data))
        {
            throw new \exceptions\ApiException($v->getError());
        }
    }
}

use function Swoole\Coroutine\batch;

if (!function_exists('tig_batch_task')) {

    /**
     * 批量异步步执行代码
     * @return array
     */
    function tig_batch_task(array $tasks)
    {
        if (extension_loaded('swoole') && config('app.IS_PRO') && php_sapi_name() == 'cli') {
            return batch($tasks);
        } else {
            $data = [];
            foreach ($tasks as $key => $task) {
                $data[$key] = $task();
            }
            return $data;
        }
    }
}

//生成随机数
    if(!function_exists('random_num'))
    {
        function random_num(int $num , array $search = [])
        {
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            while (true) {
                $randomString = '';
                for ($i = 0; $i < $num; $i++) {
                    $randomString .= $characters[mt_rand(0, $charactersLength - 1)];
                }
                if(empty($search) || !in_array($randomString, $search)) {
                    break;
                }
           }
           return $randomString;
        }
    }

//判断是不是json
if(!function_exists('is_json')){
    function is_json($string) {
        // 尝试将字符串解码为 JSON
        $data = json_decode($string, true);

        // 如果解码失败，或者解码后的数据类型不是数组或对象，则不是有效的 JSON
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        return true;
    }
}
