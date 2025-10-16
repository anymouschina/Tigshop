// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShopTableDto, UpdateShopTableDto } from "./dto/shop-table.dto";

@Injectable()
export class ShopTableService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueKey(shopId: number): Promise<string> {
    // 组合: ST + shopId(base36) + 6 随机（大写） => 保障全局唯一（循环检测冲突）
    for (let i = 0; i < 8; i++) {
      const rand = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
      const key = "ST" + shopId.toString(36).toUpperCase() + rand;
      const exists = await this.prisma.shop_table.findFirst({
        where: { qr_code_key: key },
      });
      if (!exists) return key;
    }
    throw new Error("生成二维码Key失败，请重试");
  }

  async create(dto: CreateShopTableDto) {
    const exists = await this.prisma.shop_table.findFirst({
      where: { shop_id: dto.shopId, table_no: dto.tableNo },
    });
    if (exists) throw new BadRequestException("桌号已存在");
    const now = Math.floor(Date.now() / 1000);
    const qrKey =
      dto.qrCodeKey?.trim() || (await this.generateUniqueKey(dto.shopId));
    return this.prisma.shop_table.create({
      data: {
        shop_id: dto.shopId,
        table_no: dto.tableNo,
        qr_code_key: qrKey,
        capacity: dto.capacity || null,
        area: dto.area || null,
        add_time: now,
        update_time: now,
      },
    });
  }

  async list(shopId: number) {
    return this.prisma.shop_table.findMany({
      where: { shop_id: shopId },
      orderBy: { sort: "asc" },
    });
  }

  async update(id: number, dto: UpdateShopTableDto) {
    const row = await this.prisma.shop_table.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("桌位不存在");
    const dup = await this.prisma.shop_table.findFirst({
      where: { shop_id: dto.shopId, table_no: dto.tableNo, NOT: { id } },
    });
    if (dup) throw new BadRequestException("桌号重复");
    const now = Math.floor(Date.now() / 1000);
    let qrKey: string | null = row.qr_code_key;
    if (dto.qrCodeKey !== undefined) {
      if (!dto.qrCodeKey || dto.qrCodeKey === "generate") {
        qrKey = await this.generateUniqueKey(dto.shopId);
      } else {
        // 用户手动输入，校验唯一
        const same = await this.prisma.shop_table.findFirst({
          where: { qr_code_key: dto.qrCodeKey, NOT: { id } },
        });
        if (same) throw new BadRequestException("二维码Key已存在");
        qrKey = dto.qrCodeKey;
      }
    }
    return this.prisma.shop_table.update({
      where: { id },
      data: {
        shop_id: dto.shopId,
        table_no: dto.tableNo,
        qr_code_key: qrKey,
        capacity: dto.capacity || null,
        area: dto.area || null,
        update_time: now,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.shop_table.delete({ where: { id } });
    return { id };
  }

  async findByQr(code: string) {
    return this.prisma.shop_table.findFirst({ where: { qr_code_key: code } });
  }

  async detail(id: number) {
    const row = await this.prisma.shop_table.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("桌位不存在");
    return row;
  }
}
