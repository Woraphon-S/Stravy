import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { CommentOwnershipRow, CommentRow } from './comment.types';

const COMMENT_COLUMNS = `
  c.id, c.activity_id, c.user_id, c.body, c.created_at,
  u.display_name AS author_name, u.photo_url AS author_photo
`;

@Injectable()
export class CommentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async add(activityId: string, userId: string, body: string): Promise<CommentRow | null> {
    const inserted = await this.db.queryOne<{ id: string }>(
      'INSERT INTO comments (activity_id, user_id, body) VALUES ($1, $2, $3) RETURNING id',
      [activityId, userId, body],
    );
    if (!inserted) return null;
    return this.getById(inserted.id);
  }

  getById(id: string): Promise<CommentRow | null> {
    return this.db.queryOne<CommentRow>(
      `SELECT ${COMMENT_COLUMNS}
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [id],
    );
  }

  list(activityId: string): Promise<CommentRow[]> {
    return this.db.query<CommentRow>(
      `SELECT ${COMMENT_COLUMNS}
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.activity_id = $1
       ORDER BY c.created_at`,
      [activityId],
    );
  }

  getOwnership(commentId: string): Promise<CommentOwnershipRow | null> {
    return this.db.queryOne<CommentOwnershipRow>(
      `SELECT c.user_id AS comment_user_id, a.user_id AS activity_user_id
       FROM comments c
       JOIN activities a ON a.id = c.activity_id
       WHERE c.id = $1`,
      [commentId],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.query('DELETE FROM comments WHERE id = $1', [id]);
  }
}
