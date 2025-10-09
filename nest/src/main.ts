import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import Config from "src/config";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { WsAdapter } from "./common/ws/ws.adapter";
import { ImGateway } from "./im/im.gateway";

async function bootstrap() {
  // 统一处理 BigInt 的 JSON 序列化（例如 MySQL COUNT(*)/$queryRaw 返回 BigInt）
  // 避免 Express 在 JSON.stringify 时抛出 “Do not know how to serialize a BigInt”
  if (!(BigInt.prototype as any).toJSON) {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };
  }
  // 创建全局日志实例
  const logger = new Logger("Application");
  // logger.debug(1111);
  // 设置日志级别

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === "development" ? ["error", "warn", "log", "debug", "verbose"] : ["error", "warn", "log"],
  });

  // 注册自定义 ws 适配器（使用 ws 库，而不是 socket.io），复用同一个 HTTP server
  // 注意：之前的实现是先注册 adapter 再在 listen 之后 setHttpServer 并“重绑” gateway.server。
  // 这种方式导致重建的 ws Server 没有绑定 Nest 的 connection/message 处理逻辑，contexts 为空，从而 delivered=0。
  // 这里改为：在 useWebSocketAdapter 之前就注入 httpServer（NestFactory.create 已创建 httpServer），
  // 使得 Gateway 初始 create 时直接复用同一个 HTTP server，无需后续手动替换。
  const wsAdapter = new WsAdapter(app);
  try {
    wsAdapter.setHttpServer(app.getHttpServer());
  } catch (e) {
    // 理论上此处应该总是成功；若失败仍然继续，后续 listen 后不会再做重绑，避免重复 server
    new Logger('Application').warn('Pre-binding httpServer to WsAdapter failed (will fallback standalone): ' + (e as any)?.message);
  }
  app.useWebSocketAdapter(wsAdapter);

  // 配置静态资源服务
  const uploadsPath = path.join(process.cwd(), "uploads");
  app.useStaticAssets(uploadsPath, {
    prefix: "/uploads/",
  });

  // 配置public目录为静态资源
  const publicPath = path.join(process.cwd(), "static");
  if (process.env.NODE_ENV === "production") {
    // 禁用所有日志
    Logger.overrideLogger(["error"]); // 只保留 error 日志
  }

  app.useStaticAssets(publicPath, {
    prefix: "/",
  });
  // ⚡ 开启跨域
  app.enableCors({
    origin: true, // 允许所有来源，也可以传数组 ['http://localhost:3000']
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });
  // 设置全局API前缀 - 智能路由前缀处理
  // 应用路由前缀中间件 (暂时禁用用于调试)
  // app.use(routePrefixMiddleware);

  // 创建微服务
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT)
    : 6379;
  const redisPassword = process.env.REDIS_PASSWORD; // only pass when provided

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: redisHost,
      port: redisPort,
      ...(redisPassword ? { password: redisPassword } : {}),
    },
  });

  const options = new DocumentBuilder()
    .setTitle("OMS API")
    .setDescription("Order Management System API")
    .setVersion("1.0")
    .addServer(`http://localhost:${Config.PORT}`, "Local environment")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("api-docs", app, document);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // 允许存在额外的蛇形/驼峰重复字段
      skipMissingProperties: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 启动微服务
  await app.startAllMicroservices();
  logger.log(`Microservice is running on Redis at ${redisHost}:${redisPort}`);

  // 启动HTTP服务（Gateway 已经基于同一个 httpServer 创建 ws server）
  await app.listen(Config.PORT);
  logger.log(`HTTP server is running on port ${Config.PORT}`);
  logger.log(
    `Swagger documentation is available at http://localhost:${Config.PORT}/api-docs`,
  );
}
bootstrap();
