<?php
//**---------------------------------------------------------------------+
//** 后台控制器文件 -- 设置项
//**---------------------------------------------------------------------+
//** 版权所有：江西佰商科技有限公司. 官网：https://www.tigshop.com
//**---------------------------------------------------------------------+
//** 作者：Tigshop团队，yq@tigshop.com
//**---------------------------------------------------------------------+
//** 提示：Tigshop商城系统为非免费商用系统，未经授权，严禁使用、修改、发布
//**---------------------------------------------------------------------+

namespace app\adminapi\controller\setting;

use app\adminapi\AdminBaseController;
use app\model\setting\Region;
use app\service\admin\file\FileStorage;
use app\service\admin\pay\CertificatesService;
use app\service\admin\setting\ConfigService;
use think\App;
use think\Response;
use utils\Config as ShopConfig;

/**
 * 设置项控制器
 */
class Config extends AdminBaseController
{
    protected ConfigService $configService;

    /**
     * 构造函数
     *
     * @param App $app
     * @param ConfigService $configService
     */
    public function __construct(App $app, ConfigService $configService)
    {
        parent::__construct($app);
        $this->configService = $configService;
    }


    /**
     * 基础设置
     * @return Response
     */
    public function basicSettings()
    {
        $properties = [
            'shopName',
            'shopTitle',
            'shopTitleSuffix',
            'shopKeywords',
            'shopDesc',
            'shopLogo',
            'icoImg',
            'defaultAvatar',
            'pcDomain',
            'h5Domain',
            'adminDomain',
            'closeOrder',
            'shopRegClosed',
            'autoRedirect',
            'isOpenMobileAreaCode',
            'usernamePrefix',
            'kefuAddress',
            'shopIcpNo',
            'shopIcpNoUrl',
            'shop110No',
            'shop110Link',
            'openWechatRegister',
            'wechatRegisterBindPhone',
            'openWechatOauth',
            'autoDeliveryDays',
            'autoReturnGoods',
            'autoReturnGoodsDays',
            'afterSalesLimitDays',
            'googleLoginOn',
            'googleClientId',
            'googleClientId',
            'facebookLoginOn',
            'facebookClientId',
            'facebookClientSecret',
            'uploadMaxSize'
        ];

        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 商品设置
     * @return Response
     */
    public function productSettings()
    {
        $properties = [
            'dollarSign',
            'dollarSignCn',
            'snPrefix',
            'showSelledCount',
            'showMarketprice',
            'marketPriceRate'
        ];
        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 获取通知配置
     * @return Response
     */
    public function notifySettings()
    {
        $properties = [
            'smsKeyId',
            'smsKeySecret',
            'smsSignName',
            'smsShopMobile',
            'serviceEmail',
            'sendConfirmEmail',
            'orderPayEmail',
            'sendServiceEmail',
            'sendShipEmail'
        ];
        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }


    /**
     * 购物设置
     * @return Response
     */
    public function shoppingSettings()
    {
        $properties = [
            'childAreaNeedRegion',
            'autoCancelOrderMinute',
            'integralName',
            'integralScale',
            'orderSendPoint',
            'integralPercent',
            'commentSendPoint',
            'showSendPoint',
            'useQiandaoPoint',
            'canInvoice',
            'invoiceAdded',
            'returnConsignee',
            'returnMobile',
            'returnAddress'
        ];
        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 获取显示配置
     * @return Response
     */
    public function showSettings()
    {
        $properties = [
            'searchKeywords',
            'msgHackWord',
            'isOpenPscws',
            'selfStoreName',
            'shopDefaultRegions',
            'defaultCountry',
            'showCatLevel'
        ];

        $result = $this->configService->getConfigByBizCode($properties);
        $result = $this->configService->fuzzyConfig($result);
        $country = Region::where('parent_id', 0)->select();
        $result['countries'] = $country ? $country->toArray() : [];
        return $this->success($result);
    }

    /**
     * 获取客服配置
     * @return Response
     */
    public function kefuSettings()
    {
        $properties = [
            'kefuType',
            'kefuYzfType',
            'kefuYzfSign',
            'kefuWorkwxId',
            'corpId',
            'kefuCode',
            'kefuCodeBlank',
            'kefuPhone',
            'kefuTime'
        ];

        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 保存客服配置
     * @return Response
     */
    public function saveKefu(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 获取分类页装修配置
     * @return Response
     */
    public function categoryDecorateSettings()
    {
        $properties = [
            'productCategoryDecorateType',
        ];

        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 保存分类页装修配置
     * @return Response
     */
    public function saveCategoryDecorate(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }


    /**
     *
     * @return Response
     */
    public function themeStyleSettings()
    {
        $properties = [
            'themeStyle',
        ];


        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     *
     * @return Response
     */
    public function saveThemeStyle(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }


    /**
     * 获取接口配置
     * @return Response
     */
    public function apiSettings()
    {
        $properties = [
            'wechatAppId',
            'wechatAppSecret',
            'wechatServerUrl',
            'wechatServerToken',
            'wechatServerSecret',
            'wechatMiniProgramAppId',
            'wechatMiniProgramSecret',
            'wechatPayAppId',
            'wechatPayAppSecret',
            'icoTigCss',
            'icoDefinedCss',
            'storageType',
            'storageSaveFullPath',
            'storageLocalUrl',
            'storageOssUrl',
            'storageOssAccessKeyId',
            'storageOssAccessKeySecret',
            'storageOssBucket',
            'storageOssRegion',
            'storageCosUrl',
            'storageCosSecretId',
            'storageCosSecretKey',
            'storageCosBucket',
            'storageCosRegion',
            'langOn',
            'langType',
            'langVolcengineAccessKey',
            'langVolcengineSecret'
        ];


        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 保存接口配置
     * @return Response
     */
    public function saveApi(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 获取会员认证配置
     * @return Response
     */
    public function authSettings()
    {
        $properties = [
            'type',
            'isIdentity',
            'isEnquiry',
            'smsNote',
            'tips'
        ];


        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 获取邮箱配置
     * @return Response
     */
    public function mailSettings()
    {
        $properties = [
            'mailService',
            'smtpSsl',
            'smtpHost',
            'smtpPort',
            'smtpUser',
            'smtpPass',
            'smtpMail',
            'mailCharset',
            'testMailAddress'
        ];


        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 获取物流配置
     * @return Response
     */
    public function shippingSettings()
    {
        $properties = [
            'logisticsType',
            'kdniaoApiKey',
            'kdniaoBusinessId',
            'sender',
            'mobile',
            'provinceName',
            'cityName',
            'areaName',
            'address'
        ];


        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 获取支付配置
     * @return Response
     */
    public function paySettings()
    {
        $paySaveParam = [
            'basicPaySettings' => [
                'useSurplus' => 0, // 是否启用余额支付；0-不支持，1-支持
                'usePoints' => 0, // 是否启用积分支付；0-不支持，1-支持
                'useCoupon' => 0, // 是否启用优惠券；0-不支持，1-支持
            ],
            'wechatPaySettings' => [
                'useWechat' => 0, // 是否启用微信支付；0-关闭，1-开启
                'wechatMchidType' => 1, // 微信商户号类型；1-普通商户模式，2-服务商模式
                'wechatPayMchid' => '', // 微信商户号
                'wechatPaySubMchid' => 0, // 微信子商户号
                'wechatPayKey' => '', // 商户API密钥
                'wechatPaySerialNo' => '', // 商户证书序列号
                'wechatPayCertificate' => 0, // 商户API证书
                'wechatPayPrivateKey' => 0, // 商户API证书密钥
                'wechatPayCheckType' => 1, // 验证微信支付方式；1-平台证书，2-微信支付公钥
                'wechatPayPlatformCertificate' => 0, // 平台证书
                'wechatPayPublicKeyId' => 0, // 微信支付公钥ID
                'wechatPayPublicKey' => 0, // 微信支付公钥文件
            ],
            'aliPaySettings' => [
                'useAlipay' => 0, // 是否启用支付宝支付；0-关闭，1-开启
                'alipayAppid' => '', // 支付宝APPID
                'alipayRsaPrivateKey' => '', // 应用私钥
                'alipayRsaPublicKey' => '', // 支付宝公钥
            ],
            'yaBandPaySettings' => [
                'useYabanpay' => 0, // 是否启用YaBand支付；0-关闭，1-开启
                'useYabanpayWechat' => 0, // 是否启用YaBand微信支付；0-关闭，1-开启
                'useYabanpayAlipay' => 0, // 是否启用YaBand支付宝支付；0-关闭，1-开启
                'yabanpayCurrency' => '', // YaBand支付货币类型
                'yabandpayUid' => '', // YaBand支付UID
                'yabandpaySecretKey' => '', // YaBand支付密钥
                'yabandPayCurrencyList' => [], // YaBand支付货币类型列表
            ],
            'offlinePaySettings' => [
                'useOffline' => 0, // 是否启用线下支付；0-关闭，1-开启
                'offlinePayBank' => '', // 银行汇款
                'offlinePayCompany' => '', // 企业汇款
            ],
            'payPalSettings' => [
                'usePaypal' => 0, // 是否启用PayPal支付；0-关闭，1-开启
                'paypalCurrency' => '', // PayPal货币类型
                'paypalClientId' => '', // PayPal客户端ID
                'paypalSecret' => '', // PayPal密钥
                'paypalCurrencyList' => [], // PayPal货币类型列表
            ],
            'yunPaySettings' => [
                'useYunpay' => 0, // 是否启用云支付；0-关闭，1-开启
                'yunpayUid' => '', // 商户号
                'yunpaySecretKey' => '', // 商户秘钥
            ],
        ];

        $allKey = [];
        foreach ($paySaveParam as $key => $value) {
            $allKey = array_merge($allKey, array_keys($value));
        }

        $result = $this->configService->getConfigByBizCode($allKey);
        $result = $this->configService->fuzzyConfig($result);
        foreach ($paySaveParam as $key => &$value) {
            foreach ($value as $k => $v) {
                if (isset($result[$k])) {
                    $value[$k] = $result[$k];
                }
            }
        }
        return $this->success($paySaveParam);
    }

    /**
     * 获取售后配置
     * @return Response
     */
    public function afterSalesSettings()
    {
        $properties = [
            'templateContent',
        ];


        $result = $this->configService->getConfigByBizCode($properties);
        return $this->success($this->configService->fuzzyConfig($result));
    }

    /**
     * 保存会员认证配置
     * @return Response
     */
    public function saveAuth(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 基础设置
     * @return Response
     */
    public function getBase(): Response
    {
        $code =$this->request->all('code');
        $config = $this->configService->getConfig($code);
        if ($code == 'payment') {
            //检测证书状态
            $public_key = app()->getRootPath() . '/runtime/certs/wechat/public_key.pem';
            $private_key = app()->getRootPath() . '/runtime/certs/wechat/apiclient_key.pem';
            $certificate = app()->getRootPath() . '/runtime/certs/wechat/apiclient_cert.pem';
            $platform_certs = app()->getRootPath() . '/runtime/certs/wechat/cert.pem';
            if (is_file($public_key)) {
                $config['wechatPayPublicKey'] = 1;
            }
            if (is_file($private_key)) {
                $config['wechatPayPrivateKey'] = 1;
            }
            if (is_file($certificate)) {
                $config['wechatPayCertificate'] = 1;
            }
            if (is_file($platform_certs)) {
                $config['wechatPayPlatformCertificate'] = 1;
            }
        }
        if (in_array($code, $this->configService->base_code)) {
            //基础设置项模糊处理
            $config = $this->configService->fuzzyConfig($config);
        }

        $result = [
            'item' => $config,
        ];
        if ($code == 'base') {
            $country = Region::where('parent_id', 0)->select();
            $result['countrys'] = $country ? $country->toArray() : [];
        }
        return $this->success($result);
    }

    /**
     * 后台需要的设置项
     * @return Response
     */
    public function getAdmin(): Response
    {
        $config = $this->configService->getAdminConfig();
        return $this->success($config);
    }

    /**
     * 保存通知配置
     * @return Response
     */
    public function saveNotify(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 保存通知配置
     * @return Response
     */
    public function saveShow(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 保存商品配置
     * @return Response
     */
    public function saveProduct(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 保存购物配置
     * @return Response
     */
    public function saveShopping(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 基础设置更新
     * @return Response
     */
    public function savePay(): Response
    {
        $data = $this->request->all();
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $result = $this->configService->save($value);
            }
        }
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */'设置项更新失败');
        }
    }

    /**
     * 编辑配置
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function update(): Response
    {
        $code =$this->request->all('code');
        $data =$this->request->all("data/a", []);
        $result = $this->configService->saveConfig($code, $data);
        return $result ? $this->success() : $this->error(/** LANG */'设置项更新失败');
    }

    /**
     * 邮箱服务器设置
     * @return Response
     */
    public function saveMail(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 获取图标icon
     * @return Response
     */
    public function getIcon(): Response
    {
        $ico_tig = [];
        $tig_class = '';
        $ico_defined = [];
        $defined_class = '';

        //官方ico
        $ico_tig_css = 'https://at.alicdn.com/t/c/font_4441878_yhhbx075z7a.css';
        if (!empty($ico_tig_css) && strpos($ico_tig_css, 'http') === 0 && substr($ico_tig_css, -4) === '.css') {
            $data = cache($ico_tig_css);
            if ($data === null) {
                $content = file_get_contents($ico_tig_css);
                preg_match_all("/" . '\.' . "(.*?)" . '\:before' . "/", $content, $return);
                $ico_tig = $return[1];
                unset($ico_tig[0]);
                preg_match('/font-family:\s*"([^"]+)";/', $content, $matches);
                $tig_class = $matches[1];
                $data['ico_tig'] = $ico_tig;
                $data['tig_class'] = $tig_class;
                cache($ico_tig_css, $data);
            } else {
                $ico_tig = $data['ico_tig'];
                $tig_class = $data['tig_class'];
            }
        }

        // 自定义ico
        $ico_defined_css = ShopConfig::get('icoDefinedCss');
        if (!empty($ico_defined_css) && strpos($ico_defined_css, 'http') === 0 && substr($ico_defined_css,
            -4) === '.css') {
            $data = cache($ico_defined_css);
            if ($data === null) {
                $content = file_get_contents($ico_defined_css);
                preg_match_all("/" . '\.' . "(.*?)" . '\:before' . "/", $content, $return);
                $ico_defined = $return[1];
                unset($ico_defined[0]);
                preg_match('/font-family:\s*"([^"]+)";/', $content, $matches);
                $defined_class = $matches[1];
                $data['ico_defined'] = $ico_defined;
                $data['defined_class'] = $defined_class;
                cache($ico_defined_css, $data);
            } else {
                $ico_defined = $data['ico_defined'];
                $defined_class = $data['defined_class'];
            }
        }

        return $this->success([
            'ico_tig' => $ico_tig,
            'tig_class' => $tig_class,
            'ico_defined' => $ico_defined,
            'defined_class' => $defined_class,
        ]);
    }

    /**
     * 发送测试邮件
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function sendTestEmail(): Response
    {
        $email =$this->request->all("test_mail_address");
        $result = $this->configService->sendTestMail($email);
        return $result ? $this->success(/** LANG */'测试邮件已发送到' . $email) : $this->error(/** LANG */'邮件发送失败，请检查您的邮件服务器设置！');
    }

    /**
     * 上传API文件
     * @return Response
     * @throws \exceptions\ApiException
     */
    public function uploadFile(): Response
    {
        $type =$this->request->all('type/d');
        $rootPathName = app()->getRootPath() . '/runtime/certs/wechat/';
        $fileName = '';
        if ($type == 1) {
            $fileName = 'apiclient_cert.pem';
        }
        if ($type == 2) {
            $fileName = 'apiclient_key.pem';
        }
        if ($type == 3) {
            $fileName = 'public_key.pem';
        }
        if (empty($fileName)) {
            return $this->error(/** LANG */'未定义文件类型！');
        }
        $fileObj = request()->file('file');
        if (!$fileObj) {
            return $this->error(/** LANG */'未上传文件！');
        }
        $file = new FileStorage($fileObj, 0, $rootPathName, $fileName);
        $file->save();
        return $this->success();
    }

    /**
     * 生成平台证书
     * @return Response
     */
    public function createPlatformCertificate(): Response
    {
        try {
            app(CertificatesService::class)->getCertificates();
            return $this->success();
        } catch (\Exception $exception) {
            return $this->error($exception->getMessage());
        }
    }

    /**
     * 获取商城基础配置
     * @return Response
     */
    public function basicConfig(): Response
    {
        // 获取基础配置
        $result = $this->configService->getBasicConfig();
        return $this->success($result);
    }

    public function saveAfterSales(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    public function saveShipping(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 保存商城基础配置
     * @return Response
     */
    public function saveBasic(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */'设置项更新失败');
        }
    }

    /**
     * 获取主题切换配置
     * @return Response
     */
    public function layoutThemeSwitchSettings(): Response
    {
        $item = app(ConfigService::class)->getConfigByBizCode([
            'layout',
            'navTheme',
            'primaryColor',
            'uniqueOpened',
            'isMultiLabel'
        ]);
        return $this->success(
            $item
        );
    }

    /**
     * 获取商户配置
     * @return Response
     */
    public function merchantSettings(): Response
    {
        $item = app(ConfigService::class)->getConfigByBizCode([
            'personApplyEnabled',
            'merchantApplyNeedCheck',
            'maxShopCount',
            'shopAgreement',
            'shopProductNeedCheck',
            'maxRecommendProductCount',
            'shopRankDateRage',
            'enabledCommissionOrder',
            'defaultAdminPrefix',
            'maxSubAdministrator',
            'defaultShopName'
        ]);
        return $this->success(
            $item
        );
    }

    /**
     * 保存商户配置
     * @return Response
     */
    public function saveMerchant(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

    /**
     * 获取店铺配置
     * @return Response
     */
    public function shopSettings()
    {
        $item = app(ConfigService::class)->getConfigByBizCode([
            'shopProductNeedCheck',
            'maxRecommendProductCount',
            'maxSubAdministrator',
            'defaultShopName'
        ]);
        return $this->success(
            $item
        );
    }

    /**
     * 保存店铺配置
     * @return Response
     */
    public function saveShop(): Response
    {
        $data = $this->request->all();
        $result = $this->configService->save($data);
        if ($result) {
            return $this->success();
        } else {
            return $this->error(/** LANG */ '设置项更新失败');
        }
    }

}
