# Tigshop AI Contribution Guide

## Repository layout
- `nest/` hosts the active NestJS + Prisma backend; `php/` keeps the legacy ThinkPHP implementation used as parity reference during migration work.
- Within `nest/src/`, modules are grouped by business domain (e.g. `order/`, `product/`, `panel/`, `auth/`). Shared utilities live under `common/`, Prisma access helpers under `prisma/`, and DTO/types under `types/`.
- Database schema, seeds, and migrations are in `nest/prisma/`. Table names mostly mirror the existing MySQL schema (snake_case); dont rename them in code.

## Build & verification flow
- Use the package scripts from `nest/package.json`. `pnpm lint` (or `npm run lint`) auto-fixes style; `pnpm test` runs Jest specs; `pnpm build` outputs `dist/`.
- Prisma helpers: `pnpm db:init` pushes the schema, `pnpm db:seed` populates demo data. Running `pnpm start:all` will re-seed, so avoid repeating it on a populated database.
- Local dev server: `pnpm start:dev` (port comes from `Config.PORT`, default `3001`) and Swagger is available at `/api-docs`.
- Redis is optional for most features, but `src/main.ts` will attempt to connect a Redis microservice using `REDIS_HOST/PORT/PASSWORD`. Stub or disable it in tests if you do not have Redis.

## Coding patterns to follow
- Always access the database through the injected `PrismaService` (`src/prisma/prisma.service.ts`). It extends `PrismaClient` and exposes snake_case models (e.g. `this.prisma.order_item`). Never instantiate a fresh `PrismaClient`.
- Complex reporting endpoints often rely on raw SQL with `Prisma.sql`/`$queryRaw` (see `statistics/sales-statistics.service.ts`). Prefer that pattern when Prisma cant express groupings because MySQL table names contain reserved words (e.g. backtick-quoted `order`).
- Admin controllers (such as `panel/panel.controller.ts`) chain `@UseGuards(AdminJwtAuthGuard, AuthorityGuard)` and the custom `@Authorities()` decorator. New admin endpoints must include the correct authority string, otherwise the UI will receive `403`.
- API responses are standardized by interceptors to `{ code, message, data, timestamp }`. Return plain objects that match this schema or reuse the helper methods in existing services.
- When mirroring PHP behavior, consult the equivalent ThinkPHP service (same relative path under `php/app/`). Match query parameters, pagination defaults, and export flags to keep the front-end contract intact.

## Key integration details
- Static assets: `src/main.ts` serves `/uploads/**` from the repos `uploads/` directory and `/` from `static/`. Keep those paths when adding upload features.
- Configuration is minimal: copy `.env.example` and set `DATABASE_URL`, Redis credentials, and JWT secrets. `Config.PORT` (in `src/config.ts`) drives Nests listen port and Swagger server info.
- Authentication uses JWT. Admin APIs expect `req.user.userId` populated by `AdminJwtAuthGuard` and shop scoping resolves through `PanelService.getUserShopId()`.
- Prisma schema models reference many `vendor_*`, `order_*`, and promotion tables. Before altering a table, review existing raw queries to avoid breaking implicit column names.

## Productivity tips
- Before editing statistics or reporting flows, inspect both Nest services and their PHP counterparts to understand required filters (date range handling, shop scoping, export toggles).
- Large DTOs live in each modules `dto/` folder. Use `class-transformer` + `class-validator` decorators consistent with nearby DTOs to integrate with the global `ValidationPipe` (whitelists unexpected fields).
- Tests live beside features (`*.spec.ts`). Mock Prisma by stubbing methods on the injected service rather than importing the real client, matching the approach in `product/__tests__/`.
- When adding microservice handlers, register them through the Redis transport already bootstrapped in `main.ts` and keep patterns consistent with existing message names under `src/microservices/`.

Let us know if any area feels underspecified so we can expand these notes.
