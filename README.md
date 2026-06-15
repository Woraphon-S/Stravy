# Stravy

A Strava-like fitness activity tracking app. Record running, cycling, and walking activities with continuous GPS, view them on a map with pace and elevation charts, and follow other athletes.

- Mobile: Expo React Native (TypeScript)
- API: NestJS (TypeScript), raw SQL via `pg` (no ORM)
- Database: PostgreSQL + PostGIS

## Layout

```
mobile/           Expo React Native app
server/           NestJS API
server/db/        SQL migrations (raw SQL, applied by npm run migrate)
uploads/          local file storage in development
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL + PostGIS)
- Android Studio (for the Android emulator) or a physical Android phone with Expo Go

## 1. Start the database

```
cp .env.example .env
docker compose up -d postgres
```

## 2. Run the API

Local development (recommended while building):

```
cd server
npm install
npm run migrate
npm run dev
```

The API listens on http://localhost:3000. Health check: `GET /health`.

Full Docker (API + database together):

```
docker compose up --build
```

## 3. Run the mobile app

```
cd mobile
npm install
npm run start
```

Then press `a` to open the Android emulator, or scan the QR code with Expo Go on a physical phone.

### Reaching the API from a device

A physical phone (and some emulator setups) cannot reach the PC's `localhost`. Set the API base URL for the app via an environment variable before `npm run start`:

```
# Android emulator (AVD) reaches the host at 10.0.2.2
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npm run start

# Physical phone on the same Wi-Fi: use the PC LAN IP
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000 npm run start
```

If unset, the app defaults to `http://10.0.2.2:3000`.

## Testing

```
cd server
npm test          # unit tests
npm run typecheck # tsc, no emit

cd ../mobile
npm run typecheck
```

## Notes on scope

- Phase 1 (this foundation): accounts, activity tracking, activity detail.
- Phase 2: social feed, follow, kudos, comments.
- Phase 3: segments, leaderboards, challenges, stats.

GPS background tracking requires a development build (not Expo Go). Early UI work runs fine in Expo Go.
