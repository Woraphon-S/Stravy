export type ActivityType = 'run' | 'ride' | 'walk' | 'hike' | 'swim';
export type Privacy = 'public' | 'followers' | 'private';
export type Units = 'metric' | 'imperial';

export interface SelfUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  weightKg: number | null;
  heightCm: number | null;
  units: Units;
  defaultPrivacy: Privacy;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  displayName: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface ActivityAuthor {
  id: string;
  displayName: string;
  photoUrl: string | null;
}

export interface Activity {
  id: string;
  userId: string;
  author: ActivityAuthor;
  type: ActivityType;
  title: string;
  startedAt: string;
  elapsedSeconds: number;
  movingSeconds: number;
  distanceM: number;
  elevationGainM: number;
  calories: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  avgHeartRate: number | null;
  privacy: Privacy;
  createdAt: string;
  kudosCount: number;
  commentCount: number;
  kudoedByMe: boolean;
}

export interface TrackPoint {
  seq: number;
  recordedAt: string;
  lat: number;
  lng: number;
  elevationM: number | null;
  heartRate: number | null;
  speedMps: number | null;
}

export interface Comment {
  id: string;
  activityId: string;
  author: ActivityAuthor;
  body: string;
  createdAt: string;
}

export interface AuthResult {
  user: SelfUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface NewActivityPoint {
  lat: number;
  lng: number;
  recordedAt: string;
  elevationM?: number | null;
  speedMps?: number | null;
}

export interface NewActivity {
  type: ActivityType;
  title?: string;
  startedAt: string;
  elapsedSeconds: number;
  movingSeconds: number;
  privacy?: Privacy;
  points: NewActivityPoint[];
}
