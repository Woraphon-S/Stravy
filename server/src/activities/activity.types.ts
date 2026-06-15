import { ActivityType } from './activity-metrics';

export type Privacy = 'public' | 'followers' | 'private';

export interface ActivityDetailRow {
  id: string;
  user_id: string;
  author_name: string;
  author_photo: string | null;
  type: ActivityType;
  title: string;
  started_at: Date;
  elapsed_seconds: number;
  moving_seconds: number;
  distance_m: number;
  elevation_gain_m: number;
  calories: number;
  avg_speed_mps: number;
  max_speed_mps: number;
  avg_heart_rate: number | null;
  privacy: Privacy;
  created_at: Date;
  kudos_count: string;
  comment_count: string;
  kudoed_by_me: boolean;
}

export interface OwnerPrivacyRow {
  user_id: string;
  privacy: Privacy;
}

export interface TrackPointRow {
  seq: number;
  recorded_at: Date;
  lat: number;
  lng: number;
  elevation_m: number | null;
  heart_rate: number | null;
  speed_mps: number | null;
}

export interface PhotoRow {
  id: string;
  activity_id: string;
  url: string;
  created_at: Date;
}

export interface ActivityAuthor {
  id: string;
  displayName: string;
  photoUrl: string | null;
}

export interface ActivityDetail {
  id: string;
  userId: string;
  author: ActivityAuthor;
  type: ActivityType;
  title: string;
  startedAt: Date;
  elapsedSeconds: number;
  movingSeconds: number;
  distanceM: number;
  elevationGainM: number;
  calories: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  avgHeartRate: number | null;
  privacy: Privacy;
  createdAt: Date;
  kudosCount: number;
  commentCount: number;
  kudoedByMe: boolean;
}

export interface TrackPoint {
  seq: number;
  recordedAt: Date;
  lat: number;
  lng: number;
  elevationM: number | null;
  heartRate: number | null;
  speedMps: number | null;
}

export interface PhotoOut {
  id: string;
  url: string;
  createdAt: Date;
}

export interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
}
