// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class SignInService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.signInSetting.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.signInSetting.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          name: {
            contains: filter.keyword,
          },
        },
      ];
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      return {
        [filter.sort_field]: filter.sort_order,
      };
    }
    return {
      id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.signInSetting.findUnique({
      where: { id },
    });

    if (!result) {
      throw new Error("签到设置不存在");
    }

    return result;
  }

  async getName(id: number): Promise<string | null> {
    const result = await this.prisma.signInSetting.findUnique({
      where: { id },
      select: { name: true },
    });

    return result?.name || null;
  }

  async create(data: any): Promise<any> {
    // 验证积分必须大于0
    if (data.points <= 0) {
      throw new Error("赠送积分必须大于0");
    }

    // 验证天数必须大于0
    if (data.day_num <= 0) {
      throw new Error("天数必须大于0");
    }

    const result = await this.prisma.signInSetting.create({
      data: {
        name: data.name,
        points: data.points,
        day_num: data.day_num,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const signInSetting = await this.prisma.signInSetting.findUnique({
      where: { id },
    });

    if (!signInSetting) {
      throw new Error("签到设置不存在");
    }

    // 验证积分必须大于0
    if (data.points !== undefined && data.points <= 0) {
      throw new Error("赠送积分必须大于0");
    }

    // 验证天数必须大于0
    if (data.day_num !== undefined && data.day_num <= 0) {
      throw new Error("天数必须大于0");
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.day_num !== undefined) updateData.day_num = data.day_num;

    const result = await this.prisma.signInSetting.update({
      where: { id },
      data: updateData,
    });

    return result;
  }

  async delete(id: number): Promise<boolean> {
    const signInSetting = await this.prisma.signInSetting.findUnique({
      where: { id },
    });

    if (!signInSetting) {
      throw new Error("签到设置不存在");
    }

    const result = await this.prisma.signInSetting.delete({
      where: { id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.signInSetting.deleteMany({
      where: { id: { in: ids } },
    });

    return true;
  }

  // 用户签到相关方法
  async getSignSettingList(): Promise<any[]> {
    const result = await this.prisma.signInSetting.findMany({
      orderBy: {
        day_num: "asc",
      },
    });

    return result;
  }

  async getSignCount(userId: number): Promise<number> {
    const signRecord = await this.prisma.sign.findFirst({
      where: { user_id: userId },
      orderBy: {
        add_time: "desc",
      },
    });

    return signRecord?.sign_num || 0;
  }

  async checkUserSignIn(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = Math.floor(today.getTime() / 1000);
    const todayEnd = todayStart + 86400;

    const existingSign = await this.prisma.sign.findFirst({
      where: {
        user_id: userId,
        add_time: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    return !!existingSign;
  }

  async getSignPoints(
    settings: any[],
    count: number,
    userSign: number,
  ): Promise<number> {
    if (settings.length === 0) {
      return 0;
    }

    // 如果已经签到7天以上，循环使用第7天的设置
    const dayNum = count > 7 ? 7 : count;
    const setting = settings.find((s) => s.day_num === dayNum);

    return setting?.points || 0;
  }

  async addSignIn(userId: number, signNum: number): Promise<any> {
    const now = Math.floor(Date.now() / 1000);

    const result = await this.prisma.sign.create({
      data: {
        user_id: userId,
        add_time: now,
        sign_num: signNum,
      },
    });

    return result;
  }

  // 获取用户签到主页数据
  async getUserSignData(userId: number): Promise<any> {
    const settings = await this.getSignSettingList();
    const record = await this.getSignCount(userId);
    const isSign = await this.checkUserSignIn(userId);
    const signPoints = await this.getSignPoints(settings, record + 1, record);

    // 获取推荐商品（这里返回空数组，实际项目中可以根据需求推荐商品）
    const recommendGoods = [];

    return {
      days: settings,
      record,
      is_sign: isSign ? 1 : 0,
      sign_points: signPoints,
      recommend_goods: recommendGoods,
    };
  }

  // 用户执行签到
  async userSignIn(userId: number): Promise<any> {
    // 检查今天是否已经签到
    if (await this.checkUserSignIn(userId)) {
      throw new Error("今日已签到");
    }

    const settings = await this.getSignSettingList();
    const currentCount = await this.getSignCount(userId);

    // 计算下一个签到天数
    const nextDayNum = currentCount >= 7 ? 7 : currentCount + 1;
    const setting = settings.find((s) => s.day_num === nextDayNum);

    if (!setting) {
      throw new Error("签到配置不存在");
    }

    // 计算实际签到次数（如果是连续第7天，重新开始计算）
    let actualSignNum = currentCount + 1;
    if (currentCount >= 7) {
      // 检查是否是连续第7天，如果是则重置为1
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayStart = Math.floor(yesterday.getTime() / 1000);
      const yesterdayEnd = yesterdayStart + 86400;

      const yesterdaySign = await this.prisma.sign.findFirst({
        where: {
          user_id: userId,
          add_time: {
            gte: yesterdayStart,
            lt: yesterdayEnd,
          },
        },
      });

      if (!yesterdaySign) {
        actualSignNum = 1;
      }
    }

    // 执行签到
    const signRecord = await this.addSignIn(userId, actualSignNum);

    // 给用户增加积分（这里只返回积分信息，实际积分增加需要在用户积分模块中实现）
    return {
      sign_id: signRecord.id,
      points: setting.points,
      sign_num: actualSignNum,
      message: `签到成功，获得${setting.points}积分`,
    };
  }
}
