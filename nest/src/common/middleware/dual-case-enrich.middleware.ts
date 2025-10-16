import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

function isPlainObject(value: any): boolean {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

// snake_case -> camelCase
function toCamel(str: string) {
  return str.replace(/_([a-zA-Z0-9])/g, (_, g1) => g1.toUpperCase());
}

// camelCase -> snake_case
function toSnake(str: string) {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/__/g, "_")
    .toLowerCase();
}

function enrich(obj: any, depth = 0, maxDepth = 6) {
  if (!isPlainObject(obj) || depth > maxDepth) return;
  const keys = Object.keys(obj);
  for (const key of keys) {
    const val = obj[key];
    const camel = toCamel(key);
    const snake = toSnake(key);
    if (camel && !(camel in obj)) obj[camel] = val;
    if (snake && !(snake in obj)) obj[snake] = val;
    if (isPlainObject(val)) {
      enrich(val, depth + 1, maxDepth);
    } else if (Array.isArray(val)) {
      for (const item of val) enrich(item, depth + 1, maxDepth);
    }
  }
}

@Injectable()
export class DualCaseEnrichMiddleware implements NestMiddleware {
  use(req: Request & any, _res: Response, next: NextFunction) {
    try {
      if (isPlainObject(req.body)) enrich(req.body);
      if (isPlainObject(req.query)) enrich(req.query);
      if (isPlainObject(req.params)) enrich(req.params);
    } catch {
      // ignore
    }
    next();
  }
}
