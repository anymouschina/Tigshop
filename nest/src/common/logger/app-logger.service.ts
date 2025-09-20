// @ts-nocheck
import { ConsoleLogger, Injectable, LogLevel, Scope } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService extends ConsoleLogger {
  private static logLevels: LogLevel[] = [
    "error",
    "warn",
    "log",
    "debug",
    "verbose",
  ];

  constructor(context?: string) {
    super(context);

    // 设置日志级别
    const logLevel = process.env.LOG_LEVEL || "debug";
    const levels = this.getLogLevels(logLevel);
    this.setLogLevels(levels);

    // 确保日志目录存在
    this.ensureLogDirectory();
  }

  /**
   * 获取带颜色的日志消息
   */
  private getColorizedMessage(message: any, logLevel: string): string {
    const colors = {
      error: "\x1b[31m", // 红色
      warn: "\x1b[33m", // 黄色
      log: "\x1b[36m", // 青色
      debug: "\x1b[32m", // 绿色
      verbose: "\x1b[35m", // 紫色
    };

    const reset = "\x1b[0m";
    const color = colors[logLevel] || "";

    return `${color}${message}${reset}`;
  }

  /**
   * 根据环境变量设置的日志级别获取对应的日志级别数组
   */
  private getLogLevels(level: string): LogLevel[] {
    const levelsMap = {
      error: ["error"],
      warn: ["error", "warn"],
      log: ["error", "warn", "log"],
      debug: ["error", "warn", "log", "debug"],
      verbose: ["error", "warn", "log", "debug", "verbose"],
    };

    return levelsMap[level] || AppLoggerService.logLevels;
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 写入日志到文件
   */
  private writeLogToFile(message: any, logLevel: string): void {
    try {
      const logDir = path.join(process.cwd(), "logs");
      const today = new Date().toISOString().split("T")[0];
      const logFile = path.join(logDir, `app-${today}.log`);

      const timestamp = new Date().toISOString();
      const context = this.context ? `[${this.context}]` : "";
      const formattedMessage = `${timestamp} ${logLevel.toUpperCase()} ${context} ${message}\n`;

      fs.appendFileSync(logFile, formattedMessage);
    } catch (error) {
      super.error(`Failed to write log to file: ${error.message}`, error.stack);
    }
  }

  log(message: any, ...optionalParams: any[]) {
    const colorizedMessage = this.getColorizedMessage(message, "log");
    super.log(colorizedMessage, ...optionalParams);
    this.writeLogToFile(message, "log");
  }

  error(message: any, ...optionalParams: any[]) {
    const colorizedMessage = this.getColorizedMessage(message, "error");
    super.error(colorizedMessage, ...optionalParams);
    this.writeLogToFile(message, "error");
  }

  warn(message: any, ...optionalParams: any[]) {
    const colorizedMessage = this.getColorizedMessage(message, "warn");
    super.warn(colorizedMessage, ...optionalParams);
    this.writeLogToFile(message, "warn");
  }

  debug(message: any, ...optionalParams: any[]) {
    const colorizedMessage = this.getColorizedMessage(message, "debug");
    super.debug(colorizedMessage, ...optionalParams);
    this.writeLogToFile(message, "debug");
  }

  verbose(message: any, ...optionalParams: any[]) {
    const colorizedMessage = this.getColorizedMessage(message, "verbose");
    super.verbose(colorizedMessage, ...optionalParams);
    this.writeLogToFile(message, "verbose");
  }
}
