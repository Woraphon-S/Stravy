import { Injectable } from '@nestjs/common';
import { mapActivityDetail } from '../activities/activity.mapper';
import { ActivityDetail } from '../activities/activity.types';
import { decodeCursor, encodeCursor } from '../activities/cursor';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedRepository } from './feed.repository';

@Injectable()
export class FeedService {
  constructor(private readonly repo: FeedRepository) {}

  async getFeed(
    viewerId: string,
    query: FeedQueryDto,
  ): Promise<{ items: ActivityDetail[]; nextCursor: string | null }> {
    const limit = query.limit ?? 20;
    const cursor = query.before ? decodeCursor(query.before) : null;
    const rows = await this.repo.getFeed(viewerId, cursor, limit);
    const items = rows.map((row) => mapActivityDetail(row));
    const last = rows[rows.length - 1];
    const nextCursor =
      rows.length === limit
        ? encodeCursor({ startedAt: last.started_at.toISOString(), id: last.id })
        : null;
    return { items, nextCursor };
  }
}
