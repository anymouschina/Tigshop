// @ts-nocheck
// Simple User model used for examples and tests; not bound to Prisma types.
export class User {
  userId?: number;
  name: string;
  email: string;
  password: string;
  address: string;
  ref?: string; // 引荐码，用于记录用户是被谁引荐的
}
