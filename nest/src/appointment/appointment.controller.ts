import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentServiceDto,
  AppointmentAvailabilityDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('预约管理')
@ApiBearerAuth()
@Controller('appointment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: '创建预约' })
  @ApiResponse({ status: 201, description: '预约创建成功' })
  async createAppointment(
    @Body() createDto: CreateAppointmentDto,
    @Request() req: any,
  ) {
    const creatorId = req.user?.userId;
    return this.appointmentService.createAppointment(createDto, creatorId);
  }

  @Get('list')
  @ApiOperation({ summary: '获取预约列表' })
  @ApiResponse({ status: 200, description: '获取预约列表成功' })
  async getAppointments(@Query() query: AppointmentQueryDto) {
    const [records, total] = await Promise.all([
      this.appointmentService.getFilterResult(query),
      this.appointmentService.getFilterCount(query),
    ]);

    return {
      records,
      total,
      page: query.page || 1,
      size: query.size || 15,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取预约详情' })
  @ApiResponse({ status: 200, description: '获取预约详情成功' })
  async getAppointmentById(@Param('id') id: number) {
    return this.appointmentService.getAppointmentById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新预约' })
  @ApiResponse({ status: 200, description: '预约更新成功' })
  async updateAppointment(
    @Param('id') id: number,
    @Body() updateDto: UpdateAppointmentDto,
    @Request() req: any,
  ) {
    const updaterId = req.user?.userId;
    return this.appointmentService.updateAppointment(id, updateDto, updaterId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消预约' })
  @ApiResponse({ status: 200, description: '预约取消成功' })
  async cancelAppointment(
    @Param('id') id: number,
    @Body() cancelDto: CancelAppointmentDto,
    @Request() req: any,
  ) {
    const cancellerId = req.user?.userId;
    return this.appointmentService.cancelAppointment(id, cancelDto, cancellerId);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: '重新安排预约' })
  @ApiResponse({ status: 200, description: '预约重新安排成功' })
  async rescheduleAppointment(
    @Param('id') id: number,
    @Body() rescheduleDto: RescheduleAppointmentDto,
    @Request() req: any,
  ) {
    const reschedulerId = req.user?.userId;
    return this.appointmentService.rescheduleAppointment(id, rescheduleDto, reschedulerId);
  }

  // 服务人员相关
  @Get('staff/:staffId/availability')
  @ApiOperation({ summary: '获取服务人员可用时间' })
  @ApiResponse({ status: 200, description: '获取可用时间成功' })
  async getStaffAvailability(
    @Param('staffId') staffId: number,
    @Query('date') date: string,
  ) {
    const queryDate = new Date(date);
    return this.appointmentService.getStaffAvailability(staffId, queryDate);
  }

  @Get('staff/:staffId/appointments')
  @ApiOperation({ summary: '获取服务人员预约列表' })
  @ApiResponse({ status: 200, description: '获取预约列表成功' })
  async getStaffAppointments(
    @Param('staffId') staffId: number,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.appointmentService.getStaffAppointments(staffId, query);
  }

  // 客户相关
  @Get('customer/:customerId/appointments')
  @ApiOperation({ summary: '获取客户预约列表' })
  @ApiResponse({ status: 200, description: '获取预约列表成功' })
  async getCustomerAppointments(
    @Param('customerId') customerId: number,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.appointmentService.getCustomerAppointments(customerId, query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '获取即将到来的预约' })
  @ApiResponse({ status: 200, description: '获取预约列表成功' })
  async getUpcomingAppointments(@Request() req: any) {
    const userId = req.user?.userId;
    return this.appointmentService.getUpcomingAppointments(userId);
  }

  // 服务项目管理
  @Post('service')
  @ApiOperation({ summary: '创建服务项目' })
  @ApiResponse({ status: 201, description: '服务项目创建成功' })
  @Roles('admin')
  async createService(@Body() serviceDto: AppointmentServiceDto) {
    return this.appointmentService.createService(serviceDto);
  }

  @Get('service/list')
  @ApiOperation({ summary: '获取服务项目列表' })
  @ApiResponse({ status: 200, description: '获取服务项目列表成功' })
  async getServices() {
    return this.appointmentService.getServices();
  }

  @Get('service/:id')
  @ApiOperation({ summary: '获取服务项目详情' })
  @ApiResponse({ status: 200, description: '获取服务项目详情成功' })
  async getServiceById(@Param('id') id: number) {
    return this.appointmentService.getServiceById(id);
  }

  // 检查可用性
  @Post('check-availability')
  @ApiOperation({ summary: '检查预约可用性' })
  @ApiResponse({ status: 200, description: '检查可用性成功' })
  async checkAvailability(@Body() availabilityDto: AppointmentAvailabilityDto) {
    try {
      await this.appointmentService.getStaffAvailability(
        availabilityDto.staffId,
        availabilityDto.date,
      );
      return { available: true };
    } catch (error) {
      return { available: false, message: error.message };
    }
  }

  // 统计信息
  @Get('stats')
  @ApiOperation({ summary: '获取预约统计信息' })
  @ApiResponse({ status: 200, description: '获取统计信息成功' })
  async getAppointmentStats() {
    return this.appointmentService.getAppointmentStats();
  }

  // 确认预约
  @Post(':id/confirm')
  @ApiOperation({ summary: '确认预约' })
  @ApiResponse({ status: 200, description: '预约确认成功' })
  async confirmAppointment(@Param('id') id: number, @Request() req: any) {
    const updaterId = req.user?.userId;
    return this.appointmentService.updateAppointment(
      id,
      { status: 'confirmed' as any },
      updaterId,
    );
  }

  // 开始服务
  @Post(':id/start')
  @ApiOperation({ summary: '开始服务' })
  @ApiResponse({ status: 200, description: '服务开始成功' })
  async startAppointment(@Param('id') id: number, @Request() req: any) {
    const updaterId = req.user?.userId;
    return this.appointmentService.updateAppointment(
      id,
      { status: 'in_progress' as any },
      updaterId,
    );
  }

  // 完成服务
  @Post(':id/complete')
  @ApiOperation({ summary: '完成服务' })
  @ApiResponse({ status: 200, description: '服务完成成功' })
  async completeAppointment(@Param('id') id: number, @Request() req: any) {
    const updaterId = req.user?.userId;
    return this.appointmentService.updateAppointment(
      id,
      { status: 'completed' as any },
      updaterId,
    );
  }

  // 标记为未到场
  @Post(':id/no-show')
  @ApiOperation({ summary: '标记为未到场' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markNoShow(@Param('id') id: number, @Request() req: any) {
    const updaterId = req.user?.userId;
    return this.appointmentService.updateAppointment(
      id,
      { status: 'no_show' as any },
      updaterId,
    );
  }
}