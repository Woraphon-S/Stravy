import {
  ActivityDetail,
  ActivityDetailRow,
  PhotoOut,
  PhotoRow,
  TrackPoint,
  TrackPointRow,
} from './activity.types';

export function mapActivityDetail(row: ActivityDetailRow): ActivityDetail {
  return {
    id: row.id,
    userId: row.user_id,
    author: { id: row.user_id, displayName: row.author_name, photoUrl: row.author_photo },
    type: row.type,
    title: row.title,
    startedAt: row.started_at,
    elapsedSeconds: row.elapsed_seconds,
    movingSeconds: row.moving_seconds,
    distanceM: Number(row.distance_m),
    elevationGainM: Number(row.elevation_gain_m),
    calories: Number(row.calories),
    avgSpeedMps: Number(row.avg_speed_mps),
    maxSpeedMps: Number(row.max_speed_mps),
    avgHeartRate: row.avg_heart_rate,
    privacy: row.privacy,
    createdAt: row.created_at,
    kudosCount: Number(row.kudos_count),
    commentCount: Number(row.comment_count),
    kudoedByMe: row.kudoed_by_me,
  };
}

export function mapTrackPoint(row: TrackPointRow): TrackPoint {
  return {
    seq: row.seq,
    recordedAt: row.recorded_at,
    lat: Number(row.lat),
    lng: Number(row.lng),
    elevationM: row.elevation_m === null ? null : Number(row.elevation_m),
    heartRate: row.heart_rate,
    speedMps: row.speed_mps === null ? null : Number(row.speed_mps),
  };
}

export function mapPhoto(row: PhotoRow): PhotoOut {
  return { id: row.id, url: row.url, createdAt: row.created_at };
}
