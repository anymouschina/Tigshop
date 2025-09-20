// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  MicroservicesService,
  MicroserviceType,
} from "./microservices.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("微服务管理")
@ApiBearerAuth()
@Controller("microservices")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MicroservicesController {
  constructor(private readonly microservicesService: MicroservicesService) {}

  @Get("status")
  @ApiOperation({ summary: "获取微服务连接状态" })
  @ApiResponse({ status: 200, description: "获取连接状态成功" })
  async getConnectionStatus() {
    return this.microservicesService.getConnectionStatus();
  }

  @Post(":type/reconnect")
  @ApiOperation({ summary: "重新连接微服务" })
  @ApiResponse({ status: 200, description: "重新连接成功" })
  @Roles("admin")
  async reconnect(@Param("type") type: MicroserviceType) {
    await this.microservicesService.retryConnection(type);
    return { message: `${type} microservice reconnected successfully` };
  }

  @Post(":type/send")
  @ApiOperation({ summary: "发送消息到微服务" })
  @ApiResponse({ status: 200, description: "消息发送成功" })
  async sendMessage(
    @Param("type") type: MicroserviceType,
    @Body()
    data: {
      pattern: string;
      payload: any;
      timeout?: number;
    },
  ) {
    const result = await this.microservicesService.sendPattern(
      type,
      data.pattern,
      data.payload,
      data.timeout || 5000,
    );
    return { result };
  }

  @Post(":type/emit")
  @ApiOperation({ summary: "发送事件到微服务" })
  @ApiResponse({ status: 200, description: "事件发送成功" })
  async emitEvent(
    @Param("type") type: MicroserviceType,
    @Body()
    data: {
      pattern: string;
      payload: any;
    },
  ) {
    await this.microservicesService.emitEvent(type, data.pattern, data.payload);
    return { message: "Event emitted successfully" };
  }

  @Get("services")
  @ApiOperation({ summary: "服务发现" })
  @ApiResponse({ status: 200, description: "获取服务信息成功" })
  async discoverServices() {
    return this.microservicesService.discoverServices();
  }

  @Post("kafka/publish")
  @ApiOperation({ summary: "发布消息到Kafka" })
  @ApiResponse({ status: 200, description: "消息发布成功" })
  async publishToKafka(@Body() data: { topic: string; message: any }) {
    await this.microservicesService.publishToKafka(data.topic, data.message);
    return { message: "Message published to Kafka successfully" };
  }

  @Post("kafka/subscribe")
  @ApiOperation({ summary: "订阅Kafka主题" })
  @ApiResponse({ status: 200, description: "订阅成功" })
  async subscribeToKafka(@Body() data: { topic: string }) {
    await this.microservicesService.subscribeToKafka(data.topic, (message) => {
      console.log(`Received message from Kafka topic ${data.topic}:`, message);
    });
    return { message: "Subscribed to Kafka topic successfully" };
  }

  @Post("redis/publish")
  @ApiOperation({ summary: "发布消息到Redis" })
  @ApiResponse({ status: 200, description: "消息发布成功" })
  async publishToRedis(@Body() data: { channel: string; message: any }) {
    await this.microservicesService.publishToRedis(data.channel, data.message);
    return { message: "Message published to Redis successfully" };
  }

  @Post("redis/subscribe")
  @ApiOperation({ summary: "订阅Redis频道" })
  @ApiResponse({ status: 200, description: "订阅成功" })
  async subscribeToRedis(@Body() data: { channel: string }) {
    await this.microservicesService.subscribeToRedis(
      data.channel,
      (message) => {
        console.log(
          `Received message from Redis channel ${data.channel}:`,
          message,
        );
      },
    );
    return { message: "Subscribed to Redis channel successfully" };
  }

  @Post("events/publish")
  @ApiOperation({ summary: "发布事件" })
  @ApiResponse({ status: 200, description: "事件发布成功" })
  async publishEvent(
    @Body() data: { eventType: string; eventData: any; aggregateId: string },
  ) {
    await this.microservicesService.publishEvent(
      data.eventType,
      data.eventData,
      data.aggregateId,
    );
    return { message: "Event published successfully" };
  }

  @Get("events/:aggregateId")
  @ApiOperation({ summary: "获取聚合事件" })
  @ApiResponse({ status: 200, description: "获取事件成功" })
  async getEventsByAggregate(@Param("aggregateId") aggregateId: string) {
    const events =
      await this.microservicesService.getEventsByAggregate(aggregateId);
    return { events };
  }

  @Post("load-balancer/send")
  @ApiOperation({ summary: "负载均衡发送" })
  @ApiResponse({ status: 200, description: "发送成功" })
  async sendWithLoadBalancer(
    @Body()
    data: {
      type: MicroserviceType;
      pattern: string;
      payload: any;
      instances?: string[];
      strategy?: "round-robin" | "random" | "least-connections";
    },
  ) {
    const result = await this.microservicesService.sendWithLoadBalancer(
      data.type,
      data.pattern,
      data.payload,
      data.instances || [],
      data.strategy || "round-robin",
    );
    return { result };
  }

  @Get("types")
  @ApiOperation({ summary: "获取微服务类型列表" })
  @ApiResponse({ status: 200, description: "获取类型列表成功" })
  async getMicroserviceTypes() {
    return {
      types: Object.values(MicroserviceType),
    };
  }

  @Post("health-check")
  @ApiOperation({ summary: "健康检查" })
  @ApiResponse({ status: 200, description: "健康检查完成" })
  async healthCheck() {
    const status = this.microservicesService.getConnectionStatus();
    const healthy = Object.values(status).every((connected) => connected);

    return {
      status: healthy ? "healthy" : "unhealthy",
      services: status,
      timestamp: new Date(),
    };
  }

  @Get("metrics")
  @ApiOperation({ summary: "获取微服务指标" })
  @ApiResponse({ status: 200, description: "获取指标成功" })
  async getMetrics() {
    // 简化的指标实现
    const connectionStatus = this.microservicesService.getConnectionStatus();
    const totalServices = Object.keys(connectionStatus).length;
    const connectedServices = Object.values(connectionStatus).filter(
      (connected) => connected,
    ).length;

    return {
      totalServices,
      connectedServices,
      disconnectedServices: totalServices - connectedServices,
      connectionRate:
        totalServices > 0 ? (connectedServices / totalServices) * 100 : 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date(),
    };
  }
}
