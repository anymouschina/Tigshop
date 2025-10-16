import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ImConfigService {
  constructor(private prisma: PrismaService) {}

  private normalize(raw: any) {
    const base = {
      activate: false,
      sendText: false,
      sendWechat: false,
      wechatImage: null as string | null,
      replyContent: "",
    };
    if (!raw || typeof raw !== "object") return base;
    return {
      activate: raw.activate === true,
      sendText: raw.sendText === true,
      sendWechat: raw.sendWechat === true,
      wechatImage: raw.wechatImage === "" ? null : (raw.wechatImage ?? null),
      replyContent:
        typeof raw.replyContent === "string" ? raw.replyContent : "",
    };
  }

  async getDetail(params: { code: string; shopId?: number }) {
    const { code, shopId = 0 } = params;
    if (!code) return null;
    const row = await this.prisma.im_config.findFirst({
      where: { code, shop_id: shopId },
      orderBy: { id: "desc" },
    });
    if (!row) return null;
    let parsed: any = row.data;
    try {
      parsed = row.data ? JSON.parse(row.data as any) : null;
    } catch (_) {
      // not JSON, keep as original string
    }
    const normalized = this.normalize(parsed);
    return {
      id: row.id,
      code: row.code,
      data: normalized,
      shopId: row.shop_id,
    } as any;
  }

  async save(params: { code: string; shopId?: number; data: any }) {
    const { code, shopId = 0, data } = params;
    if (!code) throw new Error("缺少 code");
    // 统一存 JSON 字符串
    let dataStr: string | null = null;
    if (data !== null && data !== undefined) {
      if (typeof data === "string") {
        // 如果传入已经是字符串，尝试解析验证是否为 JSON；失败则按原样存
        try {
          JSON.parse(data);
          dataStr = data;
        } catch {
          dataStr = JSON.stringify({ value: data });
        }
      } else {
        dataStr = JSON.stringify(data);
      }
    }
    // 查是否存在
    const exist = await this.prisma.im_config.findFirst({
      where: { code, shop_id: shopId },
      orderBy: { id: "desc" },
    });
    let row;
    if (exist) {
      row = await this.prisma.im_config.update({
        where: { id: exist.id },
        data: { data: dataStr as any },
      });
    } else {
      row = await this.prisma.im_config.create({
        data: { code, data: dataStr as any, shop_id: shopId },
      });
    }
    // 返回标准化后的数据
    let parsed: any = null;
    try {
      parsed = row.data ? JSON.parse(row.data as any) : null;
    } catch {
      parsed = row.data;
    }
    const normalized = this.normalize(parsed);
    return {
      id: row.id,
      code: row.code,
      data: normalized,
      shopId: row.shop_id,
    } as any;
  }
}
