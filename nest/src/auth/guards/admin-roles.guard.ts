// @ts-nocheck
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { ADMIN_AUTH_KEY } from '../decorators/admin-auth.decorator';

@Injectable()
export class AdminRolesGuard extends AdminJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route requires admin authentication
    const isAdminAuth = this.reflector.get<boolean>(
      ADMIN_AUTH_KEY,
      context.getHandler(),
    );

    if (!isAdminAuth) {
      // If not marked as admin auth, allow normal JWT authentication
      return true;
    }

    // First, check if the parent JWT guard passes
    const parentCanActivate = await super.canActivate(context);
    if (!parentCanActivate) {
      return false;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();

    // Check if user has admin role
    const user = request.user;
    if (!user || user.role !== 'admin') {
      return false;
    }

    return true;
  }
}