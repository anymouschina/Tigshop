// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateProductTeamDto,
  UpdateProductTeamDto,
  ProductTeamQueryDto,
  ProductTeamStatus,
  ProductTeamConfigDto,
} from "./dto/productTeam.dto";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class ProductTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: ProductTeamQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "team_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { team_id: { contains: keyword } },
        { product_id: { contains: keyword } },
        { team_price: { contains: keyword } },
        { min_people: { contains: keyword } },
        { max_people: { contains: keyword } },
        { status: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.product_team.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.product_team.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: number) {
    const item = await this.prisma.product_team.findUnique({
      where: { team_id: id },
    });

    if (!item) {
      throw new NotFoundException("团购活动不存在");
    }

    return item;
  }

  async create(createDto: CreateProductTeamDto) {
    if (createDto.teamPrice <= 0) {
      throw new BadRequestException("团购价格必须大于0");
    }
    if (createDto.minPeople <= 0) {
      throw new BadRequestException("最小人数必须大于0");
    }
    if (createDto.maxPeople < createDto.minPeople) {
      throw new BadRequestException("最大人数不能小于最小人数");
    }

    const item = await this.prisma.product_team.create({
      data: {
        team_price: createDto.teamPrice,
        min_people: createDto.minPeople,
        max_people: createDto.maxPeople,
        start_time: Math.floor(new Date(createDto.startTime).getTime() / 1000),
        end_time: Math.floor(new Date(createDto.endTime).getTime() / 1000),
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateProductTeamDto) {
    const item = await this.prisma.product_team.findUnique({
      where: { team_id: id },
    });

    if (!item) {
      throw new NotFoundException("团购活动不存在");
    }

    const updateData: any = {};
    if (updateDto.teamPrice !== undefined) {
      updateData.team_price = updateDto.teamPrice;
    }
    if (updateDto.minPeople !== undefined) {
      updateData.min_people = updateDto.minPeople;
    }
    if (updateDto.maxPeople !== undefined) {
      updateData.max_people = updateDto.maxPeople;
    }
    if (updateDto.startTime !== undefined) {
      updateData.start_time = Math.floor(
        new Date(updateDto.startTime).getTime() / 1000,
      );
    }
    if (updateDto.endTime !== undefined) {
      updateData.end_time = Math.floor(
        new Date(updateDto.endTime).getTime() / 1000,
      );
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.product_team.update({
      where: { team_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.product_team.findUnique({
      where: { team_id: id },
    });

    if (!item) {
      throw new NotFoundException("团购活动不存在");
    }

    await this.prisma.product_team.delete({
      where: { team_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.product_team.deleteMany({
      where: { team_id: { in: ids } },
    });
  }

  async getConfig(): Promise<ProductTeamConfigDto> {
    return {
      statusConfig: {
        [ProductTeamStatus.PENDING]: "待审核",
        [ProductTeamStatus.ACTIVE]: "激活",
        [ProductTeamStatus.ENDED]: "已结束",
        [ProductTeamStatus.CANCELLED]: "已取消",
      },
    };
  }
}
