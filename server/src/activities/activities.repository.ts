import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../db/database.service';
import { ActivityType } from './activity-metrics';
import { Cursor } from './cursor';
import {
  ActivityDetailRow,
  OwnerPrivacyRow,
  PhotoRow,
  Privacy,
  TrackPointRow,
} from './activity.types';

export interface PointInput {
  lat: number;
  lng: number;
  recordedAt: string;
  elevationM?: number | null;
  heartRate?: number | null;
  speedMps?: number | null;
}

export interface CreateActivityInput {
  userId: string;
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
  points: PointInput[];
}

const DETAIL_COLUMNS = `
  a.id, a.user_id, u.display_name AS author_name, u.photo_url AS author_photo,
  a.type, a.title, a.started_at, a.elapsed_seconds, a.moving_seconds, a.distance_m,
  a.elevation_gain_m, a.calories, a.avg_speed_mps, a.max_speed_mps, a.avg_heart_rate,
  a.privacy, a.created_at,
  (SELECT count(*) FROM kudos k WHERE k.activity_id = a.id) AS kudos_count,
  (SELECT count(*) FROM comments c WHERE c.activity_id = a.id) AS comment_count,
  EXISTS(SELECT 1 FROM kudos k WHERE k.activity_id = a.id AND k.user_id = $2) AS kudoed_by_me
`;

const POINT_CHUNK = 500;

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly db: DatabaseService) {}

  create(input: CreateActivityInput): Promise<string> {
    return this.db.withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO activities
          (user_id, type, title, started_at, elapsed_seconds, moving_seconds, distance_m,
           elevation_gain_m, calories, avg_speed_mps, max_speed_mps, avg_heart_rate, privacy)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          input.userId,
          input.type,
          input.title,
          input.startedAt,
          input.elapsedSeconds,
          input.movingSeconds,
          input.distanceM,
          input.elevationGainM,
          input.calories,
          input.avgSpeedMps,
          input.maxSpeedMps,
          input.avgHeartRate,
          input.privacy,
        ],
      );

      const activityId: string = inserted.rows[0].id;
      await this.insertPoints(client, activityId, input.points);

      if (input.points.length >= 2) {
        await client.query(
          `UPDATE activities SET route = (
             SELECT ST_MakeLine(location::geometry ORDER BY seq)::geography
             FROM activity_points WHERE activity_id = $1
           ) WHERE id = $1`,
          [activityId],
        );
      }

      return activityId;
    });
  }

  private async insertPoints(client: PoolClient, activityId: string, points: PointInput[]): Promise<void> {
    for (let start = 0; start < points.length; start += POINT_CHUNK) {
      const chunk = points.slice(start, start + POINT_CHUNK);
      const values: unknown[] = [activityId];
      const rows: string[] = [];

      chunk.forEach((point, index) => {
        const base = values.length;
        values.push(
          start + index,
          point.recordedAt,
          point.lng,
          point.lat,
          point.elevationM ?? null,
          point.heartRate ?? null,
          point.speedMps ?? null,
        );
        rows.push(
          `($1, $${base + 1}, $${base + 2}, ST_SetSRID(ST_MakePoint($${base + 3}, $${base + 4}), 4326)::geography, $${base + 5}, $${base + 6}, $${base + 7})`,
        );
      });

      await client.query(
        `INSERT INTO activity_points
          (activity_id, seq, recorded_at, location, elevation_m, heart_rate, speed_mps)
         VALUES ${rows.join(', ')}`,
        values,
      );
    }
  }

  getDetail(id: string, viewerId: string): Promise<ActivityDetailRow | null> {
    return this.db.queryOne<ActivityDetailRow>(
      `SELECT ${DETAIL_COLUMNS}
       FROM activities a
       JOIN users u ON u.id = a.user_id
       WHERE a.id = $1`,
      [id, viewerId],
    );
  }

  getOwnerPrivacy(id: string): Promise<OwnerPrivacyRow | null> {
    return this.db.queryOne<OwnerPrivacyRow>(
      'SELECT user_id, privacy FROM activities WHERE id = $1',
      [id],
    );
  }

  listByUser(
    userId: string,
    viewerId: string,
    cursor: Cursor | null,
    limit: number,
  ): Promise<ActivityDetailRow[]> {
    return this.db.query<ActivityDetailRow>(
      `SELECT ${DETAIL_COLUMNS}
       FROM activities a
       JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
         AND (
           $2 = a.user_id
           OR a.privacy = 'public'
           OR (a.privacy = 'followers' AND EXISTS (
             SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followee_id = a.user_id
           ))
         )
         AND ($3::timestamptz IS NULL OR (a.started_at, a.id) < ($3::timestamptz, $4::uuid))
       ORDER BY a.started_at DESC, a.id DESC
       LIMIT $5`,
      [userId, viewerId, cursor?.startedAt ?? null, cursor?.id ?? null, limit],
    );
  }

  async update(id: string, fields: { title?: string; privacy?: Privacy }): Promise<void> {
    const columns: Record<string, unknown> = {
      title: fields.title,
      privacy: fields.privacy,
    };
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;
    for (const [column, value] of Object.entries(columns)) {
      if (value === undefined) continue;
      sets.push(`${column} = $${index++}`);
      values.push(value);
    }
    if (sets.length === 0) return;
    values.push(id);
    await this.db.query(`UPDATE activities SET ${sets.join(', ')} WHERE id = $${index}`, values);
  }

  async remove(id: string): Promise<void> {
    await this.db.query('DELETE FROM activities WHERE id = $1', [id]);
  }

  getPoints(id: string): Promise<TrackPointRow[]> {
    return this.db.query<TrackPointRow>(
      `SELECT seq, recorded_at,
              ST_Y(location::geometry) AS lat,
              ST_X(location::geometry) AS lng,
              elevation_m, heart_rate, speed_mps
       FROM activity_points
       WHERE activity_id = $1
       ORDER BY seq`,
      [id],
    );
  }

  isFollower(followerId: string, followeeId: string): Promise<{ exists: boolean } | null> {
    return this.db.queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2) AS exists',
      [followerId, followeeId],
    );
  }

  async addPhoto(activityId: string, url: string): Promise<PhotoRow | null> {
    return this.db.queryOne<PhotoRow>(
      'INSERT INTO activity_photos (activity_id, url) VALUES ($1, $2) RETURNING *',
      [activityId, url],
    );
  }

  listPhotos(activityId: string): Promise<PhotoRow[]> {
    return this.db.query<PhotoRow>(
      'SELECT * FROM activity_photos WHERE activity_id = $1 ORDER BY created_at',
      [activityId],
    );
  }
}
