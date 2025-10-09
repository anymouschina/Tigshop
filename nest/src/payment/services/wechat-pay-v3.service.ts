// @ts-nocheck
import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
// wechatpay-node-v3 使用 CommonJS 导出（export = Pay），需用 require 方式导入
import Pay = require("wechatpay-node-v3");
import { ConfigService as SettingConfigService } from "src/setting/config.service";

type WechatPaySettings = {
  appId?: string; // 公众号/小程序 appid（JSAPI 需要）
  mchId?: string; // 商户号 mchid
  mchid?: string; // 兼容字段
  mch_id?: string; // 兼容字段
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

  constructor(private readonly settingConfig: SettingConfigService) {}

  private async getWechatPaySettings(): Promise<
    Required<Pick<WechatPaySettings, "appId" | "mchId">> & {
      serialNo?: string;
      privateKeyPem: string;
      publicKeyPem: string;
      apiBase: string;
      notifyUrl?: string;
      apiV3Key?: string;
    }
  > {
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

    return { appId, mchId, serialNo, notifyUrl, privateKeyPem, publicKeyPem, apiBase, apiV3Key } as any;
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
    total: number; // 元
    payerOpenId: string;
  }): Promise<{ prepay_id: string }>
  {
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

    const body: any = {
      appid: appId,
      mchid: mchId,
      description: params.description || "订单支付",
      out_trade_no: params.outTradeNo,
      notify_url: notifyUrl,
      amount: { total: Math.round(Number(params.total || 0) * 100) },
      payer: { openid: params.payerOpenId },
    };

    if (!body.notify_url) {
      this.logger.error("notify_url 未配置或无效：请在 wechatPaySettings.notifyUrl 填写以 https 开头的完整地址，或在 apiSettings.wechatServerUrl 填写域名以便自动推导。");
      throw new HttpException(
        "微信统一下单失败：缺少 notify_url。请配置 wechatPaySettings.notifyUrl= https://你的域名/api/order/pay/notify",
        HttpStatus.BAD_REQUEST,
      );
    }

    const debugBody = { ...body, payer: { openid: (params.payerOpenId || "").slice(0, 6) + "***" } };
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
