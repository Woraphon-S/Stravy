import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { UserRow } from '../users/user.types';

@Injectable()
export class KudosRepository {
  constructor(private readonly db: DatabaseService) {}

  async add(userId: string, activityId: string): Promise<void> {
    await this.db.query(
      'INSERT INTO kudos (user_id, activity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, activityId],
    );
  }

  async remove(userId: string, activityId: string): Promise<void> {
    await this.db.query('DELETE FROM kudos WHERE user_id = $1 AND activity_id = $2', [
      userId,
      activityId,
    ]);
  }

  listUsers(activityId: string): Promise<UserRow[]> {
    return this.db.query<UserRow>(
      `SELECT u.* FROM kudos k
       JOIN users u ON u.id = k.user_id
       WHERE k.activity_id = $1
       ORDER BY k.created_at DESC`,
      [activityId],
    );
  }
}
