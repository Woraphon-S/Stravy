# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Stravy

Strava-like fitness activity tracking app (running, cycling, walking).

Stack: Expo React Native (mobile) + NestJS (api) + PostgreSQL/PostGIS. Data access is raw SQL via `pg`. No ORM, no query builder.

## Hard rules (always apply)

- No emojis anywhere: text, code, UI labels, commit messages.
- Icons are inline SVG only (`react-native-svg` on mobile). No icon fonts, no emoji glyphs.
- Write code with no comments. Names and structure carry meaning.
- Data access is raw parameterized SQL via `pg`. SQL lives only in `*.repository.ts`.
- The project must run both via Docker Compose and via plain `npm run dev` on localhost.
- GPS tracking is continuous with NO auto-pause. Manual start/pause/resume/stop only.

## Commands

### API (`server/`)

```bash
npm run dev          # NestJS watch mode (development)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled dist/main.js
npm run migrate      # Apply pending SQL migrations (ts-node)
npm run migrate:prod # Apply migrations in production (node)
npm run typecheck    # TypeScript type check only
npm test             # Jest unit + integration tests
```

### Mobile (`mobile/`)

```bash
npm run start    # Start Expo dev server
npm run android  # Run on Android emulator (uses 10.0.2.2:3000 for API)
npm run ios      # Run on iOS simulator
npm run web      # Run in browser
npm run typecheck
```

### Full stack (Docker Compose, from repo root)

```bash
docker compose up --build   # Start PostgreSQL+PostGIS and API together
docker compose down         # Stop and remove containers
```

Environment: copy `.env.example` to `.env` before running locally without Docker. The mobile app reads `EXPO_PUBLIC_API_URL` (defaults to `http://10.0.2.2:3000` for Android emulator).

## Architecture

Monorepo with two apps — `server/` (NestJS API) and `mobile/` (Expo React Native).

### Server

Three-layer per feature module: Controller → Service → Repository.

- **Controller** (`*.controller.ts`): HTTP routing, DTO extraction, calls service.
- **Service** (`*.service.ts`): Business logic, authorization checks, maps DB rows to response shapes via `toSelf()` / `toPublic()` helpers.
- **Repository** (`*.repository.ts`): All SQL lives here. Raw parameterized queries via the `pg` `Pool`. Handles transactions internally.

Feature modules: `auth`, `users`, `activities`, `follows`, `kudos`, `comments`, `feed`. Shared infrastructure: `db` (Pool provider), `storage` (file upload), `config`, `common` (guards, decorators).

Privacy enforcement (public/followers-only/private) is applied inside repository queries, not in service or controller layers.

### Database

PostgreSQL 16 + PostGIS 3.4. Migrations live in `server/db/migrations/*.sql`, applied in filename order. The migration runner tracks applied files in a `_migrations` table and wraps each migration in a transaction.

Key PostGIS columns:
- `activities.route` — `geography(LineString)` built from the uploaded track points.
- `activity_points.location` — `geography(Point)`.

Core tables: `users`, `refresh_tokens`, `activities`, `activity_points`, `activity_photos`, `follows`, `kudos`, `comments`.

### Auth

JWT access + refresh token pair. Access token TTL is 15 min; refresh is 30 days. The refresh token hash is stored in `refresh_tokens`; the raw token is kept only client-side. Mobile auto-retries any 401 with a token refresh before failing.

### Mobile

Root providers in `mobile/src/App.tsx`: `SafeAreaProvider` → `I18nProvider` → `AuthProvider` → `NavigationContainer` → `RootNavigator`.

Navigation:
- Unauthenticated: `AuthNavigator` (Login, Register).
- Authenticated: bottom tabs (Feed, Record, Profile) plus a modal `ActivityDetail` stack.

API calls go through `mobile/src/lib/api.ts` — a single `request()` wrapper that injects Bearer tokens and handles 401 refresh automatically.

Shared types (user shapes, activity, track points, pagination) live in `mobile/src/lib/types.ts`.

Design tokens (colors, spacing, typography) are in `mobile/src/theme/`. All icons are inline SVG components in `mobile/src/icons/`.

See the `stravy` skill for full schema details and design conventions.
