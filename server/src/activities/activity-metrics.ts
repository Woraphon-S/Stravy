export interface MetricPoint {
  lat: number;
  lng: number;
  elevationM?: number | null;
  speedMps?: number | null;
  recordedAt: string | Date;
}

export interface TrackMetrics {
  distanceM: number;
  elevationGainM: number;
  maxSpeedMps: number;
}

export type ActivityType = 'run' | 'ride' | 'walk' | 'hike' | 'swim';

const EARTH_RADIUS_M = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

function toMillis(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function computeTrackMetrics(points: MetricPoint[]): TrackMetrics {
  let distanceM = 0;
  let elevationGainM = 0;
  let maxSpeedMps = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segment = haversineMeters(prev.lat, prev.lng, curr.lat, curr.lng);
    distanceM += segment;

    if (
      prev.elevationM !== null &&
      prev.elevationM !== undefined &&
      curr.elevationM !== null &&
      curr.elevationM !== undefined
    ) {
      const rise = curr.elevationM - prev.elevationM;
      if (rise > 0) elevationGainM += rise;
    }

    let speed = curr.speedMps ?? null;
    if (speed === null) {
      const seconds = (toMillis(curr.recordedAt) - toMillis(prev.recordedAt)) / 1000;
      speed = seconds > 0 ? segment / seconds : 0;
    }
    if (speed > maxSpeedMps) maxSpeedMps = speed;
  }

  return { distanceM, elevationGainM, maxSpeedMps };
}

export function averageSpeedMps(distanceM: number, movingSeconds: number): number {
  return movingSeconds > 0 ? distanceM / movingSeconds : 0;
}

function metForActivity(type: ActivityType, speedMps: number): number {
  const kmh = speedMps * 3.6;
  switch (type) {
    case 'run':
      if (kmh <= 8) return 8;
      if (kmh <= 11) return 10;
      if (kmh <= 14) return 12;
      return 14;
    case 'ride':
      if (kmh <= 16) return 4;
      if (kmh <= 20) return 6;
      if (kmh <= 26) return 8;
      return 10;
    case 'walk':
      if (kmh <= 4) return 2.8;
      if (kmh <= 6) return 3.5;
      return 5;
    case 'hike':
      return 6;
    case 'swim':
      return 7;
    default:
      return 5;
  }
}

export function estimateCalories(
  type: ActivityType,
  speedMps: number,
  durationSeconds: number,
  weightKg: number | null,
): number {
  const met = metForActivity(type, speedMps);
  const hours = durationSeconds / 3600;
  const weight = weightKg && weightKg > 0 ? weightKg : 70;
  return met * weight * hours;
}

const TYPE_LABEL: Record<ActivityType, string> = {
  run: 'Run',
  ride: 'Ride',
  walk: 'Walk',
  hike: 'Hike',
  swim: 'Swim',
};

export function defaultTitle(type: ActivityType, startedAt: string | Date): string {
  const hour = new Date(toMillis(startedAt)).getHours();
  let part = 'Evening';
  if (hour < 5) part = 'Night';
  else if (hour < 12) part = 'Morning';
  else if (hour < 17) part = 'Afternoon';
  return `${part} ${TYPE_LABEL[type]}`;
}
