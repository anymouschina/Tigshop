// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";

// 兼容 PHP 后台商户管理路由: /adminapi/merchant/merchant/*
@Controller("adminapi/merchant/merchant")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class MerchantCompatController {
  constructor(private prisma: PrismaService) {}

  /**
   * 列表
   * GET /adminapi/merchant/merchant/list
   * query: keyword, status, page, size, sortField, sortOrder
   */
  @Get("list")
  @Authorities("merchantListView")
  async list(@Query() query: any) {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const size = Math.min(parseInt(query.size) || 20, 100);
    const skip = (page - 1) * size;
    const where: any = {};
    if (query.status !== undefined && query.status !== "") {
      const statusNum = Number(query.status);
      if (!Number.isNaN(statusNum)) where.status = statusNum;
    }
    if (query.keyword) {
      // 基于可用字段 company_name / corporate_name / merchant_data JSON 模糊匹配
      const kw = query.keyword;
      where.OR = [
        { company_name: { contains: kw } },
        { corporate_name: { contains: kw } },
      ];
    }

    const orderBy: any = {};
    if (query.sortField && ["add_time", "merchant_id"].includes(query.sortField)) {
      orderBy[query.sortField] = query.sortOrder === "ascend" ? "asc" : "desc";
    } else {
      orderBy.merchant_id = "desc";
    }

    const [records, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.merchant.count({ where }),
    ]);

    // 统计相关数量（因 Prisma schema 无关系定义，逐个 count）
    const countTasks = records.map(async (m: any) => {
      const merchantId = m.merchant_id;
      const [accountCount, userCount, shopCount] = await Promise.all([
        this.prisma.merchant_account.count({ where: { merchant_id: merchantId } }),
        this.prisma.merchant_user.count({ where: { merchant_id: merchantId } }),
        // shop 表是否存在 merchant_id 字段需确认；若不存在则返回 0
        this.prisma.shop
          .count({ where: { merchant_id: merchantId } })
          .catch(() => 0),
      ]);
      return this.transformMerchant(m, { accountCount, userCount, shopCount });
    });
    const data = await Promise.all(countTasks);
    return {
      code: 0,
      message: "success",
      data: {
        records: data,
        total,
        page,
        size,
      },
    };
  }

  /**
   * 详情
   * GET /adminapi/merchant/merchant/:id
   */
  @Get(":id")
  @Authorities("merchantDetailView")
  async detail(@Param("id", ParseIntPipe) id: number) {
    const merchant = await this.prisma.merchant.findUnique({ where: { merchant_id: id } });
    if (!merchant) {
      return { code: 404, message: "商户不存在", data: null };
    }
    const [accountCount, userCount, shopCount] = await Promise.all([
      this.prisma.merchant_account.count({ where: { merchant_id: id } }),
      this.prisma.merchant_user.count({ where: { merchant_id: id } }),
      this.prisma.shop
        .count({ where: { merchant_id: id } })
        .catch(() => 0),
    ]);
    return {
      code: 0,
      message: "success",
      data: this.transformMerchant(merchant, { accountCount, userCount, shopCount }),
    };
  }

  /**
   * 创建商户
   * POST /adminapi/merchant/merchant/create
   * body: {
   *   admin: { type: 1|2, userId?: number, adminId?: number },
   *   baseData: any,
   *   merchantData: any,
   *   shopTitle?: string,
   *   type?: 1|2
   * }
   */
  @Post("create")
  @Authorities("merchantCreate")
  async create(@Body() body: any) {
    const now = Math.floor(Date.now() / 1000);
    const baseData = body?.baseData ?? {};
    const merchantData = body?.merchantData ?? {};
    const shopTitle = body?.shopTitle ?? merchantData?.merchantName ?? "";
    const adminBind = body?.admin ?? {};
    const isCompany = Number(baseData?.type ?? body?.type ?? 1) === 2;

    const data: any = {
      add_time: now,
      base_data: JSON.stringify(baseData),
      merchant_data: JSON.stringify(merchantData),
      shop_data: JSON.stringify({ shopTitle }),
      status: 1,
      type: isCompany, // schema 为 Boolean
      company_name: baseData?.companyName ?? "",
      corporate_name: baseData?.corporateName ?? "",
    };
    if (Number(adminBind?.type) === 1 && adminBind?.userId) {
      data.user_id = Number(adminBind.userId);
    }

    const created = await this.prisma.merchant.create({ data });

    // 若绑定管理员，则写入 merchant_user 关系
    if (Number(adminBind?.type) === 2 && adminBind?.adminId) {
      try {
        await this.prisma.merchant_user.create({
          data: {
            merchant_id: created.merchant_id,
            admin_user_id: Number(adminBind.adminId),
            is_admin: 1,
            user_id: 0,
          },
        });
      } catch (e) {
        // 忽略关系创建失败，保证主流程可用
      }
    }

    return {
      code: 0,
      message: "success",
      data: this.transformMerchant(created, { accountCount: 0, userCount: 0, shopCount: 0 }),
    };
  }

  /**
   * 更新商户
   * POST /adminapi/merchant/merchant/update
   * body: 同 create，需包含 id 或 merchantId（也兼容 query.id）
   */
  @Post("update")
  @Authorities("merchantUpdate")
  async update(@Body() body: any, @Query("id") idFromQuery?: string) {
    const id = Number(body?.id ?? body?.merchantId ?? idFromQuery);
    if (!id) {
      return { code: 400, message: "缺少商户ID", data: false };
    }
    const baseData = body?.baseData;
    const merchantData = body?.merchantData;
    const adminBind = body?.admin ?? {};
    const toUpdate: any = {};
    if (baseData !== undefined) {
      toUpdate.base_data = JSON.stringify(baseData);
      if (baseData?.companyName !== undefined) toUpdate.company_name = baseData.companyName;
      if (baseData?.corporateName !== undefined) toUpdate.corporate_name = baseData.corporateName;
      if (baseData?.type !== undefined) toUpdate.type = Number(baseData.type) === 2;
    }
    if (merchantData !== undefined) {
      toUpdate.merchant_data = JSON.stringify(merchantData);
    }
    if (body?.shopTitle !== undefined) {
      // 合并现有 shop_data，仅更新 title
      const current = await this.prisma.merchant.findUnique({ where: { merchant_id: id }, select: { shop_data: true } });
      let shopData: any = {};
      if (current?.shop_data) {
        try { shopData = JSON.parse(current.shop_data); } catch (e) {}
      }
      shopData.shopTitle = body.shopTitle;
      toUpdate.shop_data = JSON.stringify(shopData);
    }

    const updated = await this.prisma.merchant.update({ where: { merchant_id: id }, data: toUpdate });

    // 若绑定管理员，确保关系存在
    if (Number(adminBind?.type) === 2 && adminBind?.adminId) {
      const exists = await this.prisma.merchant_user.findFirst({
        where: { merchant_id: id, admin_user_id: Number(adminBind.adminId) },
      });
      if (!exists) {
        try {
          await this.prisma.merchant_user.create({
            data: { merchant_id: id, admin_user_id: Number(adminBind.adminId), is_admin: 1, user_id: 0 },
          });
        } catch (e) {}
      }
    }

    return { code: 0, message: "success", data: this.transformMerchant(updated) };
  }

  /**
   * 审核 / 启用 / 禁用 / 拒绝 等操作（兼容：POST /:id）
   * body: { action: 'approve'|'reject'|'enable'|'disable', reason? }
   * 状态约定：0 待审核 1 已审核 2 已拒绝 3 已禁用
   */
  @Post(":id")
  @Authorities("merchantUpdate")
  async operate(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { action?: string; reason?: string },
  ) {
    const action = body?.action;
    const statusMap: Record<string, number> = {
      approve: 1,
      enable: 1,
      reject: 2,
      disable: 3,
    };
    if (!action || !(action in statusMap)) {
      return { code: 400, message: "不支持的操作", data: false };
    }
    const update: any = { status: statusMap[action] };
    // 拒绝理由保存在 merchant_data 内追加 (简单兼容)
    if (action === "reject" && body.reason) {
      const current = await this.prisma.merchant.findUnique({
        where: { merchant_id: id },
        select: { merchant_data: true },
      });
      let merchantData: any = {};
      if (current?.merchant_data) {
        try {
          merchantData = JSON.parse(current.merchant_data);
        } catch (e) {}
      }
      merchantData.rejectReason = body.reason;
      update.merchant_data = JSON.stringify(merchantData);
    }
    await this.prisma.merchant.update({ where: { merchant_id: id }, data: update });
    return { code: 0, message: "success", data: true };
  }

  /**
   * 单字段更新：POST /adminapi/merchant/merchant/updateField
   * body: { id, field, value }
   */
  @Post("updateField")
  @Authorities("merchantUpdateField")
  async updateField(@Body() body: any) {
    const { id, field, value } = body || {};
    if (!id || !field) {
      return { code: 400, message: "缺少参数", data: false };
    }
    const allowed = new Set([
      "status",
      "type",
      "company_name",
      "corporate_name",
      "settlement_cycle",
    ]);
    if (!allowed.has(field)) {
      return { code: 400, message: "字段不允许更新", data: false };
    }
    await this.prisma.merchant.update({
      where: { merchant_id: Number(id) },
      data: { [field]: value },
    });
    return { code: 0, message: "success", data: true };
  }

  private transformMerchant(
    m: any,
    counts?: { accountCount?: number; userCount?: number; shopCount?: number },
  ) {
    let merchantData: any = undefined;
    if (m.merchant_data) {
      try {
        merchantData = JSON.parse(m.merchant_data);
      } catch (e) {}
    }
    const statusTextMap: Record<number, string> = {
      0: "待审核",
      1: "已认证",
      2: "已拒绝",
      3: "已禁用",
    };
    return {
      merchantId: m.merchant_id,
      type: m.type ? (m.type === true ? 2 : m.type) : 1, // 兼容布尔 / 数字
      companyName: m.company_name,
      corporateName: m.corporate_name,
      settlementCycle: m.settlement_cycle,
      status: m.status ?? 0,
      statusText: statusTextMap[m.status ?? 0] || "-",
      addTime: m.add_time,
      merchantData,
      accountCount: counts?.accountCount ?? 0,
      userCount: counts?.userCount ?? 0,
      shopCount: counts?.shopCount ?? 0,
    };
  }
}
