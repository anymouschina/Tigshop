// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminCommentCompatService {
  constructor(private prisma: PrismaService) {}

  private serializeShowPics(input: any): string {
    if (input == null) return "";
    try {
      // If already stringified JSON or plain string, keep as-is
      if (typeof input === "string") {
        // Validate JSON string; if not JSON, still store the raw string
        try {
          const parsed = JSON.parse(input);
          if (Array.isArray(parsed) || typeof parsed === "object") return input;
        } catch (_) {
          // not JSON, return as raw string
        }
        return input;
      }
      // For array/object, stringify to JSON
      if (Array.isArray(input) || typeof input === "object") {
        return JSON.stringify(input);
      }
      return String(input ?? "");
    } catch (_) {
      return "";
    }
  }

  private parseShowPics(raw: any): any {
    if (raw == null || raw === "") return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return parsed;
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  async getFilterResult(filter: any) {
    const where: any = {};
    if (filter.keyword) {
      where.OR = [
        { username: { contains: filter.keyword } },
        { content: { contains: filter.keyword } },
      ];
    }
    if (filter.is_showed !== undefined && filter.is_showed !== -1) {
      where.is_showed = Number(filter.is_showed) || 0;
    }
    if (filter.shop_id) where.shop_id = Number(filter.shop_id);
    const page = Number(filter.page) || 1;
    const size = Number(filter.size) || 15;
    const skip = (page - 1) * size;
    const orderBy: any = {};
    const sortField = filter.sort_field || "comment_id";
    const sortOrder = filter.sort_order || "desc";
    orderBy[sortField] = sortOrder;
    const rows = await this.prisma.comment.findMany({ where, orderBy, skip, take: size });
    return rows.map((r) => this.mapRow(r));
  }

  async getFilterCount(filter: any) {
    const where: any = {};
    if (filter.keyword) {
      where.OR = [
        { username: { contains: filter.keyword } },
        { content: { contains: filter.keyword } },
      ];
    }
    if (filter.is_showed !== undefined && filter.is_showed !== -1) {
      where.is_showed = Number(filter.is_showed) || 0;
    }
    if (filter.shop_id) where.shop_id = Number(filter.shop_id);
    return this.prisma.comment.count({ where });
  }

  async getDetail(id: number) {
    const r = await this.prisma.comment.findUnique({ where: { comment_id: id } });
    if (!r) throw new NotFoundException("评论不存在");
    return this.mapRow(r);
  }

  async create(body: any) {
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      username: body.username || "",
      avatar: body.avatar || "",
      comment_rank: body.commentRank != null ? Number(body.commentRank) : 5,
      content: body.content || "",
      show_pics: this.serializeShowPics(body.showPics ?? body.show_pics),
      sort_order: body.sortOrder != null ? Number(body.sortOrder) : 50,
      is_recommend: body.isRecommend != null ? Number(body.isRecommend) : 0,
      is_top: body.isTop != null ? Number(body.isTop) : 0,
      is_showed: body.isShowed != null ? Number(body.isShowed) : 0,
      product_id: body.productId ? Number(body.productId) : 0,
      order_id: body.orderId ? Number(body.orderId) : 0,
      order_item_id: body.orderItemId ? Number(body.orderItemId) : 0,
      add_time: body.addTime ? Number(body.addTime) : now,
      shop_id: body.shopId ? Number(body.shopId) : 0,
    };
    const created = await this.prisma.comment.create({ data });
    return { commentId: created.comment_id };
  }

  async update(id: number, body: any) {
    const exists = await this.prisma.comment.findUnique({ where: { comment_id: id } });
    if (!exists) throw new NotFoundException("评论不存在");
    const data: any = {};
    if (body.username !== undefined) data.username = String(body.username || "");
    if (body.avatar !== undefined) data.avatar = String(body.avatar || "");
    if (body.commentRank !== undefined) data.comment_rank = Number(body.commentRank);
    if (body.content !== undefined) data.content = String(body.content || "");
    if (body.showPics !== undefined || body.show_pics !== undefined)
      data.show_pics = this.serializeShowPics(body.showPics ?? body.show_pics);
    if (body.sortOrder !== undefined) data.sort_order = Number(body.sortOrder);
    if (body.isRecommend !== undefined) data.is_recommend = Number(body.isRecommend);
    if (body.isTop !== undefined) data.is_top = Number(body.isTop);
    if (body.isShowed !== undefined) data.is_showed = Number(body.isShowed);
    if (body.productId !== undefined) data.product_id = Number(body.productId);
    if (body.orderId !== undefined) data.order_id = Number(body.orderId);
    if (body.orderItemId !== undefined) data.order_item_id = Number(body.orderItemId);
    await this.prisma.comment.update({ where: { comment_id: id }, data });
    return true;
  }

  async updateField(id: number, field: string, val: any) {
    const whitelist = ["is_recommend", "sort_order", "is_top", "comment_rank", "is_showed"];
    if (!whitelist.includes(field)) throw new BadRequestException("#field 错误");
    const data: any = {};
    data[field] = Number(val);
    await this.prisma.comment.update({ where: { comment_id: id }, data });
    return true;
  }

  async delete(id: number) {
    await this.prisma.comment.delete({ where: { comment_id: id } });
    return true;
  }

  async batchDelete(ids: number[]) {
    await this.prisma.comment.deleteMany({ where: { comment_id: { in: ids } } });
    return true;
  }

  async replyComment(body: any) {
    const commentId = Number(body.comment_id || body.commentId);
    const content = String(body.content || "");
    const parent = await this.prisma.comment.findUnique({ where: { comment_id: commentId } });
    if (!parent) throw new NotFoundException("原评论不存在");
    const now = Math.floor(Date.now() / 1000);
    const reply = await this.prisma.comment.create({
      data: {
        username: "管理员",
        avatar: "",
        product_id: parent.product_id,
        order_id: parent.order_id,
        order_item_id: parent.order_item_id,
        user_id: 0,
        comment_rank: 5,
        content,
        show_pics: "",
        parent_id: commentId,
        add_time: now,
        status: 1,
        shop_id: parent.shop_id,
      },
    });
    return { commentId: reply.comment_id };
  }

  private mapRow(r: any) {
    return {
      // camelCase
      commentId: r.comment_id,
      userId: r.user_id,
      username: r.username,
      avatar: r.avatar,
      productId: r.product_id,
      orderId: r.order_id,
      orderItemId: r.order_item_id,
      commentRank: r.comment_rank,
      content: r.content,
      showPics: this.parseShowPics(r.show_pics),
      isRecommend: r.is_recommend ?? 0,
      isTop: r.is_top ?? 0,
      isShowed: r.is_showed ?? 0,
      sortOrder: r.sort_order,
      addTime: r.add_time,
      shopId: r.shop_id,
      // original snake_case for legacy bindings if any UI expects them
      comment_id: r.comment_id,
      user_id: r.user_id,
      product_id: r.product_id,
      order_id: r.order_id,
      order_item_id: r.order_item_id,
      comment_rank: r.comment_rank,
      show_pics: r.show_pics,
      is_recommend: r.is_recommend ?? 0,
      is_top: r.is_top ?? 0,
      is_showed: r.is_showed ?? 0,
      sort_order: r.sort_order,
      add_time: r.add_time,
      shop_id: r.shop_id,
    };
  }
}
