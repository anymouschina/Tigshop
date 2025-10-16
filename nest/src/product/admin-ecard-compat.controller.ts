import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PanelService } from "src/panel/panel.service";

// 兼容 Admin 路由：/adminapi/product/eCard/*
@Controller("adminapi/product/eCard")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminECardCompatController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly panel: PanelService,
  ) {}

  // 列表：支持 groupId、keyword、page/size
  @Get("list")
  @Authorities("product.ecard.list")
  async list(@Query() query: any, @Request() req: any) {
    const page = Number(query.page || 1);
    const size = Number(query.size || 10);
    const skip = (page - 1) * size;

    // 店铺隔离：通过 group->shop 关联实现
    const groupId = Number(query.groupId || query.group_id || 0);
    const where: any = {};
    if (groupId) where.group_id = groupId;
    if (query.keyword) {
      const kw = String(query.keyword);
      where.OR = [
        { card_number: { contains: kw } },
        { card_pwd: { contains: kw } },
      ];
    }

    // 为了店铺隔离需要校验 groupId 是否属于当前店铺；
    if (groupId) {
      const shopId = await this.panel.getUserShopId(req.user?.userId);
      if (shopId > 0) {
        const group = await this.prisma.e_card_group.findFirst({
          where: { group_id: groupId, shop_id: shopId },
          select: { group_id: true },
        });
        if (!group) {
          return {
            code: 0,
            message: "success",
            data: { records: [], total: 0 },
          };
        }
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.e_card.findMany({
        where,
        orderBy: { card_id: "desc" },
        skip,
        take: size,
      }),
      this.prisma.e_card.count({ where }),
    ]);

    // 前端表格字段映射
    const mapped = records.map((r) => ({
      cardId: r.card_id,
      groupId: r.group_id,
      cardNumber: r.card_number,
      cardPwd: r.card_pwd,
      isUse: r.is_use,
      addTime: r.add_time,
      upTime: r.up_time,
    }));

    return { code: 0, message: "success", data: { records: mapped, total } };
  }

  // 详情
  @Get("detail")
  @Authorities("product.ecard.detail")
  async detail(@Query("id") id: string, @Request() req: any) {
    const cardId = Number(id);
    if (!cardId) return { code: 400, message: "id required", data: null };
    const card = await this.prisma.e_card.findUnique({
      where: { card_id: cardId },
    });
    if (!card) return { code: 404, message: "not found", data: null };

    // 店铺隔离：检查卡片所属分组是否属于当前店铺
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    if (shopId > 0) {
      const group = await this.prisma.e_card_group.findFirst({
        where: { group_id: card.group_id, shop_id: shopId },
        select: { group_id: true },
      });
      if (!group) return { code: 404, message: "not found", data: null };
    }

    const mapped = {
      cardId: card.card_id,
      groupId: card.group_id,
      cardNumber: card.card_number,
      cardPwd: card.card_pwd,
      isUse: card.is_use,
      addTime: card.add_time,
      upTime: card.up_time,
    };
    return { code: 0, message: "success", data: mapped };
  }

  // 新增/编辑（兼容：根据 act=create/update/detail）
  @Post("create")
  @Authorities("product.ecard.create")
  async create(@Body() body: any, @Request() req: any) {
    const groupId = Number(body.groupId || body.group_id);
    const cardNumber = String(body.cardNumber || body.card_number || "");
    const cardPwd = String(body.cardPwd || body.card_pwd || "");
    if (!groupId) return { code: 400, message: "groupId required", data: null };

    // 店铺隔离：确认 group 属于当前店铺
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    if (shopId > 0) {
      const group = await this.prisma.e_card_group.findFirst({
        where: { group_id: groupId, shop_id: shopId },
        select: { group_id: true },
      });
      if (!group) return { code: 404, message: "group not found", data: null };
    }

    const now = Math.floor(Date.now() / 1000);
    const created = await this.prisma.e_card.create({
      data: {
        group_id: groupId,
        card_number: cardNumber,
        card_pwd: cardPwd,
        is_use: Boolean(body.isUse ?? body.is_use ?? false),
        add_time: now,
      },
    });
    return { code: 0, message: "success", data: { cardId: created.card_id } };
  }

  @Post("update")
  @Authorities("product.ecard.update")
  async update(@Body() body: any, @Request() req: any) {
    const id = Number(body.id || body.cardId || body.card_id);
    if (!id) return { code: 400, message: "id required", data: null };

    const exists = await this.prisma.e_card.findUnique({
      where: { card_id: id },
    });
    if (!exists) return { code: 404, message: "not found", data: null };

    // 店铺隔离
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    if (shopId > 0) {
      const group = await this.prisma.e_card_group.findFirst({
        where: { group_id: exists.group_id, shop_id: shopId },
        select: { group_id: true },
      });
      if (!group) return { code: 404, message: "not found", data: null };
    }

    const data: any = {
      card_number: body.cardNumber ?? body.card_number,
      card_pwd: body.cardPwd ?? body.card_pwd,
      is_use:
        typeof body.isUse !== "undefined" || typeof body.is_use !== "undefined"
          ? Boolean(body.isUse ?? body.is_use)
          : undefined,
      up_time: Math.floor(Date.now() / 1000),
    };
    const updated = await this.prisma.e_card.update({
      where: { card_id: id },
      data,
    });
    return { code: 0, message: "success", data: { cardId: updated.card_id } };
  }

  @Post("del")
  @Authorities("product.ecard.delete")
  async del(@Body("id") id: number, @Request() req: any) {
    const cardId = Number(id);
    if (!cardId) return { code: 400, message: "id required", data: null };

    // 店铺隔离
    const card = await this.prisma.e_card.findUnique({
      where: { card_id: cardId },
    });
    if (!card) return { code: 404, message: "not found", data: null };
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    if (shopId > 0) {
      const group = await this.prisma.e_card_group.findFirst({
        where: { group_id: card.group_id, shop_id: shopId },
        select: { group_id: true },
      });
      if (!group) return { code: 404, message: "not found", data: null };
    }

    await this.prisma.e_card.delete({ where: { card_id: cardId } });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @Authorities("product.ecard.update")
  async updateField(@Body() body: any, @Request() req: any) {
    const id = Number(body.id || body.cardId || body.card_id);
    const field = String(body.field || "");
    const val = body.val ?? body.value;
    if (!id) return { code: 400, message: "id required", data: null };

    const map: Record<string, string> = {
      is_use: "is_use",
      isUse: "is_use",
      card_number: "card_number",
      cardNumber: "card_number",
      card_pwd: "card_pwd",
      cardPwd: "card_pwd",
    };
    const dbField = map[field];
    if (!dbField)
      return { code: 400, message: "unsupported field", data: null };

    const card = await this.prisma.e_card.findUnique({
      where: { card_id: id },
    });
    if (!card) return { code: 404, message: "not found", data: null };
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    if (shopId > 0) {
      const group = await this.prisma.e_card_group.findFirst({
        where: { group_id: card.group_id, shop_id: shopId },
        select: { group_id: true },
      });
      if (!group) return { code: 404, message: "not found", data: null };
    }

    let normalized = val;
    if (dbField === "is_use") {
      const v = String(val).toLowerCase();
      normalized =
        v === "1" ||
        v === "true" ||
        v === "yes" ||
        v === "on" ||
        val === 1 ||
        val === true;
    }

    await this.prisma.e_card.update({
      where: { card_id: id },
      data: { [dbField]: normalized, up_time: Math.floor(Date.now() / 1000) },
    });
    return { code: 0, message: "success", data: true };
  }
}
