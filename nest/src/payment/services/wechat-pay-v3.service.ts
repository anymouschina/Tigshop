// @ts-nocheck
import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
// wechatpay-node-v3 使用 CommonJS 导出（export = Pay），需用 require 方式导入
import Pay = require("wechatpay-node-v3");
import { ConfigService as SettingConfigService } from "src/setting/config.service";

type WechatPaySettings = {
  appId?: string; // 公众号/小程序 appid（JSAPI 需要）
  mchId?: string; // 商户号 mchid
  mchid?: string; // 兼容字段
  mch_id?: string; // 兼容字段
  // 服务商/子商户模式（可选）：如果存在 spMchId + subMchId 将按服务商模式构造参数
  spMchId?: string; // 服务商商户号 sp_mchid
  sp_mchid?: string; // 兼容字段
  subMchId?: string; // 子商户号 sub_mchid，可在单笔下单参数中覆盖
  sub_mchid?: string; // 兼容字段
  subAppId?: string; // 子商户 appid （部分场景）
  sub_appid?: string;
  serialNo?: string; // 商户证书序列号
  serial_no?: string; // 兼容字段
  mchSerialNo?: string; // 兼容字段
  apiV3Key?: string; // API v3 Key（部分回调/解密用，预留）
  privateKey?: string; // 直接粘贴的私钥内容（PEM）
  privateKeyPem?: string; // 同上
  private_key?: string; // 兼容
  privateKeyPath?: string; // 私钥路径（相对仓库根或绝对路径）
  apiclientKeyPath?: string; // 兼容，例如 cert/apiclient_key.pem
  publicKey?: string; // 直接粘贴的商户API证书公钥内容（PEM），可选
  publicKeyPem?: string; // 同上
  public_key?: string; // 兼容
  publicKeyPath?: string; // 商户API证书公钥路径（apiclient_cert.pem）
  apiclientCertPath?: string; // 兼容，例如 cert/apiclient_cert.pem
  notifyUrl?: string; // 支付结果回调地址（绝对 https URL）
  apiBase?: string; // 可选，默认 https://api.mch.weixin.qq.com
};

@Injectable()
export class WechatPayV3Service {
  private readonly logger = new Logger(WechatPayV3Service.name);

  // 简单内存缓存，减少每次调用都读取/解析证书开销；TTL 默认 60 秒，可视需要调整
  private cachedSettings: any | null = null;
  private cachedAt = 0;
  private SETTINGS_TTL_MS = 60_000;

  constructor(private readonly settingConfig: SettingConfigService) {}

  private async getWechatPaySettings(forceRefresh = false): Promise<
    Required<Pick<WechatPaySettings, "appId" | "mchId">> & {
      serialNo?: string;
      privateKeyPem: string;
      publicKeyPem: string;
      apiBase: string;
      notifyUrl?: string;
      apiV3Key?: string;
      spMchId?: string;
      subMchId?: string;
      subAppId?: string;
    }
  > {
    if (!forceRefresh && this.cachedSettings && Date.now() - this.cachedAt < this.SETTINGS_TTL_MS) {
      return this.cachedSettings;
    }
    const cfg = (await this.settingConfig.getJsonConfig("wechatPaySettings")) || {};
    const pick = (obj: any, keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = obj?.[k];
        if (v != null && String(v).trim() !== "") return String(v);
      }
      return undefined;
    };

