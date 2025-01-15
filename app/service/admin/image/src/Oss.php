<?php

namespace app\service\admin\image\src;

use OSS\Core\OssException;
use OSS\OssClient;
use think\Exception;
use think\File\UploadedFile;
use utils\Config;

class Oss
{
    protected object $ossClient;
    protected string $bucket;
    protected object|string $image;
    protected string $orgPath; //源文件
    protected string $filePath; //如 img/item/202301/example.jpg
    protected bool $watermark = false;
    protected string|null $url = null;

    public function __construct()
    {
        $accessKeyId = Config::get('storage_oss_access_key_id', 'base_api_storage');
        $accessKeySecret = Config::get('storage_oss_access_key_secret', 'base_api_storage');
        $bucket = Config::get('storage_oss_bucket', 'base_api_storage');
        $endpoint = Config::get('storage_oss_region', 'base_api_storage');
        if (empty($accessKeyId) || empty($accessKeySecret) || empty($endpoint) || empty($bucket)) {
            throw new Exception("OSS参数设置错误！");
        }
        $this->bucket = $bucket;
        $this->ossClient = new OssClient($accessKeyId, $accessKeySecret, $endpoint);
    }

    /**
     * 设置文件
     * @param UploadedFile|string $image
     * @return void
     */
    public function setImage(UploadedFile|string $image): void
    {
        $this->image = $image;
    }

    /**
     * 设置源文件地址
     * @param $orgPath
     * @return void
     */
    public function setOrgPath($orgPath): void
    {
        $this->orgPath = $orgPath;
    }

    /**
     * 设置文件地址
     * @param $filePath
     * @return void
     */
    public function setFilePath($filePath): void
    {
        $this->filePath = $filePath;
    }

    /**
     * 保存图片
     * @return string
     * @throws Exception
     */
    public function save(): string
    {
        try {
            if (is_string($this->image)) {
                //替换oss链接地址
                $storage_url = Config::get('storage_oss_url', 'base_api_storage');
                $orgPath = str_replace($storage_url, '', $this->orgPath);
                $this->ossClient->copyObject($this->bucket, $orgPath, $this->bucket, $this->filePath);
            } else {
                $this->ossClient->uploadFile($this->bucket, $this->filePath, $this->orgPath);
            }
        } catch (OssException $e) {
            throw new Exception('上传图片失败:' . $e->getMessage());
        }
        $this->url = $this->filePath;
        $upload_save_full_domain = Config::get('upload_save_full_domain');
        if ($upload_save_full_domain) {
            $storage_url = Config::get('storage_oss_url', 'base_api_storage');
            return $storage_url . $this->filePath;
        }

        return $this->changeFilePath();
    }

    /**
     * 转换返回文件路径
     * @return string
     */
    public function changeFilePath(): string
    {
        $upload_save_full_domain = Config::get('storage_save_full_path', 'base_api_storage');
        if ($upload_save_full_domain) {
            $storage_url = Config::get('storage_oss_url', 'base_api_storage');
            return $storage_url . $this->filePath;
        }

        return $this->filePath;
    }

    /**
     * 创建缩略图
     * @param int $width
     * @param int $height
     * @return string
     * @throws Exception
     */
    public function makeThumb(int $width = 0, int $height = 0): string
    {
        if (!$this->url) {
            $this->save();
        }
        $width = $width > 0 ? ',h_' . $width : '';
        $height = $height > 0 ? ',h_' . $height : '';
        $filePath = $this->changeFilePath();
        return $filePath . '?x-oss-process=image/resize,m_pad' . $width . $height;
    }

    /**
     * 获取缩略图地址
     * @param string $imageUrl
     * @param int $width
     * @param int $height
     * @return string
     */
    public function getThumb(string $imageUrl, int $width = 0, int $height = 0): string
    {
        $width = $width > 0 ? ',h_' . $width : '';
        $height = $height > 0 ? ',h_' . $height : '';
        return $imageUrl . '?x-oss-process=image/resize,m_pad' . $width . $height;
    }

    /**
     * 获取url地址
     * @return string
     */
    public function getUrl(): string
    {
        return $this->url;
    }

}
