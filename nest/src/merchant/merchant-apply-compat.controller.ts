import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApplyAuditDto, ApplyBatchDto, ApplyDelDto, ApplyListQueryDto } from "./dto/merchant-apply.dto";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 商户入驻申请(兼容)")
@Controller("adminapi/merchant/apply")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class MerchantApplyCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "商户入驻申请列表（兼容）" })
  @Authorities("merchantApplyList")
  async list(@Query() query: ApplyListQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const size = Math.min(Number(query.size) || 15, 100);
    const skip = (page - 1) * size;
    const where: any = {};
    // 状态筛选（1 待审核, 10 已通过, 20 已拒绝）
    if (query.status !== undefined) {
      const status = Number(query.status);
      if (!Number.isNaN(status)) where.status = status;
    }
    // 关键字（公司/法人/店铺名）
    if (query.keyword) {
      const kw = String(query.keyword);
      where.OR = [
        { company_name: { contains: kw } },
        { corporate_name: { contains: kw } },
        { shop_title: { contains: kw } },
      ];
    }
    // 用户名筛选 -> 先查 user
    let userIdIn: number[] | undefined;
    if (query.username) {
      const users = await this.prisma.user.findMany({
        where: { username: { contains: String(query.username) } },
        select: { user_id: true },
      });
      userIdIn = users.map((u) => u.user_id);
      if (userIdIn.length === 0) {
        return { code: 0, message: "success", data: { records: [], total: 0, size, current: page, pages: 0 } };
      }
      where.user_id = { in: userIdIn };
    }

    // 排序
    let orderBy: any = { merchant_apply_id: "desc" };
    if (query.sortField) {
      const field = String(query.sortField);
      const allowed = new Set(["add_time", "merchant_apply_id"]);
      if (allowed.has(field)) {
        orderBy = { [field]: String(query.sortOrder) === "ascend" ? "asc" : "desc" };
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.merchant_apply.findMany({ where, skip, take: size, orderBy }),
      this.prisma.merchant_apply.count({ where }),
    ]);

    // 组装 user 信息
    const uidSet = Array.from(new Set(records.map((r) => r.user_id).filter(Boolean))) as number[];
    const users = uidSet.length
      ? await this.prisma.user.findMany({ where: { user_id: { in: uidSet } }, select: { user_id: true, username: true } })
      : [];
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    const data = records.map((r) => this.transformApply(r, userMap.get(r.user_id || 0)));
    return { code: 0, message: "success", data: { records: data, total, size, current: page, pages: Math.ceil(total / size) } };
  }

  @Get("config")
  @ApiOperation({ summary: "商户入驻申请配置（兼容占位）" })
  @Authorities("merchantApplyConfig")
  async config() {
    // 前端直接 map 生成筛选 tabs，按 PHP 习惯：1=待审核 10=已通过 20=已拒绝
    const statusList = [
      { status: 1, statusText: "待审核" },
      { status: 10, statusText: "已通过" },
      { status: 20, statusText: "已拒绝" },
    ];
    return { code: 0, message: "success", data: statusList };
  }

  /** 详情 GET /adminapi/merchant/apply/:id */
  @Get(":id")
  @ApiOperation({ summary: "商户入驻申请详情" })
  @Authorities("merchantApplyDetail")
  async detail(@Param("id", ParseIntPipe) id: number) {
    const apply = await this.prisma.merchant_apply.findUnique({ where: { merchant_apply_id: id } });
    if (!apply) return { code: 404, message: "申请不存在", data: null };
    const user = apply.user_id
      ? await this.prisma.user.findUnique({ where: { user_id: apply.user_id }, select: { user_id: true, username: true } })
      : null;
    return { code: 0, message: "success", data: this.transformApply(apply, user || undefined) };
  }

  /** 删除（支持批量） POST /adminapi/merchant/apply/del body: { ids: number[] } */
  @Post("del")
  @ApiOperation({ summary: "删除商户入驻申请" })
  @Authorities("merchantApplyDelete")
  async del(@Body() body: ApplyDelDto) {
    const ids: number[] = Array.isArray(body?.ids)
      ? (body.ids as number[]).map((x: any) => Number(x)).filter((x: any) => x > 0)
      : body?.id
        ? [Number(body.id)]
        : [];
    if (!ids.length) return { code: 400, message: "缺少ID", data: false };
    await this.prisma.merchant_apply.deleteMany({ where: { merchant_apply_id: { in: ids } } });
    return { code: 0, message: "success", data: true };
  }

  /** 审核 POST /adminapi/merchant/apply/audit body: { id, status(1通过 2拒绝), remark? } */
  @Post("audit")
  @ApiOperation({ summary: "审核商户入驻申请" })
  @Authorities("merchantApplyAudit")
  async audit(@Body() body: ApplyAuditDto) {
    const id = Number(body.id);
    const status = Number(body.status); // 10 通过 20 拒绝（对齐前端）
    if (!id || ![10, 20].includes(status)) {
      return { code: 400, message: "参数错误", data: false };
    }
    const apply = await this.prisma.merchant_apply.findUnique({ where: { merchant_apply_id: id } });
    if (!apply) return { code: 404, message: "申请不存在", data: false };
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.merchant_apply.update({
      where: { merchant_apply_id: id },
      data: { status, audit_time: now, audit_remark: body.remark ?? "" },
    });

    // 通过则创建 merchant（若未创建过）
    if (status === 10) {
      const existing = await this.prisma.merchant.findFirst({ where: { merchant_apply_id: id } });
      if (!existing) {
        await this.prisma.merchant.create({
          data: {
            merchant_apply_id: id,
            user_id: apply.user_id ?? 0,
            add_time: now,
            base_data: apply.base_data,
            merchant_data: apply.merchant_data,
            shop_data: apply.shop_data,
            status: 1,
            type: (apply.type ?? 1) === 2,
            company_name: apply.company_name ?? "",
            corporate_name: apply.corporate_name ?? "",
          },
        });
      }
    }
    return { code: 0, message: "success", data: true };
  }

  /** 批量操作 POST /adminapi/merchant/apply/batch body: { type: 'delete'|'auditPass'|'auditReject', ids: number[] } */
  @Post("batch")
  @ApiOperation({ summary: "商户入驻申请批量操作" })
  @Authorities("merchantApplyBatch")
  async batch(@Body() body: ApplyBatchDto) {
    const type = body.type;
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map((x: any) => Number(x)).filter((x: any) => x > 0) : [];
    if (!type || !ids.length) return { code: 400, message: "缺少参数", data: false };
    if (type === "delete") {
      await this.prisma.merchant_apply.deleteMany({ where: { merchant_apply_id: { in: ids } } });
      return { code: 0, message: "success", data: true };
    }
    const now = Math.floor(Date.now() / 1000);
    if (type === "auditPass" || type === "auditReject") {
      const status = type === "auditPass" ? 10 : 20;
      const applies = await this.prisma.merchant_apply.findMany({ where: { merchant_apply_id: { in: ids } } });
      for (const apply of applies) {
        await this.prisma.merchant_apply.update({
          where: { merchant_apply_id: apply.merchant_apply_id },
          data: { status, audit_time: now },
        });
        if (status === 10) {
          const existing = await this.prisma.merchant.findFirst({ where: { merchant_apply_id: apply.merchant_apply_id } });
          if (!existing) {
            await this.prisma.merchant.create({
              data: {
                merchant_apply_id: apply.merchant_apply_id,
                user_id: apply.user_id ?? 0,
                add_time: now,
                base_data: apply.base_data,
                merchant_data: apply.merchant_data,
                shop_data: apply.shop_data,
                status: 1,
                type: (apply.type ?? 1) === 2,
                company_name: apply.company_name ?? "",
                corporate_name: apply.corporate_name ?? "",
              },
            });
          }
        }
      }
      return { code: 0, message: "success", data: true };
    }
    return { code: 400, message: "不支持的批量类型", data: false };
  }

  private transformApply(a: any, user?: { user_id: number; username: string }) {
    let baseData, merchantData, shopData;
    try { if (a.base_data) baseData = JSON.parse(a.base_data); } catch (e) {}
    try { if (a.merchant_data) merchantData = JSON.parse(a.merchant_data); } catch (e) {}
    try { if (a.shop_data) shopData = JSON.parse(a.shop_data); } catch (e) {}
    const statusTextMap: Record<number, string> = { 1: "待审核", 10: "已通过", 20: "已拒绝" };
    return {
      merchantApplyId: a.merchant_apply_id,
      userId: a.user_id,
      addTime: a.add_time,
      status: a.status ?? 0,
      statusText: statusTextMap[a.status ?? 0] || "-",
      type: a.type ?? 1,
      shopName: a.shop_title,
      companyName: a.company_name,
      corporateName: a.corporate_name,
      auditTime: a.audit_time,
      auditRemark: a.audit_remark,
      baseData,
      merchantData,
      shopData,
      user: user ? { userId: user.user_id, username: user.username } : undefined,
    };
  }
}
