import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityDetail } from '../activities/activity.types';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedService } from './feed.service';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get()
  get(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ): Promise<{ items: ActivityDetail[]; nextCursor: string | null }> {
    return this.feed.getFeed(user.id, query);
  }
}
