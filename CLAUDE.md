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

See the `stravy` skill for full architecture, repo structure, schema, and design conventions.
