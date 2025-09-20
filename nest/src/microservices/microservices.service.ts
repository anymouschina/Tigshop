// @ts-nocheck
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

export enum MicroserviceType {
  USER = "user",
  PRODUCT = "product",
  ORDER = "order",
  PAYMENT = "payment",
  NOTIFICATION = "notification",
  EMAIL = "email",
  SMS = "sms",
  ANALYTICS = "analytics",
  SEARCH = "search",
  FILE = "file",
}

export interface MicroserviceConfig {
  type: MicroserviceType;
  transport: Transport;
  options: any;
}

@Injectable()
export class MicroservicesService implements OnModuleInit, OnModuleDestroy {
  private clients: Map<MicroserviceType, ClientProxy> = new Map();
  private isConnected: Map<MicroserviceType, boolean> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeClients();
  }

  async onModuleDestroy() {
    await this.closeAllConnections();
  }

  private async initializeClients() {
    const configs = this.getMicroserviceConfigs();

    for (const config of configs) {
      try {
        await this.createClient(config);
      } catch (error) {
        console.error(`Failed to initialize ${config.type}:`, error);
      }
    }
  }

  private getMicroserviceConfigs(): MicroserviceConfig[] {
    const rabbitmqUrl = this.configService.get("RABBITMQ_URL") || "amqp://localhost:5672";
    const redisUrl = this.configService.get("REDIS_URL") || "redis://localhost:6379";
    const kafkaBrokers = this.configService.get("KAFKA_BROKERS")?.split(",") || ["127.0.0.1:9092"];

    return [
      // RabbitMQ 微服务
      ...["USER", "PRODUCT", "ORDER", "PAYMENT", "NOTIFICATION", "EMAIL", "SMS", "FILE"].map((type) => ({
        type: MicroserviceType[type as keyof typeof MicroserviceType],
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: `${type.toLowerCase()}_queue`,
          queueOptions: { durable: true },
        },
      })),
      // Kafka 微服务
      {
        type: MicroserviceType.ANALYTICS,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "analytics_client",
            brokers: kafkaBrokers,
          },
          consumer: {
            groupId: "analytics_group",
          },
        },
      },
      // Redis 微服务
      {
        type: MicroserviceType.SEARCH,
        transport: Transport.REDIS,
        options: {
          url: redisUrl,
        },
      },
    ];
  }

  private async createClient(config: MicroserviceConfig): Promise<void> {
    const client = ClientProxyFactory.create(config);

    try {
      await client.connect();
      this.clients.set(config.type, client);
      this.isConnected.set(config.type, true);
      console.log(`${config.type} microservice connected successfully`);
    } catch (error) {
      this.clients.set(config.type, client);
      this.isConnected.set(config.type, false);
      console.error(`${config.type} microservice connection failed:`, error);
    }
  }

  getClient(type: MicroserviceType): ClientProxy {
    const client = this.clients.get(type);
    if (!client) throw new Error(`${type} microservice client not found`);
    return client;
  }

  isConnectedTo(type: MicroserviceType): boolean {
    return this.isConnected.get(type) || false;
  }

  async sendPattern<T = any>(type: MicroserviceType, pattern: string, data: any): Promise<T> {
    const client = this.getClient(type);
    if (!this.isConnectedTo(type)) throw new Error(`${type} is not connected`);
    return client.send<T>({ cmd: pattern }, data).toPromise();
  }

  async emitEvent(type: MicroserviceType, pattern: string, data: any): Promise<void> {
    const client = this.getClient(type);
    if (!this.isConnectedTo(type)) throw new Error(`${type} is not connected`);
    client.emit({ cmd: pattern }, data);
  }

  async closeAllConnections(): Promise<void> {
    await Promise.all(Array.from(this.clients.values()).map((c) => c.close().catch(console.error)));
    this.clients.clear();
    this.isConnected.clear();
  }
}
