// @ts-nocheck
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

export interface CacheOptions {
  ttl?: number; // 过期时间（秒）
  keyPrefix?: string; // 键前缀
}

export interface CacheStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalRequests: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  usedMemory: number;
  connectedClients: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private defaultTTL = 3600; // 默认1小时
  private keyPrefix = "tigshop:";
  private stats = {
    hitCount: 0,
    missCount: 0,
  };

  constructor(@InjectRedis() private readonly redis: Redis) {
    this.logger = new Logger(RedisService.name)
  }

  async onModuleInit() {
    await this.testConnection();
  }

  async onModuleDestroy() {
    await this.quit();
  }

  private async testConnection(): Promise<void> {
    try {
      await this.redis.ping();
      this.logger.debug("Redis connection established successfully");
    } catch (error) {
      this.logger.debug("Redis connection failed:", error);
      throw error;
    }
  }

  // 基本操作
  async set(key: string, value: any, options?: CacheOptions): Promise<"OK"> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    const serializedValue = JSON.stringify(value);
    const ttl = options?.ttl || this.defaultTTL;

    if (ttl > 0) {
      return this.redis.set(fullKey, serializedValue, "EX", ttl);
    } else {
      return this.redis.set(fullKey, serializedValue);
    }
  }

  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);

    try {
      const value = await this.redis.get(fullKey);

      if (value === null) {
        this.stats.missCount++;
        return null;
      }

      this.stats.hitCount++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.debug(`Redis get error for key ${fullKey}:`, error);
      return null;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<number> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.del(fullKey);
  }

  async exists(key: string, options?: CacheOptions): Promise<number> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.exists(fullKey);
  }

  async expire(
    key: string,
    seconds: number,
    options?: CacheOptions,
  ): Promise<boolean> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.expire(fullKey, seconds);
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.ttl(fullKey);
  }

  // 批量操作
  async mset(data: Record<string, any>, options?: CacheOptions): Promise<"OK"> {
    const fullKeyData: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      const fullKey = this.getFullKey(key, options?.keyPrefix);
      fullKeyData[fullKey] = JSON.stringify(value);
    }

    return this.redis.mset(fullKeyData);
  }

  async mget(keys: string[], options?: CacheOptions): Promise<any[]> {
    const fullKeys = keys.map((key) =>
      this.getFullKey(key, options?.keyPrefix),
    );
    const values = await this.redis.mget(fullKeys);

    return values.map((value) => {
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    });
  }

  // 哈希操作
  async hset(
    key: string,
    field: string,
    value: any,
    options?: CacheOptions,
  ): Promise<number> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.hset(fullKey, field, JSON.stringify(value));
  }

  async hget<T = any>(
    key: string,
    field: string,
    options?: CacheOptions,
  ): Promise<T | null> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    const value = await this.redis.hget(fullKey, field);

    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async hgetall<T = Record<string, any>>(
    key: string,
    options?: CacheOptions,
  ): Promise<T> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    const result = await this.redis.hgetall(fullKey);

    const parsedResult: Record<string, any> = {};
    for (const [field, value] of Object.entries(result)) {
      try {
        parsedResult[field] = JSON.parse(value as string);
      } catch {
        parsedResult[field] = value;
      }
    }

    return parsedResult as T;
  }

  // 列表操作
  async lpush(key: string, ...values: any[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const serializedValues = values.map((v) => JSON.stringify(v));
    return this.redis.lpush(fullKey, ...serializedValues);
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const serializedValues = values.map((v) => JSON.stringify(v));
    return this.redis.rpush(fullKey, ...serializedValues);
  }

  async lpop<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.redis.lpop(fullKey);

    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.redis.rpop(fullKey);

    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async llen(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.redis.llen(fullKey);
  }

  async lrange<T = any>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    const fullKey = this.getFullKey(key);
    const values = await this.redis.lrange(fullKey, start, stop);

    return values.map((value) => {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    });
  }

  // 集合操作
  async sadd(key: string, ...members: any[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const serializedMembers = members.map((m) => JSON.stringify(m));
    return this.redis.sadd(fullKey, ...serializedMembers);
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    const fullKey = this.getFullKey(key);
    const members = await this.redis.smembers(fullKey);

    return members.map((member) => {
      try {
        return JSON.parse(member);
      } catch {
        return member;
      }
    });
  }

  async sismember(key: string, member: any): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return this.redis.sismember(fullKey, JSON.stringify(member));
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const serializedMembers = members.map((m) => JSON.stringify(m));
    return this.redis.srem(fullKey, ...serializedMembers);
  }

  // 有序集合操作
  async zadd(key: string, scoreMembers: [number, any][]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const serializedScoreMembers = scoreMembers.map(([score, member]) => [
      score,
      JSON.stringify(member),
    ]) as [number, string][];

    return this.redis.zadd(fullKey, ...serializedScoreMembers);
  }

  async zrange<T = any>(
    key: string,
    start: number,
    stop: number,
  ): Promise<T[]> {
    const fullKey = this.getFullKey(key);
    const members = await this.redis.zrange(fullKey, start, stop);

    return members.map((member) => {
      try {
        return JSON.parse(member);
      } catch {
        return member;
      }
    });
  }

  async zrangebyscore<T = any>(
    key: string,
    min: number | string,
    max: number | string,
    options?: { limit?: [number, number] },
  ): Promise<T[]> {
    const fullKey = this.getFullKey(key);
    let command = this.redis.zrangebyscore(fullKey, min, max);

    if (options?.limit) {
      command = command.limit(options.limit[0], options.limit[1]);
    }

    const members = await command;

    return members.map((member) => {
      try {
        return JSON.parse(member);
      } catch {
        return member;
      }
    });
  }

  // 高级功能
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    let value = await this.get<T>(key, options);

    if (value === null) {
      value = await factory();
      await this.set(key, value, options);
    }

    return value;
  }

  async remember<T = any>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    return this.getOrSet(key, factory, options);
  }

  async increment(
    key: string,
    increment = 1,
    options?: CacheOptions,
  ): Promise<number> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.incrby(fullKey, increment);
  }

  async decrement(
    key: string,
    decrement = 1,
    options?: CacheOptions,
  ): Promise<number> {
    const fullKey = this.getFullKey(key, options?.keyPrefix);
    return this.redis.decrby(fullKey, decrement);
  }

  // 缓存管理
  async clearPattern(pattern: string, options?: CacheOptions): Promise<number> {
    const fullPattern = this.getFullKey(pattern, options?.keyPrefix);
    const keys = await this.redis.keys(fullPattern);

    if (keys.length === 0) return 0;

    return this.redis.del(...keys);
  }

  async clearAll(): Promise<"OK"> {
    return this.redis.flushall();
  }

  async clearDb(): Promise<"OK"> {
    return this.redis.flushdb();
  }

  // 统计信息
  async getStats(): Promise<CacheStats> {
    const info = await this.redis.info("memory");
    const infoLines = info.split("\n");

    let usedMemory = 0;
    let connectedClients = 0;
    let keyspaceHits = 0;
    let keyspaceMisses = 0;

    for (const line of infoLines) {
      if (line.startsWith("used_memory:")) {
        usedMemory = parseInt(line.split(":")[1].trim());
      } else if (line.startsWith("connected_clients:")) {
        connectedClients = parseInt(line.split(":")[1].trim());
      } else if (line.startsWith("keyspace_hits:")) {
        keyspaceHits = parseInt(line.split(":")[1].trim());
      } else if (line.startsWith("keyspace_misses:")) {
        keyspaceMisses = parseInt(line.split(":")[1].trim());
      }
    }

    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate =
      totalRequests > 0 ? (this.stats.hitCount / totalRequests) * 100 : 0;

    return {
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate,
      totalRequests,
      keyspaceHits,
      keyspaceMisses,
      usedMemory,
      connectedClients,
    };
  }

  async resetStats(): Promise<void> {
    this.stats.hitCount = 0;
    this.stats.missCount = 0;
  }

  // 工具方法
  private getFullKey(key: string, customPrefix?: string): string {
    const prefix = customPrefix || this.keyPrefix;
    return `${prefix}${key}`;
  }

  async quit(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      this.logger.debug("Error closing Redis connection:", error);
    }
  }

  // 分布式锁
  async acquireLock(
    key: string,
    value: string,
    ttl: number = 30,
  ): Promise<boolean> {
    const fullKey = this.getFullKey(`lock:${key}`);
    const result = await this.redis.set(fullKey, value, "EX", ttl, "NX");
    return result === "OK";
  }

  async releaseLock(key: string, value: string): Promise<boolean> {
    const fullKey = this.getFullKey(`lock:${key}`);

    // 使用Lua脚本确保原子性
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, fullKey, value);
    return result === 1;
  }

  // 计数器
  async counter(key: string, ttl = 86400): Promise<number> {
    const fullKey = this.getFullKey(`counter:${key}`);

    const script = `
      local current = redis.call("GET", KEYS[1])
      if current == false then
        current = 0
      else
        current = tonumber(current)
      end
      local new = current + 1
      redis.call("SET", KEYS[1], new, "EX", ARGV[1])
      return new
    `;

    return this.redis.eval(script, 1, fullKey, ttl) as Promise<number>;
  }

  // 限流
  async rateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const fullKey = this.getFullKey(`rate_limit:${key}`);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;

    const script = `
      redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, ARGV[1])
      local count = redis.call("ZCARD", KEYS[1])

      if count < tonumber(ARGV[2]) then
        redis.call("ZADD", KEYS[1], ARGV[3], ARGV[3])
        redis.call("EXPIRE", KEYS[1], ARGV[2])
        return {1, tonumber(ARGV[2]) - count - 1, ARGV[3] + ARGV[2]}
      else
        local oldest = redis.call("ZRANGE", KEYS[1], 0, 0, "WITHSCORES")
        return {0, 0, tonumber(oldest[2]) + ARGV[2]}
      end
    `;

    const result = (await this.redis.eval(
      script,
      1,
      fullKey,
      windowStart,
      limit,
      window,
      now,
    )) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
    };
  }
}
