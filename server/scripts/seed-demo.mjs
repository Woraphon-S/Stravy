import bcrypt from 'bcryptjs';
import pg from 'pg';

const API = process.env.SEED_API_URL ?? 'http://localhost:3000/api';
const DB = {
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  user: process.env.DATABASE_USER ?? 'stravy',
  password: process.env.DATABASE_PASSWORD ?? 'stravy',
  database: process.env.DATABASE_NAME ?? 'stravy',
};

const PASSWORD = 'stravydemo';
const EARTH = 6371000;
const rad = (d) => (d * Math.PI) / 180;

function haversine(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bearingTo(aLat, aLng, bLat, bLng) {
  const y = Math.sin(rad(bLng - aLng)) * Math.cos(rad(bLat));
  const x =
    Math.cos(rad(aLat)) * Math.sin(rad(bLat)) -
    Math.sin(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(bLng - aLng));
  return Math.atan2(y, x);
}

function blendAngle(a, b, f) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * f;
}

const BASES = [
  { lat: 13.7305, lng: 100.5418 },
  { lat: 13.724, lng: 100.56 },
  { lat: 13.816, lng: 100.553 },
  { lat: 13.7466, lng: 100.5347 },
];

function genTrack(targetM, speedMps, startMs, intervalSec) {
  const base = BASES[Math.floor(Math.random() * BASES.length)];
  let lat = base.lat + (Math.random() - 0.5) * 0.002;
  let lng = base.lng + (Math.random() - 0.5) * 0.002;
  let bearing = Math.random() * 2 * Math.PI;
  let dist = 0;
  let t = startMs;
  const elevBase = 4 + Math.random() * 30;
  const points = [{ lat, lng, recordedAt: new Date(t).toISOString(), elevationM: round(elevBase, 1), speedMps: 0 }];

  while (dist < targetM && points.length < 6000) {
    const progress = dist / targetM;
    bearing += (Math.random() - 0.5) * 0.6;
    if (progress > 0.55) {
      const home = bearingTo(lat, lng, base.lat, base.lng);
      bearing = blendAngle(bearing, home, Math.min(0.5, (progress - 0.55) * 0.7));
    }
    const step = speedMps * intervalSec * (0.8 + Math.random() * 0.4);
    const dN = step * Math.cos(bearing);
    const dE = step * Math.sin(bearing);
    let nlat = lat + dN / 111320;
    let nlng = lng + dE / (111320 * Math.cos(rad(lat)));
    nlat += (Math.random() - 0.5) * 0.00002;
    nlng += (Math.random() - 0.5) * 0.00002;
    const d = haversine(lat, lng, nlat, nlng);
    dist += d;
    lat = nlat;
    lng = nlng;
    t += intervalSec * 1000;
    const elev = elevBase + Math.sin(progress * Math.PI * 2) * 6 + (Math.random() - 0.5) * 2;
    points.push({
      lat: round(lat, 6),
      lng: round(lng, 6),
      recordedAt: new Date(t).toISOString(),
      elevationM: round(elev, 1),
      speedMps: round(d / intervalSec, 2),
    });
  }
  return points;
}

function round(n, p) {
  const f = 10 ** p;
  return Math.round(n * f) / f;
}

