# Stravy API

Base URL: `http://localhost:3000/api`. All routes except auth and health require `Authorization: Bearer <accessToken>`.

## Health

- `GET /health` — service and database status (not under `/api`).

## Auth

- `POST /auth/register` — body `{ email, password, displayName }` -> `{ user, accessToken, refreshToken, expiresIn }`.
- `POST /auth/login` — body `{ email, password }` -> same shape.
- `POST /auth/refresh` — body `{ refreshToken }` -> rotates and returns a new pair.
- `POST /auth/logout` — body `{ refreshToken }` -> revokes the token (204).

## Users

- `GET /users/me` — current profile.
- `PATCH /users/me` — body any of `{ displayName, photoUrl, weightKg, heightCm, units, defaultPrivacy }`.
- `GET /users/search?q=` — search by name or email.
- `GET /users/:id` — public profile.

## Activities

- `POST /activities` — body `{ type, title?, startedAt, elapsedSeconds, movingSeconds, avgHeartRate?, privacy?, points[] }`. Distance, elevation, speed, and calories are computed server-side from `points`.
- `GET /activities?userId=&before=&limit=` — list a user's activities (defaults to self), privacy-filtered.
- `GET /activities/:id` — detail with kudos and comment counts.
- `PATCH /activities/:id` — body `{ title?, privacy? }` (owner only).
- `DELETE /activities/:id` — owner only (204).
- `GET /activities/:id/points` — ordered track points.
- `GET /activities/:id/gpx` — GPX export (`application/gpx+xml`).
- `POST /activities/:id/photos` — multipart `file` (owner only).
- `GET /activities/:id/photos` — list photos.

## Social

- `POST /users/:id/follow`, `DELETE /users/:id/follow`.
- `GET /users/:id/followers`, `GET /users/:id/following`.
- `POST /activities/:id/kudos`, `DELETE /activities/:id/kudos`, `GET /activities/:id/kudos`.
- `POST /activities/:id/comments` — body `{ body }`.
- `GET /activities/:id/comments`.
- `DELETE /comments/:id` — comment author or activity owner (204).

## Feed

- `GET /feed?before=&limit=` — activities from followed athletes and yourself, privacy-aware, newest first.

## Privacy rules

- `public` — visible to anyone authenticated.
- `followers` — visible to the owner and their followers.
- `private` — visible only to the owner.
