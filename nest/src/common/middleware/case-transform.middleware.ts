import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { camelCase } from '../utils/camel-case.util';

function isPlainObject(value: any): boolean {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

@Injectable()
export class CaseTransformMiddleware implements NestMiddleware {
  use(req: Request & any, _res: Response, next: NextFunction) {
    try {
      if (req && isPlainObject(req.body)) {
        req.body = camelCase(req.body, false);
      }
      if (req && isPlainObject(req.query)) {
        req.query = camelCase(req.query, false);
      }
      if (req && isPlainObject(req.params)) {
        req.params = camelCase(req.params, false);
      }
    } catch (_e) {
      // ignore transform errors, pass-through
    }
    next();
  }
}

