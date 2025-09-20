# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/` (NestJS modules by domain: e.g., `src/order`, `src/product`, `src/user`). Common utilities in `src/common` and configuration in `src/config.ts`.
- Database: Prisma schema and seeds in `prisma/` (`schema.prisma`, `seed.ts`). Build output in `dist/`.
- Docs and assets: `docs/`, SSL/payment certs in `cert/`, uploads served from `uploads/` (mounted at `/uploads/`).

## Build, Test, and Development Commands
- `npm run start:dev` — start Nest in watch mode (HTTP on port 3001; Swagger at `/api-docs`).
- `npm run build` — compile TypeScript to `dist/`.
- `npm run start:prod` — run compiled app (`node dist/main`).
- `npm run db:init` — apply Prisma schema to the DB; `npm run db:seed` — seed data (idempotency not guaranteed).
- `npm run start:all` — init DB, build, seed, then start dev. Avoid running repeatedly to prevent duplicate seeds.
- `npm run lint` / `npm run format` — ESLint (with fix) and Prettier.
- `npm test` / `npm run test:watch` / `npm run test:cov` — Jest unit tests and coverage (reports in `coverage/`).

## Coding Style & Naming Conventions
- TypeScript, 2-space indent; prefer single quotes; always use semicolons.
- Files/dirs: kebab-case (e.g., `user-profile.service.ts`). Nest files: `*.module.ts`, `*.controller.ts`, `*.service.ts`; DTOs: `*.dto.ts`.
- Classes `PascalCase`, variables/functions `camelCase`, constants/env keys `UPPER_SNAKE_CASE`.
- Use Prettier and ESLint before committing: `npm run format && npm run lint`.

## Testing Guidelines
- Framework: Jest. Test files `*.spec.ts` or under `__tests__/` (e.g., `src/user/__tests__/user.service.spec.ts`).
- Write unit tests per module; mock I/O and external services (Redis/DB) where possible.
- Target ≥80% coverage locally: `npm run test:cov`.

## Commit & Pull Request Guidelines
- History is terse/informal; prefer Conventional Commits going forward: `feat: add referral stats API`, `fix(order): correct status mapping`.
- PRs should include: purpose and scope, linked issues, screenshots or sample requests when API behavior changes, and testing notes.
- Before opening a PR, run: `npm run format && npm run lint && npm test` and ensure Swagger builds locally.

## Security & Configuration Tips
- Copy `.env.example` to `.env`. Prisma provider in `prisma/schema.prisma` is `mysql`; set `DATABASE_URL` accordingly. Configure Redis via `REDIS_HOST/PORT/PASSWORD`.
- Do not commit secrets or certs; keep `cert/` paths referenced by env vars (see `.env.example`).
