// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentAvailabilityDto,
  AppointmentServiceDto,
  AppointmentType,
  AppointmentStatus,
  PaymentStatus,
} from "./dto/appointment.dto";

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(
    createDto: CreateAppointmentDto,
    creatorId?: number,
  ): Promise<any> {
    // 验证时间冲突
    await this.checkTimeConflict(
      createDto.startTime,
      createDto.endTime,
      createDto.staffId,
      createDto.customerId,
    );

    // 如果设置了服务人员，检查其可用性
    if (createDto.staffId) {
      await this.checkStaffAvailability(
        createDto.staffId,
        createDto.startTime,
        createDto.endTime,
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        type: createDto.type,
        title: createDto.title,
        description: createDto.description,
        customer_id: createDto.customerId,
        staff_id: createDto.staffId,
        start_time: createDto.startTime,
        end_time: createDto.endTime,
        location: createDto.location,
        contact_phone: createDto.contactPhone,
        notes: createDto.notes,
        fee: createDto.fee || 0,
        require_payment: createDto.requirePayment || false,
        max_participants: createDto.maxParticipants || 1,
        service_id: createDto.serviceId,
        order_id: createDto.orderId,
        status: AppointmentStatus.PENDING,
        payment_status: createDto.requirePayment
          ? PaymentStatus.UNPAID
          : PaymentStatus.PAID,
        creator_id: creatorId,
      },
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        service: true,
        order: true,
      },
    });

    // 发送预约确认通知
    await this.sendAppointmentNotification(appointment, "created");

    return appointment;
  }

  async getFilterResult(query: AppointmentQueryDto): Promise<any[]> {
    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderBy(query);
    const skip = ((query.page || 1) - 1) * (query.size || 15);
    const take = query.size || 15;

    return this.prisma.appointment.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        service: true,
        order: true,
      },
    });
  }

  async getFilterCount(query: AppointmentQueryDto): Promise<number> {
    const where = this.buildWhereClause(query);
    return this.prisma.appointment.count({ where });
  }

  private buildWhereClause(query: AppointmentQueryDto): any {
    const where: any = {};

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { description: { contains: query.keyword } },
        { location: { contains: query.keyword } },
        { notes: { contains: query.keyword } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.payment_status = query.paymentStatus;
    }

    if (query.customerId) {
      where.customer_id = query.customerId;
    }

    if (query.staffId) {
      where.staff_id = query.staffId;
    }

    if (query.serviceId) {
      where.service_id = query.serviceId;
    }

    if (query.orderId) {
      where.order_id = query.orderId;
    }

    if (query.startTime && query.endTime) {
      where.AND = [
        {
          start_time: {
            gte: query.startTime,
          },
        },
        {
          end_time: {
            lte: query.endTime,
          },
        },
      ];
    }

    return where;
  }

  private buildOrderBy(query: AppointmentQueryDto): any {
    const orderBy: any = {};
    const sortField = query.sortField || "start_time";
    const sortOrder = query.sortOrder || "asc";

    orderBy[sortField] = sortOrder;
    return orderBy;
  }

  async getAppointmentById(id: number): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        service: true,
        order: true,
        history: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException("预约不存在");
    }

    return appointment;
  }

  async updateAppointment(
    id: number,
    updateDto: UpdateAppointmentDto,
    updaterId?: number,
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException("预约不存在");
    }

    // 如果修改时间，检查冲突
    if (updateDto.startTime || updateDto.endTime) {
      const newStartTime = updateDto.startTime || appointment.start_time;
      const newEndTime = updateDto.endTime || appointment.end_time;

      await this.checkTimeConflict(
        newStartTime,
        newEndTime,
        updateDto.staffId || appointment.staff_id,
        appointment.customer_id,
        id,
      );
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...updateDto,
        updater_id: updaterId,
      },
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        service: true,
        order: true,
      },
    });

    // 记录历史
    await this.recordHistory(id, "updated", updaterId, updateDto);

    return updatedAppointment;
  }

  async cancelAppointment(
    id: number,
    cancelDto: CancelAppointmentDto,
    cancellerId?: number,
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException("预约不存在");
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException("预约已取消");
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException("已完成的预约不能取消");
    }

    const cancelledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellation_reason: cancelDto.reason,
        cancellation_notes: cancelDto.notes,
        cancelled_at: new Date(),
        canceller_id: cancellerId,
      },
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        service: true,
        order: true,
      },
    });

    // 记录历史
    await this.recordHistory(id, "cancelled", cancellerId, {
      reason: cancelDto.reason,
      notes: cancelDto.notes,
    });

    // 发送取消通知
    await this.sendAppointmentNotification(cancelledAppointment, "cancelled");

    return cancelledAppointment;
  }

  async rescheduleAppointment(
    id: number,
    rescheduleDto: RescheduleAppointmentDto,
    reschedulerId?: number,
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException("预约不存在");
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException("已取消的预约不能重新安排");
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException("已完成的预约不能重新安排");
    }

    // 检查新时间是否冲突
    await this.checkTimeConflict(
      rescheduleDto.newStartTime,
      rescheduleDto.newEndTime,
      appointment.staff_id,
      appointment.customer_id,
      id,
    );

    // 如果有服务人员，检查其可用性
    if (appointment.staff_id) {
      await this.checkStaffAvailability(
        appointment.staff_id,
        rescheduleDto.newStartTime,
        rescheduleDto.newEndTime,
        id,
      );
    }

    const rescheduledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        start_time: rescheduleDto.newStartTime,
        end_time: rescheduleDto.newEndTime,
        status: AppointmentStatus.RESCHEDULED,
        rescheduler_id: reschedulerId,
        rescheduled_at: new Date(),
      },
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
        service: true,
        order: true,
      },
    });

    // 记录历史
    await this.recordHistory(id, "rescheduled", reschedulerId, {
      oldStartTime: appointment.start_time,
      oldEndTime: appointment.end_time,
      newStartTime: rescheduleDto.newStartTime,
      newEndTime: rescheduleDto.newEndTime,
      reason: rescheduleDto.reason,
      notes: rescheduleDto.notes,
    });

    // 发送重新安排通知
    await this.sendAppointmentNotification(
      rescheduledAppointment,
      "rescheduled",
    );

    return rescheduledAppointment;
  }

  private async checkTimeConflict(
    startTime: Date,
    endTime: Date,
    staffId?: number,
    customerId?: number,
    excludeId?: number,
  ): Promise<void> {
    const where: any = {
      AND: [
        {
          start_time: {
            lt: endTime,
          },
        },
        {
          end_time: {
            gt: startTime,
          },
        },
      ],
      NOT: {
        status: {
          in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    };

    if (excludeId) {
      where.id = {
        not: excludeId,
      };
    }

    const conflicts = await this.prisma.appointment.findMany({
      where: {
        ...where,
        OR: [{ staff_id: staffId }, { customer_id: customerId }],
      },
    });

    if (conflicts.length > 0) {
      throw new ConflictException("该时间段已有预约冲突");
    }
  }

  private async checkStaffAvailability(
    staffId: number,
    startTime: Date,
    endTime: Date,
    excludeId?: number,
  ): Promise<void> {
    const where: any = {
      staff_id: staffId,
      AND: [
        {
          start_time: {
            lt: endTime,
          },
        },
        {
          end_time: {
            gt: startTime,
          },
        },
      ],
      NOT: {
        status: {
          in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    };

    if (excludeId) {
      where.id = {
        not: excludeId,
      };
    }

    const conflicts = await this.prisma.appointment.count({ where });

    if (conflicts > 0) {
      throw new ConflictException("该服务人员在该时间段已有其他预约");
    }
  }

  private async recordHistory(
    appointmentId: number,
    action: string,
    userId?: number,
    data?: any,
  ): Promise<void> {
    await this.prisma.appointmentHistory.create({
      data: {
        appointment_id: appointmentId,
        action,
        user_id: userId,
        data: data || {},
      },
    });
  }

  private async sendAppointmentNotification(
    appointment: any,
    action: string,
  ): Promise<void> {
    // TODO: 实现通知逻辑
    console.log(`发送预约${action}通知: ${appointment.title}`);
  }

  async getStaffAvailability(staffId: number, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        staff_id: staffId,
        start_time: {
          gte: startOfDay,
        },
        end_time: {
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      orderBy: {
        start_time: "asc",
      },
    });

    return appointments;
  }

  async getCustomerAppointments(
    customerId: number,
    query: AppointmentQueryDto,
  ): Promise<any> {
    const where = this.buildWhereClause(query);
    where.customer_id = customerId;

    const orderBy = this.buildOrderBy(query);
    const skip = ((query.page || 1) - 1) * (query.size || 15);
    const take = query.size || 15;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          staff: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
          service: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      records: appointments,
      total,
      page: query.page || 1,
      size: query.size || 15,
    };
  }

  async getStaffAppointments(
    staffId: number,
    query: AppointmentQueryDto,
  ): Promise<any> {
    const where = this.buildWhereClause(query);
    where.staff_id = staffId;

    const orderBy = this.buildOrderBy(query);
    const skip = ((query.page || 1) - 1) * (query.size || 15);
    const take = query.size || 15;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          customer: {
            select: {
              user_id: true,
              username: true,
              email: true,
              mobile: true,
            },
          },
          service: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      records: appointments,
      total,
      page: query.page || 1,
      size: query.size || 15,
    };
  }

  async getUpcomingAppointments(userId?: number): Promise<any[]> {
    const now = new Date();
    const where: any = {
      start_time: {
        gte: now,
      },
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
    };

    if (userId) {
      where.OR = [{ customer_id: userId }, { staff_id: userId }];
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: {
        start_time: "asc",
      },
      take: 10,
      include: {
        customer: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        staff: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getAppointmentStats(): Promise<any> {
    const totalAppointments = await this.prisma.appointment.count();
    const pendingAppointments = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.PENDING },
    });
    const completedAppointments = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.COMPLETED },
    });
    const cancelledAppointments = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.CANCELLED },
    });

    const typeStats = await this.prisma.appointment.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const todayRevenue = await this.prisma.appointment.aggregate({
      where: {
        status: AppointmentStatus.COMPLETED,
        payment_status: PaymentStatus.PAID,
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { fee: true },
    });

    return {
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      typeStats,
      todayRevenue: todayRevenue._sum.fee || 0,
    };
  }

  // 服务项目管理
  async createService(serviceDto: AppointmentServiceDto): Promise<any> {
    return this.prisma.appointmentService.create({
      data: {
        name: serviceDto.name,
        description: serviceDto.description,
        duration: serviceDto.duration,
        price: serviceDto.price,
        type: serviceDto.type,
        require_payment: serviceDto.requirePayment || false,
        max_participants: serviceDto.maxParticipants || 1,
        is_enabled: serviceDto.isEnabled ?? true,
      },
    });
  }

  async getServices(): Promise<any[]> {
    return this.prisma.appointmentService.findMany({
      where: {
        is_enabled: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async getServiceById(id: number): Promise<any> {
    const service = await this.prisma.appointmentService.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException("服务项目不存在");
    }

    return service;
  }
}
