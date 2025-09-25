import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import Config from "src/config";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  // 创建全局日志实例
  const logger = new Logger("Application");
  console.log(1111)
  // 设置日志级别

    const app = await NestFactory.create<NestExpressApplication>(AppModule, 
      {
      logger: ["error", "warn", "log", "debug", "verbose"],
    })


    // 配置静态资源服务
    const uploadsPath = path.join(process.cwd(), "uploads");
    app.useStaticAssets(uploadsPath, {
      prefix: "/uploads/",
    });

    // 配置public目录为静态资源
    const publicPath = path.join(process.cwd(), "static");
    app.useStaticAssets(publicPath, {
      prefix: "/",
    });
      // ⚡ 开启跨域
    app.enableCors({
      origin: true, // 允许所有来源，也可以传数组 ['http://localhost:3000']
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    // 设置全局API前缀
    app.setGlobalPrefix("api");

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
        forbidNonWhitelisted: true,
      }),
    );


    // 启动微服务
    await app.startAllMicroservices();
    logger.log(`Microservice is running on Redis at ${redisHost}:${redisPort}`);

    // 启动HTTP服务
    await app.listen(Config.PORT);
    logger.log(`HTTP server is running on port ${Config.PORT}`);
    logger.log(
      `Swagger documentation is available at http://localhost:${Config.PORT}/api-docs`,
    );
}
bootstrap();
