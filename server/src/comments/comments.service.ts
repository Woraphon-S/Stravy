import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { CommentOut, CommentRow } from './comment.types';
import { CommentsRepository } from './comments.repository';

@Injectable()
export class CommentsService {
  constructor(
    private readonly repo: CommentsRepository,
    private readonly activities: ActivitiesService,
  ) {}

  async add(activityId: string, userId: string, body: string): Promise<CommentOut> {
    await this.activities.ensureVisible(activityId, userId);
    const row = await this.repo.add(activityId, userId, body);
    if (!row) throw new InternalServerErrorException('Could not create comment');
    return this.map(row);
  }

  async list(activityId: string, viewerId: string): Promise<CommentOut[]> {
    await this.activities.ensureVisible(activityId, viewerId);
    const rows = await this.repo.list(activityId);
    return rows.map((row) => this.map(row));
  }

  async remove(commentId: string, viewerId: string): Promise<void> {
    const ownership = await this.repo.getOwnership(commentId);
    if (!ownership) throw new NotFoundException('Comment not found');
    if (ownership.comment_user_id !== viewerId && ownership.activity_user_id !== viewerId) {
      throw new ForbiddenException('You cannot delete this comment');
    }
    await this.repo.remove(commentId);
  }

  private map(row: CommentRow): CommentOut {
    return {
      id: row.id,
      activityId: row.activity_id,
      author: { id: row.user_id, displayName: row.author_name, photoUrl: row.author_photo },
      body: row.body,
      createdAt: row.created_at,
    };
  }
}
