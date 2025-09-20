// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { SignQueryDto } from "./dto/user-sign.dto";

@Injectable()
export class UserSignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSignSetting() {
    const pointsSetting = this.configService.get("POINTS_SETTING", {});
    return {
      is_enabled: pointsSetting.enabled || false,
      daily_points: pointsSetting.daily_points || 10,
      continuous_bonus: pointsSetting.continuous_bonus || {},
    };
  }

  async getUserSignInfo(userId: number) {
    // 获取签到设置
    const signSetting = await this.getSignSetting();

    // 检查今天是否已签到
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const isSignedToday = await this.checkSignedToday(userId, todayStr);

    // 获取连续签到天数
    const continuousDays = await this.getContinuousSignDays(userId, todayStr);

    // 获取本月签到天数
    const monthSignDays = await this.getMonthSignDays(userId, today);

    // 获取签到记录
    const signRecords = await this.getSignRecords(userId, 30); // 最近30天

    return {
      is_enabled: signSetting.is_enabled,
      is_signed_today: isSignedToday,
      continuous_days: continuousDays,
      month_sign_days: monthSignDays,
      sign_records: signRecords,
      sign_setting: signSetting,
    };
  }

  async dailySign(userId: number) {
    // 检查签到是否启用
    const signSetting = await this.getSignSetting();
    if (!signSetting.is_enabled) {
      throw new BadRequestException("签到功能已关闭");
    }

    // 检查今天是否已签到
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const isSignedToday = await this.checkSignedToday(userId, todayStr);
    if (isSignedToday) {
      throw new ConflictException("今日已签到");
    }

    // 获取连续签到天数
    const continuousDays = await this.getContinuousSignDays(userId, todayStr);

    // 计算获得积分
    let points = signSetting.daily_points;
    const continuousBonus = signSetting.continuous_bonus;

    // 连续签到奖励
    if (continuousBonus && continuousDays > 1) {
      Object.keys(continuousBonus).forEach((days) => {
        if (continuousDays >= parseInt(days)) {
          points += continuousBonus[days] || 0;
        }
      });
    }

    // 创建签到记录
    const signRecord = await this.prisma.user_sign.create({
      data: {
        user_id: userId,
        sign_date: todayStr,
        points: points,
        continuous_days: continuousDays,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 增加用户积分
    await this.prisma.user_points.update({
      where: { user_id: userId },
      data: {
        points: {
          increment: points,
        },
      },
    });

    // 记录积分日志
    await this.prisma.user_points_log.create({
      data: {
        user_id: userId,
        points: points,
        log_type: "sign",
        description: `每日签到 #${signRecord.id}`,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      success: true,
      points: points,
      continuous_days: continuousDays,
      message: `签到成功，获得${points}积分`,
    };
  }

  async getSignRecords(userId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.user_sign.findMany({
      where: {
        user_id: userId,
        sign_date: {
          gte: startDate.toISOString().split("T")[0],
        },
      },
      orderBy: { sign_date: "desc" },
      select: {
        id: true,
        sign_date: true,
        points: true,
        continuous_days: true,
        add_time: true,
      },
    });

    return records;
  }

  async getSignLog(userId: number, queryDto: SignQueryDto) {
    const { page = 1, size = 10, start_date, end_date } = queryDto;
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };

    if (start_date) {
      where.sign_date = { gte: start_date };
    }

    if (end_date) {
      where.sign_date = { ...where.sign_date, lte: end_date };
    }

    const [logs, total] = await Promise.all([
      this.prisma.user_sign.findMany({
        where,
        skip,
        take: size,
        orderBy: { sign_date: "desc" },
        select: {
          id: true,
          sign_date: true,
          points: true,
          continuous_days: true,
          add_time: true,
        },
      }),
      this.prisma.user_sign.count({ where }),
    ]);

    return {
      list: logs,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  private async checkSignedToday(
    userId: number,
    todayStr: string,
  ): Promise<boolean> {
    const signRecord = await this.prisma.user_sign.findFirst({
      where: {
        user_id: userId,
        sign_date: todayStr,
      },
    });

    return !!signRecord;
  }

  private async getContinuousSignDays(
    userId: number,
    todayStr: string,
  ): Promise<number> {
    let continuousDays = 0;
    const checkDate = new Date(todayStr);

    while (true) {
      const checkDateStr = checkDate.toISOString().split("T")[0];
      const signRecord = await this.prisma.user_sign.findFirst({
        where: {
          user_id: userId,
          sign_date: checkDateStr,
        },
      });

      if (signRecord) {
        continuousDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return continuousDays;
  }

  private async getMonthSignDays(
    userId: number,
    currentDate: Date,
  ): Promise<number> {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const count = await this.prisma.user_sign.count({
      where: {
        user_id: userId,
        sign_date: {
          gte: `${year}-${month.toString().padStart(2, "0")}-01`,
          lte: `${year}-${month.toString().padStart(2, "0")}-31`,
        },
      },
    });

    return count;
  }

  async getSignRanking(limit: number = 10) {
    const rankings = await this.prisma.user.findMany({
      where: { is_using: 1 },
      select: {
        user_id: true,
        username: true,
        nickname: true,
        avatar: true,
        user_points: {
          select: {
            points: true,
          },
        },
        _count: {
          select: {
            user_sign: true,
          },
        },
      },
      orderBy: [
        { user_sign: { _count: "desc" } },
        { user_points: { points: "desc" } },
      ],
      take: limit,
    });

    return rankings.map((user, index) => ({
      rank: index + 1,
      user_id: user.user_id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      points: user.user_points?.points || 0,
      sign_count: user._count.user_sign,
    }));
  }

  async getSignStatistics(userId: number) {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [thisMonthSigns, lastMonthSigns, totalSigns, totalPoints] =
      await Promise.all([
        this.prisma.user_sign.count({
          where: {
            user_id: userId,
            sign_date: { gte: thisMonth.toISOString().split("T")[0] },
          },
        }),
        this.prisma.user_sign.count({
          where: {
            user_id: userId,
            sign_date: {
              gte: lastMonth.toISOString().split("T")[0],
              lt: thisMonth.toISOString().split("T")[0],
            },
          },
        }),
        this.prisma.user_sign.count({
          where: { user_id: userId },
        }),
        this.prisma.user_sign.aggregate({
          where: { user_id: userId },
          _sum: { points: true },
        }),
      ]);

    return {
      this_month_signs: thisMonthSigns,
      last_month_signs: lastMonthSigns,
      total_signs: totalSigns,
      total_points: totalPoints._sum.points || 0,
    };
  }
}
