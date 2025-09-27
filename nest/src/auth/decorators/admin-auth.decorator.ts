// @ts-nocheck
import { SetMetadata } from '@nestjs/common';

export const ADMIN_AUTH_KEY = 'admin-auth';
export const AdminAuth = () => SetMetadata(ADMIN_AUTH_KEY, true);