  // JSAPI 场景优先小程序 appid
  const appId = pick(cfg, ["wechatMiniProgramAppId", "appId", "wechatPayAppId", "appid"]);
  const mchId = pick(cfg, ["mchId", "mchid", "mch_id", "wechatPayMchid"]);
  const spMchId = pick(cfg, ["spMchId", "sp_mchid", "sp_mchId"]);
  const subMchId = pick(cfg, ["subMchId", "sub_mchid", "sub_mchId"]);
  const subAppId = pick(cfg, ["subAppId", "sub_appid"]);
  const serialNo = pick(cfg, ["serialNo", "serial_no", "mchSerialNo", "wechatPaySerialNo"]);
  const apiV3Key = pick(cfg, ["apiV3Key", "apiv3Key", "api_v3_key", "key"]);
  // notifyUrl 优先从 wechatPaySettings 取；否则尝试从 apiSettings 的 wechatServerUrl 推导
  let notifyUrl = pick(cfg, ["notifyUrl", "notify_url"]);
  const privateKeyPemInline = pick(cfg, ["privateKey", "privateKeyPem", "private_key"]);
  let privateKeyPath = pick(cfg, ["privateKeyPath", "apiclientKeyPath"]);
  const publicKeyPemInline = pick(cfg, ["publicKey", "publicKeyPem", "public_key"]);
  let publicKeyPath = pick(cfg, ["publicKeyPath", "apiclientCertPath"]);
    const apiBase = pick(cfg, ["apiBase"]) || "https://api.mch.weixin.qq.com";