async function api(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function ensureUser(client, email, displayName) {
  const found = await client.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
  if (found.rows[0]) {
    const hash = bcrypt.hashSync(PASSWORD, 10);
    await client.query('UPDATE users SET password_hash = $1, display_name = $2 WHERE id = $3', [
      hash,
      displayName,
      found.rows[0].id,
    ]);
    return found.rows[0].id;
  }
  const created = await api(null, 'POST', '/auth/register', { email, password: PASSWORD, displayName });
  return created.user.id;
}

async function login(email) {
  const result = await api(null, 'POST', '/auth/login', { email, password: PASSWORD });
  return result.accessToken;
}

async function clearActivities(token, userId) {
  let removed = 0;
  for (;;) {
    const page = await api(token, 'GET', `/activities?userId=${userId}&limit=50`);
    if (!page.items.length) break;
    for (const item of page.items) {
      await api(token, 'DELETE', `/activities/${item.id}`);
      removed += 1;
    }
  }
  return removed;
}

const SPEEDS = {
  run: () => 2.6 + Math.random() * 0.7,
  ride: () => 6.5 + Math.random() * 2.2,
  walk: () => 1.2 + Math.random() * 0.35,
};

async function createActivity(token, def, now) {
  const speed = SPEEDS[def.type]();
  const startMs = now - def.daysAgo * 86400000 + def.hour * 3600000;
  const targetM = def.km * 1000;
  const intervalSec = Math.max(3, Math.round(targetM / speed / 180));
  const points = genTrack(targetM, speed, startMs, intervalSec);
  const movingSeconds = (points.length - 1) * intervalSec;
  const elapsedSeconds = movingSeconds + Math.floor(30 + Math.random() * 150);
  const activity = await api(token, 'POST', '/activities', {
    type: def.type,
    title: def.title,
    startedAt: new Date(startMs).toISOString(),
    elapsedSeconds,
    movingSeconds,
    privacy: 'public',
    points,
  });
  return activity.id;
}

const DEMO_ACTS = [
  { type: 'run', km: 6.2, daysAgo: 18, hour: 6, title: 'Morning run' },
  { type: 'ride', km: 28, daysAgo: 15, hour: 7, title: 'Riverside loop' },
  { type: 'walk', km: 2.8, daysAgo: 13, hour: 18, title: 'Evening walk' },
  { type: 'run', km: 8.5, daysAgo: 10, hour: 6, title: 'Tempo run' },
  { type: 'ride', km: 42, daysAgo: 7, hour: 6, title: 'Weekend long ride' },
  { type: 'run', km: 5.0, daysAgo: 4, hour: 18, title: 'Easy 5K' },
  { type: 'walk', km: 3.5, daysAgo: 2, hour: 19, title: 'Park stroll' },
  { type: 'run', km: 10.2, daysAgo: 1, hour: 6, title: 'Sunday long run' },
];

const ALEX_ACTS = [
  { type: 'ride', km: 35, daysAgo: 16, hour: 7, title: 'Hill repeats' },
  { type: 'run', km: 7.0, daysAgo: 12, hour: 6, title: 'Threshold run' },
  { type: 'ride', km: 22, daysAgo: 9, hour: 17, title: 'Commute home' },
  { type: 'run', km: 5.5, daysAgo: 5, hour: 6, title: 'Recovery jog' },
  { type: 'run', km: 12.0, daysAgo: 3, hour: 6, title: 'Long run' },
];

const COMMENTS = [
  'Strong pace.',
  'Nice route.',
  'Great effort.',
  'Looking fast lately.',
  'Beautiful morning for it.',
  'Solid session.',
];

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const client = new pg.Client(DB);
  await client.connect();

  console.log('resetting passwords...');
  const demoId = await ensureUser(client, 'demo@stravy.app', 'Demo Athlete');
  const alexId = await ensureUser(client, 'alex@stravy.app', 'Alex Carter');
  await client.end();

  const demoToken = await login('demo@stravy.app');
  const alexToken = await login('alex@stravy.app');

  console.log('clearing old activities...');
  console.log('  demo removed', await clearActivities(demoToken, demoId));
  console.log('  alex removed', await clearActivities(alexToken, alexId));

  const now = Date.now();

  console.log('creating activities...');
  const demoIds = [];
  for (const def of [...DEMO_ACTS].reverse()) demoIds.push(await createActivity(demoToken, def, now));
  const alexIds = [];
  for (const def of [...ALEX_ACTS].reverse()) alexIds.push(await createActivity(alexToken, def, now));
  console.log('  demo', demoIds.length, 'alex', alexIds.length);

  console.log('following...');
  await api(demoToken, 'POST', `/users/${alexId}/follow`).catch(() => {});
  await api(alexToken, 'POST', `/users/${demoId}/follow`).catch(() => {});

  console.log('kudos and comments...');
  for (const id of demoIds.slice(0, 6)) {
    await api(alexToken, 'POST', `/activities/${id}/kudos`).catch(() => {});
  }
  for (const id of demoIds.slice(0, 3)) {
    await api(alexToken, 'POST', `/activities/${id}/comments`, { body: sample(COMMENTS) }).catch(() => {});
  }
  for (const id of alexIds.slice(0, 4)) {
    await api(demoToken, 'POST', `/activities/${id}/kudos`).catch(() => {});
  }
  for (const id of alexIds.slice(0, 2)) {
    await api(demoToken, 'POST', `/activities/${id}/comments`, { body: sample(COMMENTS) }).catch(() => {});
  }

  console.log('done. login: demo@stravy.app / alex@stravy.app  password:', PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
