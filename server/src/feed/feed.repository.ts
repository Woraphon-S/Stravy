import { Injectable } from '@nestjs/common';
import { ActivityDetailRow } from '../activities/activity.types';
import { Cursor } from '../activities/cursor';
import { DatabaseService } from '../db/database.service';

@Injectable()
export class FeedRepository {
  constructor(private readonly db: DatabaseService) {}

  getFeed(viewerId: string, cursor: Cursor | null, limit: number): Promise<ActivityDetailRow[]> {
    return this.db.query<ActivityDetailRow>(
      `SELECT
         a.id, a.user_id, u.display_name AS author_name, u.photo_url AS author_photo,
         a.type, a.title, a.started_at, a.elapsed_seconds, a.moving_seconds, a.distance_m,
         a.elevation_gain_m, a.calories, a.avg_speed_mps, a.max_speed_mps, a.avg_heart_rate,
         a.privacy, a.created_at,
         (SELECT count(*) FROM kudos k WHERE k.activity_id = a.id) AS kudos_count,
         (SELECT count(*) FROM comments c WHERE c.activity_id = a.id) AS comment_count,
         EXISTS(SELECT 1 FROM kudos k WHERE k.activity_id = a.id AND k.user_id = $1) AS kudoed_by_me
       FROM activities a
       JOIN users u ON u.id = a.user_id
       WHERE (
         a.user_id = $1
         OR (
           a.privacy IN ('public', 'followers')
           AND EXISTS (
             SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followee_id = a.user_id
           )
         )
       )
       AND ($2::timestamptz IS NULL OR (a.started_at, a.id) < ($2::timestamptz, $3::uuid))
       ORDER BY a.started_at DESC, a.id DESC
       LIMIT $4`,
      [viewerId, cursor?.startedAt ?? null, cursor?.id ?? null, limit],
    );
  }
}
