// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export interface TranslationItemDTO {
  id?: number;
  localeId: number;
  translationName?: string;
  translationKey?: string;
  translationValue: string;
  dataType: number;
  dataId: number;
}

export interface TranslationDetailDTO {
  id?: number;
  translationName?: string;
  translationKey?: string;
  dataType?: number;
  dataId?: number;
  items: TranslationItemDTO[];
}

@Injectable()
export class TranslationsService {
  constructor(private prisma: PrismaService) {}

  // 业务创建/查看：根据 dataType + dataId 获取明细
  async getBusinessTranslations(
    dataType: number,
    dataId: number,
    translationName?: string,
  ): Promise<TranslationDetailDTO> {
    if (!dataType || !dataId) {
      return { items: [] };
    }

    const rows = await this.prisma.translations_data.findMany({
      where: { data_type: dataType, data_id: dataId },
      orderBy: { id: "asc" },
    });

    const first = rows[0];
    return {
      id: undefined,
      translationName: translationName ?? first?.translation_name ?? "",
      translationKey: first?.translation_key ?? "",
      dataType,
      dataId,
      items: rows.map((r) => ({
        id: r.id,
        localeId: r.locale_id ?? 0,
        translationName: r.translation_name ?? undefined,
        translationKey: r.translation_key ?? undefined,
        translationValue: r.translation_value ?? "",
        dataType: r.data_type ?? 0,
        dataId: r.data_id ?? 0,
      })),
    };
  }

  // 详情：优先按 translations.id 查询，否则回退按 data_id 查询
  async getDetail(id: number): Promise<TranslationDetailDTO> {
    if (!id) return { items: [] };

    const base = await this.prisma.translations.findUnique({ where: { id } });
    if (base) {
      const items = await this.prisma.translations_data.findMany({
        where: { data_id: id },
        orderBy: { id: "asc" },
      });
      return {
        id: base.id,
        translationName: base.translation_name ?? "",
        translationKey: base.translation_key ?? "",
        dataType: base.data_type ?? 0,
        dataId: base.id,
        items: items.map((r) => ({
          id: r.id,
          localeId: r.locale_id ?? 0,
          translationName: r.translation_name ?? undefined,
          translationKey: r.translation_key ?? undefined,
          translationValue: r.translation_value ?? "",
          dataType: r.data_type ?? 0,
          dataId: r.data_id ?? 0,
        })),
      };
    }

    // 回退：把 id 当作业务 dataId 使用
    const items = await this.prisma.translations_data.findMany({
      where: { data_id: id },
      orderBy: { id: "asc" },
    });
    const first = items[0];
    return {
      id: id,
      translationName: first?.translation_name ?? "",
      translationKey: first?.translation_key ?? "",
      dataType: first?.data_type ?? 0,
      dataId: id,
      items: items.map((r) => ({
        id: r.id,
        localeId: r.locale_id ?? 0,
        translationName: r.translation_name ?? undefined,
        translationKey: r.translation_key ?? undefined,
        translationValue: r.translation_value ?? "",
        dataType: r.data_type ?? 0,
        dataId: r.data_id ?? 0,
      })),
    };
  }

  // 保存/更新业务翻译：简单策略——删除同 dataType+dataId 的旧记录后重建
  async createOrUpdateBusinessTranslations(payload: {
    translationName?: string;
    translationKey?: string;
    dataType: number;
    dataId: number;
    items: { localeId: number; translationValue: string }[];
  }) {
    const { translationName, translationKey, dataType, dataId, items } =
      payload;

    // 清理旧数据
    await this.prisma.translations_data.deleteMany({
      where: { data_type: dataType, data_id: dataId },
    });

    if (!items || items.length === 0) return true;

    // 批量写入
    await this.prisma.translations_data.createMany({
      data: items.map((it) => ({
        locale_id: it.localeId,
        translation_name: translationName ?? "",
        translation_key: translationKey ?? "",
        translation_value: it.translationValue ?? "",
        data_type: dataType,
        data_id: dataId,
      })),
    });

    return true;
  }

  // 列表查询：支持按 dataType、localeIds 过滤，分页返回
  async getList(filter: {
    page: number;
    size: number;
    dataType?: number;
    localeIds?: number[];
  }): Promise<{
    records: any[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const size = Math.max(1, Number(filter.size) || 15);

    const whereData: any = {};
    if (filter.dataType !== undefined) {
      whereData.data_type = filter.dataType;
    }
    if (filter.localeIds && filter.localeIds.length) {
      whereData.locale_id = { in: filter.localeIds };
    }

    const [total, rows] = await Promise.all([
      this.prisma.translations_data.count({ where: whereData }),
      this.prisma.translations_data.findMany({
        where: whereData,
        orderBy: { id: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    // 可选：附带 locales 信息
    // 这里轻量查询 locales 基础字段
    const localeIds = Array.from(
      new Set(rows.map((r) => r.locale_id).filter(Boolean)),
    ) as number[];
    const localesMap: Record<number, any> = {};
    if (localeIds.length) {
      const locales = await this.prisma.locales.findMany({
        where: { id: { in: localeIds } },
        select: { id: true, locale_code: true, language: true },
      });
      for (const l of locales) localesMap[l.id] = l;
    }

    const records = rows.map((r) => ({
      id: r.id,
      localeId: r.locale_id,
      locale: r.locale_id ? localesMap[r.locale_id as number] : undefined,
      translationName: r.translation_name,
      translationKey: r.translation_key,
      translationValue: r.translation_value,
      dataType: r.data_type,
      dataId: r.data_id,
    }));

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size) || 1,
    };
  }
}
