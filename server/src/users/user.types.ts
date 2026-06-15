export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  photo_url: string | null;
  weight_kg: string | null;
  height_cm: string | null;
  units: 'metric' | 'imperial';
  default_privacy: 'public' | 'followers' | 'private';
  created_at: Date;
  updated_at: Date;
}

export interface SelfUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  weightKg: number | null;
  heightCm: number | null;
  units: 'metric' | 'imperial';
  defaultPrivacy: 'public' | 'followers' | 'private';
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  displayName: string;
  photoUrl: string | null;
  createdAt: Date;
}
