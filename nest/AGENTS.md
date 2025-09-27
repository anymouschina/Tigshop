# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/`, organized by NestJS domain modules (`order`, `product`, `user`, etc.); shared utilities sit in `src/common`, and configuration defaults in `src/config.ts`.
- Database schema and seeds stay under `prisma/` (`schema.prisma`, `seed.ts`), while compiled output is generated in `dist/`.
- Documentation and supporting assets live in `docs/`; SSL or payment certificates reside in `cert/`; user uploads are served from `uploads/` and exposed at `/uploads/`.

## Build, Test, and Development Commands
- `npm run start:dev`: launch the Nest server in watch mode on port `3001` with Swagger at `/api-docs`.
- `npm run build`: compile TypeScript into the `dist/` folder for production deploys.
- `npm run start:prod`: execute the compiled app via `node dist/main`.
- `npm run db:init` / `npm run db:seed`: apply the Prisma schema and seed demo data; avoid repeated `start:all` runs to prevent duplicate records.
- `npm run lint` / `npm run format`: run ESLint (with auto-fix) and Prettier to enforce style.
- `npm test`, `npm run test:watch`, `npm run test:cov`: execute unit tests, watch mode, and coverage (reports in `coverage/`).

## Coding Style & Naming Conventions
- Language: TypeScript with 2-space indentation, single quotes, and required semicolons.
- Filenames use kebab-case (e.g., `user-profile.service.ts`); modules, controllers, and services follow Nest naming (`*.module.ts`, `*.controller.ts`, `*.service.ts`), and DTOs end with `*.dto.ts`.
- Run `npm run format && npm run lint` before submitting changes.

## Testing Guidelines
- Jest is the default test runner; locate specs alongside code using `*.spec.ts` or under `__tests__/`.
- Target ≥80% coverage locally via `npm run test:cov`; mock external dependencies (database, Redis, external APIs) to keep tests deterministic.
- Structure tests to mirror module boundaries (service, controller, repository) and prefer factories/fixtures for complex data.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix(order):`, `chore:`) consistent with recent history.
- PRs should describe purpose and scope, reference related issues, include screenshots or sample API requests when behavior changes, and list validation steps run locally (`npm run format`, `npm run lint`, `npm test`).

## Security & Configuration Tips
- Copy `.env.example` to `.env`, setting `DATABASE_URL` for MySQL and Redis credentials (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).
- Keep secrets and certificates out of version control; reference entries in `cert/` through environment variables.
- Validate Prisma migrations in a staging database before promoting to production, and monitor seeded data to avoid duplication.
