CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  password_hash   text NOT NULL,
  display_name    text NOT NULL,
  photo_url       text,
  weight_kg       numeric(5,2),
  height_cm       numeric(5,1),
  units           text NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  default_privacy text NOT NULL DEFAULT 'public' CHECK (default_privacy IN ('public', 'followers', 'private')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE UNIQUE INDEX refresh_tokens_hash_idx ON refresh_tokens (token_hash);

CREATE TABLE activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              text NOT NULL CHECK (type IN ('run', 'ride', 'walk', 'hike', 'swim')),
  title             text NOT NULL,
  started_at        timestamptz NOT NULL,
  elapsed_seconds   integer NOT NULL DEFAULT 0 CHECK (elapsed_seconds >= 0),
  moving_seconds    integer NOT NULL DEFAULT 0 CHECK (moving_seconds >= 0),
  distance_m        double precision NOT NULL DEFAULT 0 CHECK (distance_m >= 0),
  elevation_gain_m  double precision NOT NULL DEFAULT 0 CHECK (elevation_gain_m >= 0),
  calories          double precision NOT NULL DEFAULT 0 CHECK (calories >= 0),
  avg_speed_mps     double precision NOT NULL DEFAULT 0 CHECK (avg_speed_mps >= 0),
  max_speed_mps     double precision NOT NULL DEFAULT 0 CHECK (max_speed_mps >= 0),
  avg_heart_rate    integer,
  route             geography(LineString, 4326),
  privacy           text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_user_id_started_at_idx ON activities (user_id, started_at DESC);
CREATE INDEX activities_started_at_idx ON activities (started_at DESC);
CREATE INDEX activities_route_idx ON activities USING GIST (route);

CREATE TRIGGER activities_set_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE activity_points (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activity_id  uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  seq          integer NOT NULL,
  recorded_at  timestamptz NOT NULL,
  location     geography(Point, 4326) NOT NULL,
  elevation_m  double precision,
  heart_rate   integer,
  speed_mps    double precision
);

CREATE UNIQUE INDEX activity_points_activity_seq_idx ON activity_points (activity_id, seq);
CREATE INDEX activity_points_location_idx ON activity_points USING GIST (location);

CREATE TABLE activity_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  url          text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_photos_activity_id_idx ON activity_photos (activity_id);

CREATE TABLE follows (
  follower_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE INDEX follows_followee_id_idx ON follows (followee_id);

CREATE TABLE kudos (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id  uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_id)
);

CREATE INDEX kudos_activity_id_idx ON kudos (activity_id);

CREATE TABLE comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_activity_id_created_at_idx ON comments (activity_id, created_at);