    let privateKeyPem = privateKeyPemInline;
    if (!privateKeyPem && privateKeyPath) {
      const abs = path.isAbsolute(privateKeyPath)
        ? privateKeyPath
        : path.resolve(process.cwd(), privateKeyPath);
      if (!fs.existsSync(abs)) {
        throw new HttpException(`微信支付私钥文件不存在: ${abs}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      privateKeyPem = fs.readFileSync(abs, "utf8");
    }
    // 默认尝试使用仓库内 cert/apiclient_key.pem
    if (!privateKeyPem && !privateKeyPath) {
      const guess = path.resolve(process.cwd(), "cert/apiclient_key.pem");
      if (fs.existsSync(guess)) {
        privateKeyPem = fs.readFileSync(guess, "utf8");
        privateKeyPath = guess;
      }
    }

    let publicKeyPem = publicKeyPemInline;
    if (!publicKeyPem && publicKeyPath) {
      const abs = path.isAbsolute(publicKeyPath) ? publicKeyPath : path.resolve(process.cwd(), publicKeyPath);
      if (!fs.existsSync(abs)) {
        throw new HttpException(`微信支付公钥文件不存在: ${abs}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      publicKeyPem = fs.readFileSync(abs, "utf8");
    }
    // 默认尝试使用仓库内 cert/apiclient_cert.pem
    if (!publicKeyPem && !publicKeyPath) {
      const guess = path.resolve(process.cwd(), "cert/apiclient_cert.pem");
      if (fs.existsSync(guess)) {
        publicKeyPem = fs.readFileSync(guess, "utf8");
        publicKeyPath = guess;
      }
    }

  // 推导 notifyUrl：以配置的 wechatServerUrl 作为域名（必须含 http/https），拼接 /order/pay/notify/wechat
    if (!notifyUrl) {
      const map = await this.settingConfig.getConfigsByCodes(["wechatServerUrl"]);
      const base = (map?.wechatServerUrl || "").trim();
      if (base && /^https?:\/\//i.test(base)) {
        notifyUrl = base.replace(/\/$/, "") + "/order/pay/notify/wechat";
      }
    }
    // 最终兜底默认（仍提供但建议显式配置）
    if (!notifyUrl) {
      notifyUrl = "https://beqlee.icu/order/pay/notify/wechat";
    }

    // 微信官方校验正则当前不接受 querystring，这里剥离 ? 之后的部分。
    const originalNotify = notifyUrl;
    if (notifyUrl.includes("?")) {
      notifyUrl = notifyUrl.split("?")[0];
      this.logger.warn(`移除 notifyUrl 中的查询参数: 原=${originalNotify} 现=${notifyUrl}`);
    }
    if (notifyUrl.includes("#")) {
      notifyUrl = notifyUrl.split("#")[0];
    }

  const isAbsoluteHttp = (u: string) => /^https?:\/\//i.test(u || "");

    if (!appId || !mchId || !privateKeyPem) {
      throw new HttpException(
        "微信支付设置缺失，请在设置中心配置 wechatPaySettings 的 appId、mchId 与私钥(privateKey)",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!publicKeyPem) {
      // SDK 构造必须提供商户API证书公钥(apiclient_cert.pem)
      throw new HttpException(
        "微信支付设置缺失：请在 wechatPaySettings 中配置 publicKey/publicKeyPath 或将证书放到 cert/apiclient_cert.pem",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 回调地址非必填（若商户平台已配置默认回调），但若提供则需是 http(s) 完整地址
    if (notifyUrl && !isAbsoluteHttp(notifyUrl)) {
      this.logger.warn(`无效的微信支付回调地址: ${notifyUrl}，将回退到默认 https://domain.beqlee.icu/order/pay/notify/wechat (请在 wechatPaySettings.notifyUrl 或 wechatServerUrl 正确配置完整 https:// 域名)`);
      notifyUrl = "https://domain.beqlee.icu/order/pay/notify/wechat"; // 占位域名，务必替换
    }

    // 计算证书内序列号用于对比（便于排查配置错误）
    let derivedSerial: string | undefined;
    try {
      const tmpPay = new Pay({
        appid: appId,
        mchid: mchId,
        publicKey: Buffer.from(publicKeyPem),
        privateKey: Buffer.from(privateKeyPem),
        userAgent: "tigshop-nest/1.0",
      } as any);
      derivedSerial = tmpPay.getSN(Buffer.from(publicKeyPem));
    } catch (e) {
      this.logger.warn(`无法从证书解析序列号: ${(e as Error)?.message}`);
    }

    if (serialNo && derivedSerial && serialNo !== derivedSerial) {
      this.logger.warn(`配置中的 serialNo(${serialNo.slice(0,8)}***) 与证书内序列号(${derivedSerial.slice(0,8)}***) 不一致，将优先使用证书序列号进行签名。`);
    }

    const snapshot = {
      appId,
      mchId,
      serialNo: serialNo ? serialNo.slice(0, 8) + "***" : undefined, // 局部显示
      derivedSerial: derivedSerial ? derivedSerial.slice(0, 8) + "***" : undefined,
      notifyUrl,
      apiBase,
      privateKeySource: privateKeyPemInline ? "inline" : (privateKeyPath ? `file:${privateKeyPath}` : "default-cert/apiclient_key.pem"),
      publicKeySource: publicKeyPemInline ? "inline" : (publicKeyPath ? `file:${publicKeyPath}` : "default-cert/apiclient_cert.pem"),
    };
    this.logger.debug(`[wechatPaySettings] 加载完成: ${JSON.stringify(snapshot)}`);

    const settings = { appId, mchId, serialNo, notifyUrl, privateKeyPem, publicKeyPem, apiBase, apiV3Key, spMchId, subMchId, subAppId } as any;
    this.cachedSettings = settings;
    this.cachedAt = Date.now();
    return settings;
  }

  // 对外暴露一个脱敏的配置快照，便于上层记录 debug
  async getConfigDebugSnapshot() {
    const cfg = await this.getWechatPaySettings();
    return {
      appId: cfg.appId,
      mchId: cfg.mchId,
      serialNo: cfg.serialNo ? cfg.serialNo.slice(0, 8) + "***" : undefined,
      notifyUrl: cfg.notifyUrl,
      apiBase: cfg.apiBase,
    };
  }

  // JSAPI 预下单：返回 prepay_id
  async unifiedOrderJsapi(params: {
    outTradeNo: string;
    description: string;
    total: number; // 元（保留两位，可为整数/浮点，将转为分）
    payerOpenId: string; // 若服务商模式可传 subPayerOpenId 替代
    attach?: string; // 附加数据 attach（原样返回回调 / 查询）
    timeExpire?: string | Date; // 过期时间 RFC3339 / yyyy-MM-ddTHH:mm:ss+TZ
    sceneInfo?: { payerClientIp?: string; h5Info?: any }; // 场景信息
    subMchId?: string; // 单笔覆盖子商户号
    subAppId?: string; // 单笔覆盖子商户 appid
    subPayerOpenId?: string; // 服务商模式下子商户用户 openid
  }): Promise<{ prepay_id: string }>{
  const { appId, mchId, notifyUrl, privateKeyPem, publicKeyPem, apiV3Key, spMchId, subMchId: cfgSubMchId, subAppId: cfgSubAppId } = await this.getWechatPaySettings();
    const disableNotify = process.env.WECHAT_DISABLE_NOTIFY === 'true';

    const pay = new Pay({
      appid: appId,
      mchid: mchId,
      // 不显式传 serial_no，交由 SDK 从公钥证书自动推导，避免配置错误导致 SIGN_ERROR
      publicKey: publicKeyPem ? Buffer.from(publicKeyPem) : undefined,
      privateKey: Buffer.from(privateKeyPem),
      key: apiV3Key,
      userAgent: "tigshop-nest/1.0",
    } as any);

    // 处理金额：避免浮点累积误差，保留两位后转整数
    const amountFen = Math.round(Number((params.total ?? 0).toFixed(2)) * 100);
    if (amountFen <= 0) {
      throw new HttpException('统一下单失败：金额必须大于 0', HttpStatus.BAD_REQUEST);
    }

    const isServiceProvider = !!spMchId || !!params.subMchId || !!cfgSubMchId;
    const effectiveSubMchId = params.subMchId || cfgSubMchId;
    const effectiveSubAppId = params.subAppId || cfgSubAppId;

    const body: any = {
      description: params.description || '订单支付',
      out_trade_no: params.outTradeNo,
      amount: { total: amountFen },
    };

    if (isServiceProvider) {
      // 服务商模式：sp_appid 可与主体 appId 相同或由配置提供；用户 openid 在子商户上下文 => payer: { sub_openid }
      body.sp_appid = appId; // 仍使用主 appId
      body.sp_mchid = spMchId || mchId; // 若未显式配置 spMchId 则回退主 mchId
      if (!effectiveSubMchId) {
        throw new HttpException('服务商模式统一下单失败：缺少 sub_mchid', HttpStatus.BAD_REQUEST);
      }
      body.sub_mchid = effectiveSubMchId;
      if (effectiveSubAppId) body.sub_appid = effectiveSubAppId;
      body.payer = { sub_openid: params.subPayerOpenId || params.payerOpenId };
    } else {
      // 普通直连商户
      body.appid = appId;
      body.mchid = mchId;
      body.payer = { openid: params.payerOpenId };
    }

    if (params.attach) body.attach = params.attach.slice(0, 128); // 微信限制 128 字节
    if (params.timeExpire) {
      const expireStr = params.timeExpire instanceof Date ? params.timeExpire.toISOString().replace(/\.\d{3}Z$/, '+00:00') : String(params.timeExpire);
      body.time_expire = expireStr;
    }
    if (params.sceneInfo) body.scene_info = params.sceneInfo;
    if (!disableNotify) {
      body.notify_url = notifyUrl;
      if (!body.notify_url) {
        this.logger.error("notify_url 未配置或无效：请在 wechatPaySettings.notifyUrl 填写以 https 开头的完整地址，或在 apiSettings.wechatServerUrl 填写域名以便自动推导。");
        throw new HttpException(
          "微信统一下单失败：缺少 notify_url。可设置 WECHAT_DISABLE_NOTIFY=true 以完全走主动查询模式",
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      this.logger.warn('[wechat-unified-order] 已启用 WECHAT_DISABLE_NOTIFY=true，系统将依赖主动查询补单，请确保主动查询逻辑稳定。');
    }

    const debugBody = {
      ...body,
      payer: isServiceProvider
        ? { ...(body.payer.sub_openid ? { sub_openid: (body.payer.sub_openid || '').slice(0, 6) + '***' } : {}) }
        : { openid: (params.payerOpenId || '').slice(0, 6) + '***' },
    };
    this.logger.debug(`[wechat-unified-order-sdk] transactions_jsapi body=${JSON.stringify(debugBody)}`);

    const result = await pay.transactions_jsapi(body);
    if (result?.status >= 200 && result?.status < 300) {
      const data = result?.data || {};
      if (data?.prepay_id) {
        return { prepay_id: data.prepay_id };
      }
      // 兼容：若返回中已包含 "package":"prepay_id=xxx"，则提取出 prepay_id 继续流程
      if (typeof data?.package === "string" && data.package.startsWith("prepay_id=")) {
        const prepayId = data.package.replace(/^prepay_id=/, "");
        if (prepayId) return { prepay_id: prepayId };
      }
      // 未拿到 prepay_id，按异常处理并打印返回体
      this.logger.error(`微信统一下单返回异常，无 prepay_id: ${JSON.stringify(result)}`);
      throw new HttpException("微信统一下单失败：未返回 prepay_id", HttpStatus.BAD_GATEWAY);
    }
    const errText = result?.error || JSON.stringify(result);
    this.logger.error(`微信统一下单失败: ${errText}`);
    throw new HttpException(`微信统一下单失败: ${errText}`, HttpStatus.BAD_GATEWAY);
  }

  /**
   * Native 下单 (扫码支付) ：返回 code_url
   */
  async unifiedOrderNative(params: {
    outTradeNo: string;
    description: string;
    total: number;
    attach?: string;
    timeExpire?: string | Date;
    sceneInfo?: { payerClientIp?: string; storeInfo?: any };
    subMchId?: string;
  }): Promise<{ code_url: string }>{
    const { appId, mchId, notifyUrl, privateKeyPem, publicKeyPem, apiV3Key, spMchId, subMchId: cfgSubMchId } = await this.getWechatPaySettings();
    const disableNotify = process.env.WECHAT_DISABLE_NOTIFY === 'true';
    const pay = new Pay({
      appid: appId,
      mchid: mchId,
      publicKey: publicKeyPem ? Buffer.from(publicKeyPem) : undefined,
      privateKey: Buffer.from(privateKeyPem),
      key: apiV3Key,
      userAgent: 'tigshop-nest/1.0',
    } as any);
    const amountFen = Math.round(Number((params.total ?? 0).toFixed(2)) * 100);
    if (amountFen <= 0) throw new HttpException('Native 下单失败：金额需大于 0', HttpStatus.BAD_REQUEST);
    const isServiceProvider = !!spMchId || !!params.subMchId || !!cfgSubMchId;
    const effectiveSubMchId = params.subMchId || cfgSubMchId;
    const body: any = {
      description: params.description || '订单支付',
      out_trade_no: params.outTradeNo,
      amount: { total: amountFen },
    };
    if (isServiceProvider) {
      body.sp_appid = appId;
      body.sp_mchid = spMchId || mchId;
      if (!effectiveSubMchId) throw new HttpException('服务商模式 Native 下单缺少 sub_mchid', HttpStatus.BAD_REQUEST);
      body.sub_mchid = effectiveSubMchId;
    } else {
      body.appid = appId;
      body.mchid = mchId;
    }
    if (params.attach) body.attach = params.attach.slice(0, 128);
    if (params.timeExpire) {
      const expireStr = params.timeExpire instanceof Date ? params.timeExpire.toISOString().replace(/\.\d{3}Z$/, '+00:00') : String(params.timeExpire);
      body.time_expire = expireStr;
    }
    if (params.sceneInfo) body.scene_info = params.sceneInfo;
    if (!disableNotify) body.notify_url = notifyUrl; else this.logger.warn('[wechat-native-order] WECHAT_DISABLE_NOTIFY=true 生效');
    const debugBody = { ...body };
    this.logger.debug(`[wechat-native-order-sdk] body=${JSON.stringify(debugBody)}`);
    const result = await pay.transactions_native(body);
    if (result?.status >= 200 && result?.status < 300) {
      const data = result?.data || {};
      if (data?.code_url) return { code_url: data.code_url };
      this.logger.error(`微信 Native 下单返回异常，无 code_url: ${JSON.stringify(result)}`);
      throw new HttpException('微信 Native 下单失败：未返回 code_url', HttpStatus.BAD_GATEWAY);
    }
    const errText = result?.error || JSON.stringify(result);
    this.logger.error(`微信 Native 下单失败: ${errText}`);
    throw new HttpException(`微信 Native 下单失败: ${errText}`, HttpStatus.BAD_GATEWAY);
  }

  /** 通用签名并请求 (仅内部辅助, 简化关单/自定义 API 调用) */
  private async signedRequest(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', urlPath: string, bodyObj?: any, timeout = 8000) {
    const { mchId, serialNo, privateKeyPem, apiBase } = await this.getWechatPaySettings();
    const url = (apiBase || 'https://api.mch.weixin.qq.com') + urlPath;
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';
    const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
    let signature = '';
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(message);
      sign.end();
      signature = sign.sign(privateKeyPem, 'base64');
    } catch (e) {
      this.logger.error(`生成签名失败(${method} ${urlPath}): ${(e as Error).message}`);
      throw new HttpException('微信请求签名失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",serial_no="${serialNo || ''}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`;
    try {
      const resp = await axios.request({
        url,
        method,
        data: bodyStr ? bodyStr : undefined,
        timeout,
        headers: {
          Authorization: auth,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'tigshop-nest/1.0',
        },
        validateStatus: () => true,
      });
      if (resp.status >= 200 && resp.status < 300) return resp.data;
      this.logger.warn(`微信 API 响应非 2xx (${method} ${urlPath}) status=${resp.status} body=${JSON.stringify(resp.data)}`);
      throw new HttpException(`微信接口调用失败(${resp.status})`, HttpStatus.BAD_GATEWAY);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      this.logger.error(`微信 API 请求异常(${method} ${urlPath}): ${(e as Error).message}`);
      throw new HttpException('微信接口调用异常', HttpStatus.BAD_GATEWAY);
    }
  }

  /** 关单：只有未支付 (NOTPAY) 状态可关；成功无返回 body */
  async closeTransaction(outTradeNo: string) {
    if (!outTradeNo) throw new HttpException('关单缺少 outTradeNo', HttpStatus.BAD_REQUEST);
    const { mchId } = await this.getWechatPaySettings();
    const path = `/v3/pay/transactions/out-trade-no/${outTradeNo}/close`;
    try {
      await this.signedRequest('POST', path, { mchid: mchId });
      return true;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('微信关单失败', HttpStatus.BAD_GATEWAY);
    }
  }

  /** 查询退款 (根据商户退款单号) */
  async queryRefund(refundNo: string) {
    if (!refundNo) throw new HttpException('查询退款缺少 refundNo', HttpStatus.BAD_REQUEST);
    const path = `/v3/refund/domestic/refunds/${refundNo}`;
    return this.signedRequest('GET', path);
  }

  /** 强制刷新配置缓存 */
  refreshSettingsCache() {
    this.cachedSettings = null;
    this.cachedAt = 0;
  }

  /**
   * 验证回调签名占位：完整验签需保留并配置微信平台证书(平台公钥)，这里预留接口供后续接入。
   * 当前实现仅记录参数并返回 true（在依赖主动查询且关闭 notify 场景下风险低）。
   * 若需严格验签：需在 wechatPaySettings 中提供 platformCert / platformCertPath，然后使用其公钥对
   *  message = timestamp + "\n" + nonce + "\n" + body + "\n" 做 RSA-SHA256 验签。
   */
  verifyNotifySignature(_headers: Record<string, any>, _rawBody: string): boolean {
    // TODO: 接入平台证书后完善。
    this.logger.debug('[verifyNotifySignature] 暂未启用平台证书严格验签，直接返回 true');
    return true;
  }

  /**
   * 查询交易 (根据商户订单号 out_trade_no)
   * 文档: GET /v3/pay/transactions/out-trade-no/{out_trade_no}?mchid=xxx
   * 返回原始微信响应 data（包含 trade_state, amount, transaction_id 等）
   */
  async queryTransactionByOutTradeNo(outTradeNo: string): Promise<any | null> {
    if (!outTradeNo) return null;
    const { mchId, serialNo, privateKeyPem, apiBase } = await this.getWechatPaySettings();
    // 构造请求
    const urlPath = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${mchId}`;
    const url = (apiBase || "https://api.mch.weixin.qq.com") + urlPath;
    const nonceStr = crypto.randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `GET\n${urlPath}\n${timestamp}\n${nonceStr}\n\n`;
    let signature = "";
    try {
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(message);
      sign.end();
      signature = sign.sign(privateKeyPem, "base64");
    } catch (e) {
      this.logger.error(`生成微信支付查询签名失败: ${(e as Error).message}`);
      return null;
    }
    const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",serial_no="${serialNo || ''}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`;
    try {
      const resp = await axios.get(url, {
        timeout: 8000,
        headers: {
          Authorization: auth,
          Accept: "application/json",
          'User-Agent': 'tigshop-nest/1.0',
        },
      });
      return resp.data;
    } catch (e) {
      this.logger.warn(`微信订单查询失败 out_trade_no=${outTradeNo}: ${(e as Error).message}`);
      return null;
    }
  }

  // 生成前端 JSAPI 的支付参数
  buildJsapiPayInfo(appId: string, prepayId: string) {
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = crypto.randomBytes(16).toString("hex");
    const pkg = `prepay_id=${prepayId}`;
    // paySign = RSA-SHA256(appId\n timeStamp\n nonceStr\n package\n)，使用 wechatpay-node-v3 的签名方法
    const message = `${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
    return this.getWechatPaySettings().then(({ appId: cfgAppId, mchId, serialNo, privateKeyPem, publicKeyPem, apiV3Key }) => {
      const pay = new Pay({
        appid: cfgAppId,
        mchid: mchId,
        // 不显式传 serial_no，交由 SDK 从公钥证书自动推导
        publicKey: publicKeyPem ? Buffer.from(publicKeyPem) : undefined,
        privateKey: Buffer.from(privateKeyPem),
        key: apiV3Key,
        userAgent: "tigshop-nest/1.0",
      } as any);
      const signature = pay.sha256WithRsa(message);
      return {
        appId,
        timeStamp,
        nonceStr,
        package: pkg,
        signType: "RSA",
        paySign: signature,
      };
    });
  }
  
  /**
   * 解密微信支付 v3 通知资源
   * - 入参为 body.resource（包含 ciphertext, nonce, associated_data）
   * - 使用 APIv3 Key 进行 AES-256-GCM 解密
   * - 返回解密后的 JSON 对象（若失败返回 null 并记录日志）
   */
  async decryptNotifyResource(resource: {
    ciphertext: string;
    nonce: string;
    associated_data?: string;
  }): Promise<any | null> {
    if (!resource || !resource.ciphertext || !resource.nonce) return null;
    try {
      const { apiV3Key } = (await this.getWechatPaySettings()) as any;
      if (!apiV3Key || String(apiV3Key).length !== 32) {
        this.logger.error("缺少有效的 apiV3Key（长度需为32字节）以解密微信通知");
        return null;
      }
      const key = Buffer.from(String(apiV3Key), "utf8");
      const iv = Buffer.from(String(resource.nonce), "utf8");
      const authTagLen = 16; // GCM tag 为 16 字节
      const ciphertextBuf = Buffer.from(resource.ciphertext, "base64");
      // 切分出密文与 authTag（最后16字节为tag）
      const dataLen = ciphertextBuf.length - authTagLen;
      if (dataLen <= 0) return null;
      const data = ciphertextBuf.slice(0, dataLen);
      const authTag = ciphertextBuf.slice(dataLen);
      const aad = resource.associated_data ? Buffer.from(resource.associated_data, "utf8") : undefined;

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      if (aad) decipher.setAAD(aad);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      const txt = decrypted.toString("utf8");
      try {
        return JSON.parse(txt);
      } catch {
        return txt;
      }
    } catch (e) {
      this.logger.error(`解密微信通知失败: ${(e as Error)?.message}`);
      return null;
    }
  }
  // 其余接口（如查询、关闭、退款、回调验签等）建议统一通过 wechatpay-node-v3 提供的方法实现
  async refunds(args){
    const { appId, mchId, serialNo, notifyUrl, privateKeyPem, publicKeyPem, apiV3Key } = await this.getWechatPaySettings();

    const pay = new Pay({
      appid: appId,
      mchid: mchId,
      // 不显式传 serial_no，交由 SDK 从公钥证书自动推导，避免配置错误导致 SIGN_ERROR
      publicKey: publicKeyPem ? Buffer.from(publicKeyPem) : undefined,
      privateKey: Buffer.from(privateKeyPem),
      key: apiV3Key,
      userAgent: "tigshop-nest/1.0",
    } as any);
    return pay.refunds(args);
  }
}
