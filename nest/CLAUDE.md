# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based Order Management System (OMS) for e-commerce, built with **Prisma** as the primary ORM (TypeORM has been completely removed). The system supports user management, product catalog, orders, payments, coupons, and various promotional features.

## Development Commands

### Database Operations
```bash
# Initialize database schema
npm run db:init

# Seed database with dummy data
npm run db:seed

# Full setup (build + init + seed)
npm run start:all
```

### Development
```bash
# Install dependencies
npm install

# Build project
npm run build

# Start development server with watch mode
npm run start:dev

# Start production server
npm run start:prod

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture

### Core Structure
- **ORM**: Prisma (MySQL database)
- **Authentication**: JWT-based with guards
- **API Documentation**: Swagger at `http://localhost:3000/api-docs`
- **Microservices**: Redis-based messaging support
- **Validation**: Class-validator with global pipes
- **Response Format**: Standardized via global interceptors

### Module Organization
The project follows domain-driven design with modules in `src/`:
- `api/` - Public API endpoints
- `admin/` - Admin management functionality
- `auth/` - Authentication and authorization
- `user/` - User management and profiles
- `product/` - Product catalog and SKU management
- `order/` - Order processing and management
- `payment/` - Payment processing
- `finance/` - Financial operations (refunds, invoices)
- `promotion/` - Coupons, discounts, and marketing
- `content/` - CMS functionality (articles, categories)
- `common/` - Shared utilities and interceptors

### Key Services
- **PrismaService**: Database access through Prisma Client
- **ConfigService**: Configuration management from environment variables
- **ResponseInterceptor**: Standardizes API responses with `{code: 0, data, message: "success"}`
- **JWT Guards**: Authentication and role-based access control

### Database Schema
The Prisma schema includes extensive models for:
- User management with referral system
- Product catalog with variants and inventory
- Order processing with payment tracking
- Promotional campaigns (coupons, seckill, group buying)
- Financial operations (refunds, balance logs)
- Content management (articles, categories)

## Important Notes

### Configuration
- Database connection configured via `DATABASE_URL` environment variable
- Redis support for caching and microservices messaging
- JWT secret key configuration required for authentication

### Response Format
All API responses are standardized:
```typescript
{
  code: 0,
  data: any,
  message: "success",
  timestamp: string
}
```

### Authentication
- JWT-based authentication with `@Auth()` and `@Roles()` decorators
- Global JWT guards can be enabled in `app.module.ts` (currently disabled for testing)

### File Uploads
- Static file serving from `uploads/` directory at `/uploads/` prefix
- Support for product images and other file uploads

### Microservices
- Redis-based microservice support for distributed processing
- Message patterns for order processing, notifications, and other async operations

## Environment Setup

1. Copy `.env` file and configure database connection
2. Run `npm install` to install dependencies
3. Use `npm run start:all` for complete setup with dummy data
4. Access Swagger docs at `http://localhost:3000/api-docs` for API testing

## Common Issues

- **Database**: Ensure MySQL is running and `DATABASE_URL` is correctly configured
- **Redis**: Required for microservices functionality (optional for basic operation)
- **Port**: Default server runs on port 3000 (configurable via `PORT` env var)
- **Build**: Use `npm run build` before production deployment