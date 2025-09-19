import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '../config/config.service';

export enum MicroserviceType {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  PAYMENT = 'payment',
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  SMS = 'sms',
  ANALYTICS = 'analytics',
  SEARCH = 'search',
  FILE = 'file',
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
        console.error(`Failed to initialize ${config.type} microservice:`, error);
      }
    }
  }

  private getMicroserviceConfigs(): MicroserviceConfig[] {
    const rabbitmqUrl = this.configService.get('RABBITMQ_URL');
    const redisUrl = this.configService.get('REDIS_URL');
    const kafkaBrokers = this.configService.get('KAFKA_BROKERS');

    return [
      {
        type: MicroserviceType.USER,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'user_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.PRODUCT,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'product_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.ORDER,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'order_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.PAYMENT,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'payment_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.NOTIFICATION,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'notification_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.EMAIL,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'email_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.SMS,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'sms_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        type: MicroserviceType.ANALYTICS,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'analytics_client',
            brokers: kafkaBrokers.split(','),
          },
          consumer: {
            groupId: 'analytics_group',
          },
        },
      },
      {
        type: MicroserviceType.SEARCH,
        transport: Transport.REDIS,
        options: {
          url: redisUrl,
        },
      },
      {
        type: MicroserviceType.FILE,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: 'file_queue',
          queueOptions: {
            durable: true,
          },
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
    if (!client) {
      throw new Error(`${type} microservice client not found`);
    }
    return client;
  }

  isConnectedTo(type: MicroserviceType): boolean {
    return this.isConnected.get(type) || false;
  }

  async sendPattern<T = any>(
    type: MicroserviceType,
    pattern: string,
    data: any,
    timeout = 5000,
  ): Promise<T> {
    const client = this.getClient(type);

    if (!this.isConnectedTo(type)) {
      throw new Error(`${type} microservice is not connected`);
    }

    try {
      return await client.send<T>({ cmd: pattern }, data).toPromise();
    } catch (error) {
      console.error(`Error sending pattern to ${type} microservice:`, error);
      throw error;
    }
  }

  async emitEvent(
    type: MicroserviceType,
    pattern: string,
    data: any,
  ): Promise<void> {
    const client = this.getClient(type);

    if (!this.isConnectedTo(type)) {
      throw new Error(`${type} microservice is not connected`);
    }

    try {
      client.emit({ cmd: pattern }, data);
    } catch (error) {
      console.error(`Error emitting event to ${type} microservice:`, error);
      throw error;
    }
  }

  async retryConnection(type: MicroserviceType): Promise<void> {
    const config = this.getMicroserviceConfigs().find(c => c.type === type);
    if (!config) {
      throw new Error(`Configuration for ${type} microservice not found`);
    }

    // Close existing connection
    const existingClient = this.clients.get(type);
    if (existingClient) {
      await existingClient.close();
    }

    // Create new connection
    await this.createClient(config);
  }

  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.clients.values()).map(client =>
      client.close().catch(error => {
        console.error('Error closing microservice connection:', error);
      })
    );

    await Promise.all(closePromises);
    this.clients.clear();
    this.isConnected.clear();
  }

  getConnectionStatus(): Record<MicroserviceType, boolean> {
    const status: Record<MicroserviceType, boolean> = {} as any;

    Object.values(MicroserviceType).forEach(type => {
      status[type] = this.isConnectedTo(type);
    });

    return status;
  }

  // 高级功能
  async publishToKafka(topic: string, message: any): Promise<void> {
    const kafkaClient = this.getClient(MicroserviceType.ANALYTICS);

    if (!this.isConnectedTo(MicroserviceType.ANALYTICS)) {
      throw new Error('Analytics microservice (Kafka) is not connected');
    }

    try {
      kafkaClient.emit(topic, message);
    } catch (error) {
      console.error('Error publishing to Kafka:', error);
      throw error;
    }
  }

  async subscribeToKafka(topic: string, callback: (message: any) => void): Promise<void> {
    const kafkaClient = this.getClient(MicroserviceType.ANALYTICS);

    if (!this.isConnectedTo(MicroserviceType.ANALYTICS)) {
      throw new Error('Analytics microservice (Kafka) is not connected');
    }

    try {
      kafkaClient.connect().then(() => {
        kafkaClient.send({ cmd: 'subscribe' }, { topic }).subscribe({
          next: (message) => callback(message),
          error: (error) => console.error('Kafka subscription error:', error),
        });
      });
    } catch (error) {
      console.error('Error subscribing to Kafka:', error);
      throw error;
    }
  }

  async publishToRedis(channel: string, message: any): Promise<void> {
    const redisClient = this.getClient(MicroserviceType.SEARCH);

    if (!this.isConnectedTo(MicroserviceType.SEARCH)) {
      throw new Error('Search microservice (Redis) is not connected');
    }

    try {
      redisClient.emit(channel, message);
    } catch (error) {
      console.error('Error publishing to Redis:', error);
      throw error;
    }
  }

  async subscribeToRedis(channel: string, callback: (message: any) => void): Promise<void> {
    const redisClient = this.getClient(MicroserviceType.SEARCH);

    if (!this.isConnectedTo(MicroserviceType.SEARCH)) {
      throw new Error('Search microservice (Redis) is not connected');
    }

    try {
      redisClient.connect().then(() => {
        redisClient.send({ cmd: 'subscribe' }, { channel }).subscribe({
          next: (message) => callback(message),
          error: (error) => console.error('Redis subscription error:', error),
        });
      });
    } catch (error) {
      console.error('Error subscribing to Redis:', error);
      throw error;
    }
  }

  // 服务发现
  async discoverServices(): Promise<Record<string, any>> {
    const services: Record<string, any> = {};

    for (const [type, client] of this.clients.entries()) {
      if (this.isConnectedTo(type)) {
        try {
          const health = await this.sendPattern(type, 'health_check', {});
          services[type] = {
            status: 'healthy',
            health,
            lastCheck: new Date(),
          };
        } catch (error) {
          services[type] = {
            status: 'unhealthy',
            error: error.message,
            lastCheck: new Date(),
          };
        }
      } else {
        services[type] = {
          status: 'disconnected',
          lastCheck: new Date(),
        };
      }
    }

    return services;
  }

  // 负载均衡
  async sendWithLoadBalancer<T = any>(
    type: MicroserviceType,
    pattern: string,
    data: any,
    instances: string[] = [],
    strategy: 'round-robin' | 'random' | 'least-connections' = 'round-robin',
  ): Promise<T> {
    // 如果没有指定实例，使用默认客户端
    if (instances.length === 0) {
      return this.sendPattern(type, pattern, data);
    }

    // 简单的负载均衡实现
    const selectedInstance = this.selectInstance(instances, strategy);

    // 这里可以根据不同的实例创建不同的客户端连接
    // 目前简化处理，使用默认客户端
    return this.sendPattern(type, pattern, data);
  }

  private selectInstance(instances: string[], strategy: string): string {
    switch (strategy) {
      case 'random':
        return instances[Math.floor(Math.random() * instances.length)];
      case 'least-connections':
        // 简化实现，实际需要跟踪连接数
        return instances[0];
      case 'round-robin':
      default:
        // 简化的轮询实现
        const index = Date.now() % instances.length;
        return instances[index];
    }
  }

  // 事件溯源
  async publishEvent(eventType: string, eventData: any, aggregateId: string): Promise<void> {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      aggregateId,
      timestamp: new Date(),
      version: 1,
    };

    await this.publishToKafka('events', event);
  }

  async getEventsByAggregate(aggregateId: string): Promise<any[]> {
    // 这里需要从事件存储中获取事件
    // 简化实现，返回空数组
    return [];
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}