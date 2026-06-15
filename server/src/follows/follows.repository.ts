import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { UserRow } from '../users/user.types';

@Injectable()
export class FollowsRepository {
  constructor(private readonly db: DatabaseService) {}

  async follow(followerId: string, followeeId: string): Promise<void> {
    await this.db.query(
      'INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followeeId],
    );
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.db.query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [
      followerId,
      followeeId,
    ]);
  }

  listFollowers(userId: string): Promise<UserRow[]> {
    return this.db.query<UserRow>(
      `SELECT u.* FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.followee_id = $1
       ORDER BY u.display_name`,
      [userId],
    );
  }

  listFollowing(userId: string): Promise<UserRow[]> {
    return this.db.query<UserRow>(
      `SELECT u.* FROM follows f
       JOIN users u ON u.id = f.followee_id
       WHERE f.follower_id = $1
       ORDER BY u.display_name`,
      [userId],
    );
  }

  isFollowing(followerId: string, followeeId: string): Promise<{ exists: boolean } | null> {
    return this.db.queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2) AS exists',
      [followerId, followeeId],
    );
  }
}
